import axios from 'axios';

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