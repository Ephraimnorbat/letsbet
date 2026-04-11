import axios from 'axios';
import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';
import { LeagueOddsResponse } from '@/types/matches';


/**
 * Fetches live betting odds for a specific league from our 
 * production-ready Django view (with Redis caching).
 */
export const fetchLeagueOdds = async (leagueId: number): Promise<LeagueOddsResponse> => {
  try {
    // We use the functional endpoint from our constants
    const response = await apiClient.get(API_ENDPOINTS.matches.externalOdds(leagueId));
    
    // Note: Since your apiClient response interceptor returns response.data,
    // we return the result directly.
    return response as unknown as LeagueOddsResponse;
  } catch (error) {
    // Errors are already toasted by your interceptor, but we throw for local handling
    console.error(`Error fetching odds for league ${leagueId}:`, error);
    throw error;
  }
};

/**
 * Fetches all available leagues/sports to populate sidebars or selectors
 */
export const fetchAvailableLeagues = async () => {
  const response = await apiClient.get(API_ENDPOINTS.matches.leagues);
  return response;
};


export class LiveMatchesService {
  private static instance: LiveMatchesService;

  static getInstance() {
    if (!LiveMatchesService.instance) {
      LiveMatchesService.instance = new LiveMatchesService();
    }
    return LiveMatchesService.instance;
  }

  // ✅ Fetch from YOUR DJANGO backend (not RapidAPI directly)
  async getLiveMatches() {
    try {
      const response = await fetch('/api/matches/external/live/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch live matches');
      }

      const data = await response.json();

      // Backend already returns clean array
      return data || [];
    } catch (error) {
      console.error('Error fetching live matches:', error);
      return [];
    }
  }

  async getMatchDetails(matchId: string) {
    try {
      const response = await fetch(`/api/matches/${matchId}/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch match details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching match details:', error);
      return null;
    }
  }

  async getTeamDetails(teamId: string) {
    try {
      const response = await fetch(`/api/teams/${teamId}/`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch team details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching team details:', error);
      return null;
    }
  }
}

export const liveMatchesService = LiveMatchesService.getInstance();