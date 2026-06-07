import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

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

export const useLiveMatches = (sportKey: string = 'upcoming') => {
  return useQuery({
    queryKey: ['liveMatches', sportKey],
    queryFn: async () => {
      return apiClient.get(API_ENDPOINTS.matches.scores(sportKey));
    },
    refetchInterval: 30000,
  });
};