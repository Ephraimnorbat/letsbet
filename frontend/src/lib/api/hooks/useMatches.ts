'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

// ✅ ALL MATCHES FROM DATABASE (BOTH EXTERNAL AND ADMIN-CREATED)
export const useAllMatches = (leagueId?: string) => {
  const url = leagueId 
    ? `${API_ENDPOINTS.matches.all}?league=${leagueId}`
    : API_ENDPOINTS.matches.all;
  
  return useQuery({
    queryKey: ['allMatches', leagueId],
    queryFn: () => apiClient.get(url),
    refetchInterval: 60000, // Refresh every minute
  });
};

// ✅ LIVE MATCHES FROM DATABASE
export const useLiveMatches = () => {
  return useQuery({
    queryKey: ['liveMatches'],
    queryFn: () => apiClient.get(API_ENDPOINTS.matches.live),
    refetchInterval: 30000,
  });
};

// ✅ UPCOMING MATCHES FROM DATABASE
export const useUpcomingMatches = () => {
  return useQuery({
    queryKey: ['upcomingMatches'],
    queryFn: () => apiClient.get(API_ENDPOINTS.matches.upcoming),
    refetchInterval: 60000,
  });
};

// ✅ MATCH RESULTS (COMPLETED MATCHES)
export const useMatchResults = (sportKey: string = 'upcoming') => {
  return useQuery({
    queryKey: ['matchResults', sportKey],
    queryFn: () => apiClient.get(API_ENDPOINTS.matches.results(sportKey)),
    refetchInterval: 120000, // Refresh every 2 minutes
  });
};

// ✅ ODDS FOR SPECIFIC SPORT
export const useSportOdds = (sportKey: string) => {
  return useQuery({
    queryKey: ['sportOdds', sportKey],
    queryFn: () => apiClient.get(API_ENDPOINTS.matches.odds(sportKey)),
    enabled: !!sportKey,
    refetchInterval: 60000,
  });
};

// ✅ UPCOMING ODDS (ALL SPORTS)
export const useUpcomingOdds = () => {
  return useQuery({
    queryKey: ['upcomingOdds'],
    queryFn: () => apiClient.get(API_ENDPOINTS.matches.upcomingOdds),
    refetchInterval: 60000,
  });
};

// ✅ MATCH DETAILS
export const useMatchDetails = (matchId: string) => {
  return useQuery({
    queryKey: ['matchDetails', matchId],
    queryFn: () => apiClient.get(API_ENDPOINTS.matches.details(matchId)),
    enabled: !!matchId,
  });
};

// ✅ MATCH STATISTICS
export const useMatchStatistics = (matchId: string) => {
  return useQuery({
    queryKey: ['matchStatistics', matchId],
    queryFn: () => apiClient.get(API_ENDPOINTS.matches.stats(matchId)),
    enabled: !!matchId,
  });
};

// ✅ LEAGUES LIST
export const useLeagues = () => {
  return useQuery({
    queryKey: ['leagues'],
    queryFn: () => apiClient.get(API_ENDPOINTS.matches.leagues),
    staleTime: 600000, // 10 minutes
  });
};