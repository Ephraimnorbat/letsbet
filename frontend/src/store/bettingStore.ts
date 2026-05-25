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
  // State
  selections: BetSelection[];
  currentBetSlip: {
    stake: number;
    totalOdds: number;
    potentialWin: number;
  };
  isLoading: boolean;
  error: string | null;
  myBets: any[];
  transactions: any[];
  
  // Actions
  addToBetSlip: (selection: BetSelection) => void;
  removeFromBetSlip: (id: string | number) => void;
  updateStake: (amount: number) => void;
  clearBetSlip: () => void;
  placeBet: () => Promise<void>;
  fetchMyBets: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  cashoutBet: (betId: number) => Promise<void>;
  loadSharedSelections: (sharedArray: BetSelection[]) => void; 
}

export const useBettingStore = create<BettingState>((set, get) => ({
  // --- Initial State ---
  selections: [],
  currentBetSlip: {
    stake: 0, 
    totalOdds: 1.0,
    potentialWin: 0,
  },
  isLoading: false,
  error: null,
  myBets: [],
  transactions: [],

  // --- Actions ---
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

    set({ isLoading: true, error: null });
    try {
      await apiClient.post(API_ENDPOINTS.betting.place, {
        selections,
        stake: currentBetSlip.stake,
      });
      toast.success('Bet placed successfully!');
      get().clearBetSlip();
      get().fetchMyBets();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMyBets: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(API_ENDPOINTS.betting.myBets);
      const rawData = response?.data || response;
      
      const bets = Array.isArray(rawData) 
        ? rawData 
        : (rawData?.results && Array.isArray(rawData.results))
          ? rawData.results 
          : [];

      set({ myBets: bets });
    } catch (error: any) {
      console.error("Failed to fetch bets:", error);
      set({ myBets: [], error: error.message }); 
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(API_ENDPOINTS.wallet.transactions);
      const data = response?.data?.results || response?.data || response;
      set({ transactions: Array.isArray(data) ? data : [] });
    } catch (error: any) {
      set({ error: 'Failed to fetch transactions' });
      toast.error('Could not load financial history');
    } finally {
      set({ isLoading: false });
    }
  },

  cashoutBet: async (betId) => {
    set({ isLoading: true });
    try {
      await apiClient.post(API_ENDPOINTS.betting.cashout(betId));
      toast.success('Cashed out successfully!');
      get().fetchMyBets();
    } catch (error: any) {
      toast.error('Cashout failed');
    } finally {
      set({ isLoading: false });
    }
  },

  // # Hydrates shared booking selections cleanly 
  loadSharedSelections: (sharedArray) => {
    const { currentBetSlip } = get();
    const computedOdds = sharedArray.reduce((acc, curr) => acc * curr.odds, 1);
    
    set({
      selections: sharedArray,
      currentBetSlip: {
        ...currentBetSlip,
        totalOdds: computedOdds,
        potentialWin: computedOdds * currentBetSlip.stake
      }
    });
  }
}));