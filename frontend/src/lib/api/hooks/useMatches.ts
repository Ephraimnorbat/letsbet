'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

// ✅ LIVE MATCHES HOOK
export const useLiveMatches = (sportKey?: string) => {
  const activeKey = sportKey ?? 'upcoming';

  return useQuery({
    queryKey: ['liveMatches', activeKey],
    queryFn: () => apiClient.get(API_ENDPOINTS.matches.scores(activeKey)),
    refetchInterval: 30000, 
  });
};

// ✅ UPCOMING MATCHES HOOK
export const useUpcomingMatches = (sportKey: string = 'upcoming') => {
  return useQuery({
    queryKey: ['upcomingMatches', sportKey],
    queryFn: () => apiClient.get(API_ENDPOINTS.matches.odds(sportKey)),
  });
};

// ✅ MATCH DETAILS HOOK
export const useMatchDetails = (matchId: string) => {
  return useQuery({
    queryKey: ['matchDetails', matchId],
    queryFn: () => apiClient.get(API_ENDPOINTS.matches.details ? API_ENDPOINTS.matches.details(matchId) : `/api/matches/${matchId}/`),
    enabled: !!matchId,
  });
};

// ✅ FIXED: MATCH STATISTICS HOOK
export const useMatchStatistics = (matchId: string) => {
  return useQuery({
    queryKey: ['matchStatistics', matchId],
    // Updated ternary from .statistics to check and evaluate your valid configured .stats() method wrapper
    queryFn: () => apiClient.get((API_ENDPOINTS.matches as any).stats ? (API_ENDPOINTS.matches as any).stats(matchId) : `/api/matches/${matchId}/statistics/`),
    enabled: !!matchId,
  });
};

// ✅ LINEUP HOOKS
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