'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

export interface CrashGameState {
  status: 'lobby' | 'running' | 'crashed';
  roundNumber: number;
  countdown?: number;
  multiplier?: number;
  crashPoint?: number;
}

export function useCrashWebSocket() {
  const [gameState, setGameState] = useState<CrashGameState>({
    status: 'lobby',
    roundNumber: 0,
    countdown: 0,
    multiplier: 1.0,
  });

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const queuedBetsRef = useRef<{ panelId: 1 | 2; amount: number }[]>([]);
  const [activeQueuedPanels, setActiveQueuedPanels] = useState<number[]>([]);

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000/ws/casino/crash/';

  const placeBet = useCallback((amount: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'place_bet', amount }));
    }
  }, []);

  const cashout = useCallback((currentMultiplier: number) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'cashout', current_multiplier: currentMultiplier }));
    }
  }, []);

  const queueBetForNextRound = useCallback((panelId: 1 | 2, amount: number) => {
    queuedBetsRef.current.push({ panelId, amount });
    setActiveQueuedPanels(prev => [...prev, panelId]);
  }, []);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // 1. Update Core Flight State
        if (message.status) {
          setGameState({
            status: message.status,
            roundNumber: message.round_number,
            countdown: message.countdown,
            multiplier: message.multiplier,
            crashPoint: message.crash_point,
          });
        }

        // 2. Intercept balance push updates sent straight over WebSockets from Django
        if (message.balance !== undefined) {
          useAuthStore.setState((state) => ({
            user: state.user ? { ...state.user, balance: message.balance } : null
          }));
        }

        // 3. Fire queued bets on lobby state transition
        if (message.status === 'lobby' && queuedBetsRef.current.length > 0) {
          queuedBetsRef.current.forEach(bet => {
            placeBet(bet.amount);
          });
          queuedBetsRef.current = [];
          setActiveQueuedPanels([]);
        }

      } catch (err) {
        console.error('Packet parsing error:', err);
      }
    };

    socket.onclose = () => {
      reconnectTimeout.current = setTimeout(() => connect(), 2000);
    };

    ws.current = socket;
  }, [wsUrl, placeBet]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
      }
    };
  }, [connect]);

  return { 
    gameState, 
    placeBet, 
    cashout, 
    queueBetForNextRound, 
    activeQueuedPanels,
    isConnected: ws.current?.readyState === WebSocket.OPEN 
  };
}