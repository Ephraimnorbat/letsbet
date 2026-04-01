import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import toast from 'react-hot-toast';

export interface Match {
  id: number;
  home_team_name: string;
  away_team_name: string;
  match_date: string;
  status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'cancelled' | 'postponed';
  home_score: number;
  away_score: number;
  home_odds: number;
  draw_odds: number;
  away_odds: number;
  league_name: string;
  home_possession?: number;
  away_possession?: number;
  home_shots?: number;
  away_shots?: number;
}

export const useLiveMatches = () => {
  return useQuery({
    queryKey: ['live-matches'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.matches.live);
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useUpcomingMatches = () => {
  return useQuery({
    queryKey: ['upcoming-matches'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.matches.upcoming);
      return response.data;
    },
  });
};

export const useMatchDetails = (matchId: string | number) => {
  return useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.matches.details(matchId));
      return response.data;
    },
    enabled: !!matchId,
  });
};