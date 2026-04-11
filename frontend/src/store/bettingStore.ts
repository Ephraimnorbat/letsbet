import { create } from 'zustand';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

export interface BetSelection {
  id: string | number;
  matchId: string | number;
  matchName: string;
  selection: string;
  odds: number;
}

interface BettingState {
  selections: BetSelection[];
  currentBetSlip: {
    stake: number;
    totalOdds: number;
    potentialWin: number;
  };
  isLoading: boolean;
  myBets: any[];
  addToBetSlip: (selection: BetSelection) => void;
  removeFromBetSlip: (id: string | number) => void;
  updateStake: (amount: number) => void;
  clearBetSlip: () => void;
  placeBet: () => Promise<void>;
  fetchMyBets: () => Promise<void>;
  cashoutBet: (betId: number) => Promise<void>;
}

export const useBettingStore = create<BettingState>((set, get) => ({
  selections: [],
  currentBetSlip: {
    stake: 0, 
    totalOdds: 1.0,
    potentialWin: 0,
  },
  isLoading: false,
  myBets: [],

  addToBetSlip: (selection) => {
    const { selections, currentBetSlip } = get();
    const filtered = selections.filter(s => s.matchId !== selection.matchId);
    const newSelections = [...filtered, selection];
    const newOdds = newSelections.reduce((acc, curr) => acc * curr.odds, 1);
    
    set({ 
      selections: newSelections,
      currentBetSlip: {
        ...currentBetSlip,
        totalOdds: newOdds,
        potentialWin: newOdds * currentBetSlip.stake
      }
    });
    toast.success(`Added ${selection.matchName}`);
  },

  removeFromBetSlip: (id) => {
    const { selections, currentBetSlip } = get();
    const newSelections = selections.filter(s => s.id !== id);
    const newOdds = newSelections.reduce((acc, curr) => acc * curr.odds, 1);
    set({ 
      selections: newSelections,
      currentBetSlip: {
        ...currentBetSlip,
        totalOdds: newOdds,
        potentialWin: newOdds * currentBetSlip.stake
      }
    });
  },

  updateStake: (amount) => {
    const { currentBetSlip } = get();
    set({
      currentBetSlip: {
        ...currentBetSlip,
        stake: amount,
        potentialWin: amount * currentBetSlip.totalOdds
      }
    });
  },

  clearBetSlip: () => set({ 
    selections: [], 
    currentBetSlip: { stake: 0, totalOdds: 1.0, potentialWin: 0 } 
  }),

  placeBet: async () => {
    const { selections, currentBetSlip } = get();
    if (selections.length === 0) return;

    set({ isLoading: true });
    try {
      await apiClient.post(API_ENDPOINTS.betting.place, {
        selections,
        stake: currentBetSlip.stake,
      });
      toast.success('Bet placed successfully!');
      get().clearBetSlip();
      get().fetchMyBets();
    } catch (error: any) {
      // Handled by API interceptor
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyBets: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get(API_ENDPOINTS.betting.myBets);
      set({ myBets: response.data || response });
    } finally {
      set({ isLoading: false });
    }
  },

  cashoutBet: async (betId) => {
    try {
      await apiClient.post(API_ENDPOINTS.betting.cashout(betId));
      toast.success('Cashed out successfully!');
      get().fetchMyBets();
    } catch (error) {}
  }
}));