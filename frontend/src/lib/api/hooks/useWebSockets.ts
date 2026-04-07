import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useCurrencyWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();
  
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
    const websocket = new WebSocket(`${wsUrl}/currency/`);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'rate_update' && user?.preferred_currency) {
        // Update user's currency rate in real-time
        if (data.currency === user.preferred_currency.code) {
          useAuthStore.setState((state) => ({
            user: state.user ? {
              ...state.user,
              preferred_currency: {
                ...state.user.preferred_currency,
                exchange_rate_to_kES: data.rate
              }
            } : null
          }));
        }
      }
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        setSocket(new WebSocket(wsUrl));
      }, 5000);
    };
    
    setSocket(websocket);
    
    return () => {
      websocket.close();
    };
  }, []);
  
  const sendMessage = useCallback((message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    }
  }, [socket, isConnected]);
  
  return { isConnected, sendMessage };
}