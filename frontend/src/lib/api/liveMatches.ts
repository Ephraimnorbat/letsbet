import { apiClient } from './client';
import { API_ENDPOINTS } from './endpoints';

export class LiveMatchesService {
  private static instance: LiveMatchesService;

  static getInstance() {
    if (!LiveMatchesService.instance) {
      LiveMatchesService.instance = new LiveMatchesService();
    }
    return LiveMatchesService.instance;
  }

  // ✅ Production-ready: Uses the same endpoint as your hooks
  async getLiveMatches(sportKey: string = 'upcoming') {
    try {
      const response = await apiClient.get(API_ENDPOINTS.matches.scores(sportKey));
      // apiClient already returns data via interceptor, but handle both cases
      return response?.data || response || [];
    } catch (error) {
      console.error('Error fetching live matches:', error);
      return [];
    }
  }

  async getMatchDetails(matchId: string) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.matches.details(matchId));
      return response;
    } catch (error) {
      console.error('Error fetching match details:', error);
      return null;
    }
  }

  async getTeamDetails(teamId: string) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.matches.teams);
      const teams = response || [];
      return teams.find((team: any) => team.id === parseInt(teamId)) || null;
    } catch (error) {
      console.error('Error fetching team details:', error);
      return null;
    }
  }
}

export const liveMatchesService = LiveMatchesService.getInstance();