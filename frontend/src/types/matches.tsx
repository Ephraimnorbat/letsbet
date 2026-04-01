export interface Team {
  id: number;
  name: string;
  logo?: string;
  score?: number;
}

export interface MatchStatus {
  description: string;
  code: string;
  elapsed?: number | null;
}

export interface LiveMatch {
  id: number;
  home: Team;
  away: Team;
  leagueId: number;
  leagueName?: string;
  leagueCountry?: string;
  leagueLogo?: string;
  status: MatchStatus;
  time: string;
  timeTS: number;
  statusId: number;
  tournamentStage: string;
  eliminatedTeamId: number | null;
}

export interface MatchDetails extends LiveMatch {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    season: number;
    round: string;
  };
  venue: {
    id: number;
    name: string;
    city: string;
  };
  date: string;
  timestamp: number;
  periods: {
    first: number | null;
    second: number | null;
  };
  referee: string | null;
  statistics: any[];
  lineups: any[];
  events: any[];
}

export interface ApiResponse {
  data: {
    response: {
      live: LiveMatch[];
    };
  };
  status: string;
}