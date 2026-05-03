'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

// ✅ LIVE MATCHES HOOK
export const useLiveMatches = (sportKey: string = 'upcoming') => {
  return useQuery({
    queryKey: ['liveMatches', sportKey],
    queryFn: () => apiClient.get(API_ENDPOINTS.matches.scores(sportKey)),
    refetchInterval: 30000, // auto refresh every 30s
  });
};

// ✅ UPCOMING MATCHES HOOK
export const useUpcomingMatches = (sportKey: string = 'upcoming') => {
  return useQuery({
    queryKey: ['upcomingMatches', sportKey],
    queryFn: () => apiClient.get(API_ENDPOINTS.matches.odds(sportKey)),
  });
};

// ✅ LINEUP HOOKS (Now correctly using your central config)
export const useHomeTeamLineup = (matchId: string) => {
  return useQuery({
    queryKey: ['match-lineup', matchId, 'home'],
    queryFn: () => apiClient.get(API_ENDPOINTS.matches.lineup(matchId)),
    enabled: !!matchId,
  });
};

export const useAwayTeamLineup = (matchId: string) => {
  return useQuery({
    queryKey: ['match-lineup', matchId, 'away'],
    queryFn: () => apiClient.get(API_ENDPOINTS.matches.lineup(matchId)),
    enabled: !!matchId,
  });
};