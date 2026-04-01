export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login/',
    register: '/auth/register/',
    logout: '/auth/logout/',
    profile: '/auth/profile/',
    updateProfile: '/auth/profile/update/',
    changePassword: '/auth/change-password/',
    stats: '/auth/stats/',
  },
  
  // Matches
  matches: {
    live: '/matches/live/',
    upcoming: '/matches/upcoming/',
    completed: '/matches/completed/',
    details: (id: string | number) => `/matches/${id}/`,
    sports: '/matches/sports/',
    leagues: '/matches/leagues/',
    teams: '/matches/teams/',
  },
  
  // Betting
  betting: {
    placeBet: '/betting/place/',
    parlay: '/betting/parlay/',
    myBets: '/betting/my-bets/',
    pendingBets: '/betting/pending/',
    history: '/betting/history/',
    cashout: (betId: number) => `/betting/cashout/${betId}/`,
    betTypes: '/betting/bet-types/',
  },
  
  // Wallet
  wallet: {
    balance: '/wallet/balance/',
    deposit: '/wallet/deposit/',
    withdraw: '/wallet/withdraw/',
    transactions: '/wallet/transactions/',
  },
  
  // Leaderboard
  leaderboard: {
    top: '/leaderboard/top/',
    weekly: '/leaderboard/weekly/',
    monthly: '/leaderboard/monthly/',
    allTime: '/leaderboard/all-time/',
    myRank: '/leaderboard/my-rank/',
  },
  
  // User
  user: {
    profile: '/auth/profile/',
    updateProfile: '/auth/profile/update/',
    stats: '/auth/stats/',
  },
  
  external: {
    liveMatches: '/matches/external/live/',
    fixtures: '/matches/external/fixtures/',
    matchStatistics: (matchId: string | number) => `/matches/external/statistics/${matchId}/`,
    leagueStandings: (leagueId: string | number) => `/matches/external/standings/${leagueId}/`,
    searchPlayers: (search: string) => `/matches/external/search-players/?search=${search}`,
  },
  
};