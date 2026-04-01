import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface LiveMatch {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      elapsed: number;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
    };
    away: {
      id: number;
      name: string;
    };
  };
  goals: {
    home: number;
    away: number;
  };
}

export const useLiveMatches = () => {
  return useQuery({
    queryKey: ['live-matches-external'],
    queryFn: async () => {
      const response = await apiClient.get('/matches/external/live/');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000,
  });
};