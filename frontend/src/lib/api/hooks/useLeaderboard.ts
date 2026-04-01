import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface LeaderboardEntry {
  rank: number;
  username: string;
  points: number;
  wins: number;
  profit: number;
}

export const useLeaderboard = (period: 'weekly' | 'monthly' | 'all-time' = 'weekly') => {
  return useQuery({
    queryKey: ['leaderboard', period],
    queryFn: async () => {
      let endpoint;
      switch (period) {
        case 'weekly':
          endpoint = API_ENDPOINTS.leaderboard.weekly;
          break;
        case 'monthly':
          endpoint = API_ENDPOINTS.leaderboard.monthly;
          break;
        case 'all-time':
          endpoint = API_ENDPOINTS.leaderboard.allTime;
          break;
      }
      const response = await apiClient.get(endpoint);
      return response.data;
    },
  });
};

export const useUserRank = () => {
  return useQuery({
    queryKey: ['user-rank'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.leaderboard.myRank);
      return response.data;
    },
  });
};