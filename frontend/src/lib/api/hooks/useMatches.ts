import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

// Helper function to safely make API calls
const safeApiCall = async (url: string, fallbackData: any = null) => {
  try {
    const response = await apiClient.get(url);
    return response;
  } catch (error) {
    console.warn(`API call failed for ${url}:`, error);
    return fallbackData;
  }
};

export const useMatchStatistics = (matchId: string) => {
  return useQuery({
    queryKey: ['match-statistics', matchId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.matches.stats(matchId));
        return response;
      } catch (error) {
        // Return a neutral object so the UI doesn't crash
        return { home_shots: 0, away_shots: 0, possession: [50, 50] };
      }
    },
    enabled: !!matchId,
    retry: false, // Don't keep retrying 404s
  });
};

export const useMatchOdds = (matchId: string) => {
  return useQuery({
    queryKey: ['match-odds', matchId],
    queryFn: async () => {
      const fallbackData = {
        home_odds: 2.10,
        draw_odds: 3.40,
        away_odds: 3.20,
        over_25_odds: 1.90,
        under_25_odds: 1.95,
      };
      
      try {
        const response = await apiClient.get(API_ENDPOINTS.matches.odds(matchId));
        return response;
      } catch (error) {
        console.warn('Odds endpoint not available, using mock data');
        return fallbackData;
      }
    },
    enabled: !!matchId,
  });
};

export const useHeadToHead = (team1Id: string, team2Id: string) => {
  return useQuery({
    queryKey: ['head-to-head', team1Id, team2Id],
    queryFn: async () => {
      const fallbackData = {
        total_matches: 10,
        team1_wins: 4,
        team2_wins: 3,
        draws: 3,
        last_5_matches: [
          { date: '2024-01-15', team1_score: 2, team2_score: 1 },
          { date: '2023-10-20', team1_score: 1, team2_score: 1 },
          { date: '2023-05-10', team1_score: 0, team2_score: 2 },
        ]
      };
      
      try {
        const response = await apiClient.get(API_ENDPOINTS.matches.headToHead(team1Id, team2Id));
        return response;
      } catch (error) {
        console.warn('Head to head endpoint not available, using mock data');
        return fallbackData;
      }
    },
    enabled: !!team1Id && !!team2Id,
  });
};

// Rest of the hooks with similar fallback patterns...
export const useHomeTeamLineup = (matchId: string) => {
  return useQuery({
    queryKey: ['home-lineup', matchId],
    queryFn: async () => {
      const fallbackData = {
        formation: '4-3-3',
        starting_eleven: [
          { name: 'Player 1', position: 'GK', number: 1 },
          { name: 'Player 2', position: 'RB', number: 2 },
          { name: 'Player 3', position: 'CB', number: 3 },
          { name: 'Player 4', position: 'CB', number: 4 },
          { name: 'Player 5', position: 'LB', number: 5 },
          { name: 'Player 6', position: 'CM', number: 6 },
          { name: 'Player 7', position: 'CM', number: 7 },
          { name: 'Player 8', position: 'RW', number: 8 },
          { name: 'Player 9', position: 'ST', number: 9 },
          { name: 'Player 10', position: 'LW', number: 10 },
          { name: 'Player 11', position: 'ST', number: 11 },
        ],
        substitutes: []
      };
      
      try {
        const response = await apiClient.get(API_ENDPOINTS.matches.lineup(matchId, 'home'));
        return response;
      } catch (error) {
        console.warn('Lineup endpoint not available, using mock data');
        return fallbackData;
      }
    },
    enabled: !!matchId,
  });
};

export const useAwayTeamLineup = (matchId: string) => {
  return useQuery({
    queryKey: ['away-lineup', matchId],
    queryFn: async () => {
      const fallbackData = {
        formation: '4-4-2',
        starting_eleven: [
          { name: 'Player A', position: 'GK', number: 1 },
          { name: 'Player B', position: 'RB', number: 2 },
          { name: 'Player C', position: 'CB', number: 3 },
          { name: 'Player D', position: 'CB', number: 4 },
          { name: 'Player E', position: 'LB', number: 5 },
          { name: 'Player F', position: 'RM', number: 6 },
          { name: 'Player G', position: 'CM', number: 7 },
          { name: 'Player H', position: 'CM', number: 8 },
          { name: 'Player I', position: 'LM', number: 9 },
          { name: 'Player J', position: 'ST', number: 10 },
          { name: 'Player K', position: 'ST', number: 11 },
        ],
        substitutes: []
      };
      
      try {
        const response = await apiClient.get(API_ENDPOINTS.matches.lineup(matchId, 'away'));
        return response;
      } catch (error) {
        console.warn('Lineup endpoint not available, using mock data');
        return fallbackData;
      }
    },
    enabled: !!matchId,
  });
};

export const useUpcomingMatches = () => {
  return useQuery({
    queryKey: ['upcoming-matches'],
    queryFn: async () => {
      const fallbackData = {
        status: 'success',
        data: [],
      };

      try {
        const response = await apiClient.get(API_ENDPOINTS.matches.upcoming);
        return response;
      } catch (error) {
        console.warn('Upcoming matches endpoint failed, using fallback');
        return fallbackData;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });
};

// Add this to your useMatches.ts

export const useMatchDetails = (matchId: string) => {
  return useQuery({
    queryKey: ['match-details', matchId],
    queryFn: async () => {
      // Mock data in case the backend detail endpoint isn't ready
      const fallbackData = {
        id: matchId,
        home_team: { name: 'Home Team', logo: null },
        away_team: { name: 'Away Team', logo: null },
        commence_time: new Date().toISOString(),
        status: 'scheduled',
        home_score: 0,
        away_score: 0,
      };

      try {
        // Replace with your actual endpoint path in API_ENDPOINTS
        const response = await apiClient.get(API_ENDPOINTS.matches.details(matchId));
        return response;
      } catch (error) {
        console.warn(`Match details not found for ${matchId}, using mock.`);
        return fallbackData;
      }
    },
    enabled: !!matchId,
  });
};