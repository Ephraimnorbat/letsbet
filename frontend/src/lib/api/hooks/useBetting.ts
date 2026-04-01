import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

export interface Bet {
  id: number;
  match: number;
  match_details: {
    home_team_name: string;
    away_team_name: string;
  };
  bet_type: number;
  selection: string;
  odds: number;
  stake: number;
  potential_win: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled' | 'cashed_out';
  created_at: string;
}

export const usePlaceBet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (betData: any) => {
      const response = await apiClient.post(API_ENDPOINTS.betting.placeBet, betData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bets'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      toast.success('Bet placed successfully!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to place bet';
      toast.error(message);
    },
  });
};

export const useMyBets = () => {
  return useQuery({
    queryKey: ['user-bets'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.betting.myBets);
      return response.data;
    },
  });
};

export const usePendingBets = () => {
  return useQuery({
    queryKey: ['pending-bets'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.betting.pendingBets);
      return response.data;
    },
    refetchInterval: 10000, // Check every 10 seconds for updates
  });
};

export const useCashoutBet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (betId: number) => {
      const response = await apiClient.post(API_ENDPOINTS.betting.cashout(betId));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-bets'] });
      queryClient.invalidateQueries({ queryKey: ['user-bets'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      toast.success('Bet cashed out successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to cashout bet');
    },
  });
};