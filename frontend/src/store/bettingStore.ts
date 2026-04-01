import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

export interface BetSelection {
  id: string;
  matchId: number;
  matchName: string;
  homeTeam: string;
  awayTeam: string;
  selection: string;
  odds: number;
  league: string;
  matchDate: string;
}

export interface Bet {
  id: number;
  match: number;
  match_details: {
    home_team_name: string;
    away_team_name: string;
    league_name: string;
    match_date: string;
  };
  selection: string;
  odds: number;
  stake: number;
  potential_win: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled' | 'cashed_out';
  created_at: string;
  settled_at?: string;
}

interface BettingState {
  selections: BetSelection[];
  currentBetSlip: {
    selections: BetSelection[];
    totalOdds: number;
    stake: number;
    potentialWin: number;
  };
  myBets: Bet[];
  isLoading: boolean;
  
  // Actions
  addToBetSlip: (selection: Omit<BetSelection, 'id'>) => void;
  removeFromBetSlip: (id: string) => void;
  clearBetSlip: () => void;
  updateStake: (stake: number) => void;
  placeBet: () => Promise<void>;
  fetchMyBets: () => Promise<void>;
  cashoutBet: (betId: number) => Promise<void>;
  calculatePotentialWin: () => number;
}

export const useBettingStore = create<BettingState>()(
  persist(
    (set, get) => ({
      selections: [],
      currentBetSlip: {
        selections: [],
        totalOdds: 1,
        stake: 0,
        potentialWin: 0,
      },
      myBets: [],
      isLoading: false,

      addToBetSlip: (selection) => {
        const id = `${selection.matchId}-${selection.selection}-${Date.now()}`;
        const newSelection = { ...selection, id };
        
        set((state) => {
          const updatedSelections = [...state.selections, newSelection];
          const totalOdds = updatedSelections.reduce((acc, s) => acc * s.odds, 1);
          const stake = state.currentBetSlip.stake;
          const potentialWin = stake * totalOdds;
          
          return {
            selections: updatedSelections,
            currentBetSlip: {
              selections: updatedSelections,
              totalOdds,
              stake,
              potentialWin,
            },
          };
        });
        
        toast.success(`${selection.selection.toUpperCase()} @ ${selection.odds} added`, {
          icon: '📋',
        });
      },

      removeFromBetSlip: (id) => {
        set((state) => {
          const updatedSelections = state.selections.filter((s) => s.id !== id);
          const totalOdds = updatedSelections.reduce((acc, s) => acc * s.odds, 1);
          const stake = state.currentBetSlip.stake;
          const potentialWin = stake * totalOdds;
          
          return {
            selections: updatedSelections,
            currentBetSlip: {
              selections: updatedSelections,
              totalOdds,
              stake,
              potentialWin,
            },
          };
        });
        
        toast.success('Selection removed');
      },

      clearBetSlip: () => {
        set({
          selections: [],
          currentBetSlip: {
            selections: [],
            totalOdds: 1,
            stake: 0,
            potentialWin: 0,
          },
        });
      },

      updateStake: (stake) => {
        set((state) => {
          const potentialWin = stake * state.currentBetSlip.totalOdds;
          return {
            currentBetSlip: {
              ...state.currentBetSlip,
              stake,
              potentialWin,
            },
          };
        });
      },

      calculatePotentialWin: () => {
        const { stake, totalOdds } = get().currentBetSlip;
        return stake * totalOdds;
      },

      placeBet: async () => {
        const { selections, currentBetSlip } = get();
        
        if (selections.length === 0) {
          toast.error('Please add selections to your bet slip');
          return;
        }
        
        if (currentBetSlip.stake <= 0) {
          toast.error('Please enter a valid stake amount');
          return;
        }
        
        set({ isLoading: true });
        
        try {
          const betData = {
            selections: selections.map(s => ({
              match_id: s.matchId,
              selection: s.selection,
              odds: s.odds,
            })),
            stake: currentBetSlip.stake,
            total_odds: currentBetSlip.totalOdds,
            potential_win: currentBetSlip.potentialWin,
          };
          
          const response = await apiClient.post(API_ENDPOINTS.betting.placeBet, betData);
          
          if (response.data.status === 'success') {
            toast.success('Bet placed successfully!');
            get().clearBetSlip();
            get().fetchMyBets();
          }
        } catch (error: any) {
          const message = error.response?.data?.error || 'Failed to place bet';
          toast.error(message);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchMyBets: async () => {
        try {
          const response = await apiClient.get(API_ENDPOINTS.betting.myBets);
          set({ myBets: response.data.results || response.data });
        } catch (error) {
          console.error('Failed to fetch bets:', error);
        }
      },

      cashoutBet: async (betId: number) => {
        set({ isLoading: true });
        
        try {
          const response = await apiClient.post(API_ENDPOINTS.betting.cashout(betId));
          
          if (response.data.status === 'success') {
            toast.success(`Bet cashed out! Received ${response.data.cashout_amount}`);
            get().fetchMyBets();
          }
        } catch (error: any) {
          const message = error.response?.data?.error || 'Failed to cashout bet';
          toast.error(message);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'betting-slip-storage',
      partialize: (state) => ({
        selections: state.selections,
        currentBetSlip: {
          selections: state.currentBetSlip.selections,
          totalOdds: state.currentBetSlip.totalOdds,
          stake: state.currentBetSlip.stake,
          potentialWin: state.currentBetSlip.potentialWin,
        },
      }),
    }
  )
);