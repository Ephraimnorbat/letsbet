export interface SystemMetric {
  active_players: number;
  total_pool_value: number;
  system_multiplier_ceiling: number;
  websocket_status: 'healthy' | 'degraded' | 'offline';
}

export interface EndpointRoute {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  category: 'Game Control' | 'Wallet Engine' | 'User Registry' | 'Security';
  description: string;
}

export interface AdminUserPayload {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  total_bets: number;
  wallet_balance: number;
  created_at: string;
}

export interface AdminWalletPayload {
  id: number;
  username: string;
  balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_won: number;
}

export interface MatchFormData {
  league: string;
  home_team: string;
  away_team: string;
  match_date: string;
  status: string;
  home_score: number;
  away_score: number;
  home_odds: string;
  draw_odds: string;
  away_odds: string;
}

export interface LeagueFormData {
  name: string;
  sport: string;
  country: string;
  is_active: boolean;
}

export type ActiveTab = 'telemetry' | 'users' | 'wallets' | 'fixtures' | 'deposits' | 'withdrawals'| 'vouchers';
export type FixtureSubTab = 'matches' | 'leagues';