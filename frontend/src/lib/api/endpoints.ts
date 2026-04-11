export const API_ENDPOINTS = {
  // Authentication endpoints
  auth: {
    login: '/auth/login/',
    register: '/auth/register/',
    refresh: '/auth/token/refresh/',
    logout: '/auth/logout/',
    profile: '/auth/profile/',
    updateProfile: '/auth/profile/update/',
    changePassword: '/auth/change-password/',
    updatePreferences: '/auth/preferences/update/',
  },
  
  // Country and Currency endpoints
  countries: {
    list: '/auth/countries/',
    details: (id: string) => `/auth/countries/${id}/`,
  },
  
  currencies: {
    list: '/auth/currencies/',
    exchangeRates: '/auth/exchange-rates/',
    convert: '/auth/currencies/convert/',
  },
  
  // Match endpoints - UPDATED with all properties
  matches: {
    externalOdds: (leagueId: string | number) => `/matches/external/odds/${leagueId}/`,
    live: '/matches/live/',
    upcoming: '/matches/upcoming/',
    completed: '/matches/completed/',
    details: (id: string | number) => `/matches/${id}/`,
    stats: (id: string | number) => `/matches/${id}/stats/`,
    odds: (id: string | number) => `/matches/${id}/odds/`,
    headToHead: (team1Id: string | number, team2Id: string | number) => 
      `/matches/h2h/${team1Id}/${team2Id}/`,
    events: (id: string | number) => `/matches/${id}/events/`,
    lineup: (id: string | number, teamType: 'home' | 'away') => 
      `/matches/${id}/${teamType}-lineup/`,
    sports: '/matches/sports/',
    leagues: '/matches/leagues/',
    teams: '/matches/teams/',
  },
  
  // Betting endpoints
  betting: {
    place: '/bets/place/',
    myBets: '/betting/my-bets/',
    history: '/bets/history/',
    pending: '/betting/pending/',
    cashout: (id: number) => `/bets/${id}/cashout/`,
    parlay: '/betting/parlay/',
    betTypes: '/betting/bet-types/',
  },
  
  // Wallet endpoints
  wallet: {
    balance: '/wallet/balance/',
    deposit: '/wallet/deposit/',
    withdraw: '/wallet/withdraw/',
    transactions: '/wallet/transactions/',
  },
  
  // Leaderboard endpoints
  leaderboard: {
    list: '/leaderboard/',
    top: '/leaderboard/top/',
    weekly: '/leaderboard/weekly/',
    monthly: '/leaderboard/monthly/',
    allTime: '/leaderboard/all-time/',
    myRank: '/leaderboard/my-rank/',
  },
  
  // User endpoints
  user: {
    profile: '/user/profile/',
    updateProfile: '/user/profile/update/',
    settings: '/user/settings/',
    stats: '/user/stats/',
  },
};