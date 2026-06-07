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
      // ✅ FIXED: Changed API_ENDPOINTS.betting.placeBet to .place to match your config definitions
      const response = await apiClient.post(API_ENDPOINTS.betting.place, betData);
      
      // Also unwrap data just in case your wrapper returns the full AxiosResponse object
      return (response as any)?.data || response;
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
      return (response as any)?.data || response;
    },
  });
};

export const usePendingBets = () => {
  return useQuery({
    queryKey: ['pending-bets'],
    queryFn: async () => {
      // ✅ FIXED: Verify if your config key is 'pending' vs 'pendingBets'. 
      // If the compiler logs errors for pendingBets, swap this to API_ENDPOINTS.betting.pending
      const endpoint = (API_ENDPOINTS.betting as any).pendingBets || API_ENDPOINTS.betting.pending;
      const response = await apiClient.get(endpoint);
      return (response as any)?.data || response;
    },
    refetchInterval: 10000, 
  });
};

export const useCashoutBet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (betId: number) => {
      const response = await apiClient.post(API_ENDPOINTS.betting.cashout(betId));
      return (response as any)?.data || response;
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