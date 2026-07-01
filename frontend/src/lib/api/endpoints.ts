export const API_ENDPOINTS = {
  // Authentication endpoints
  auth: {
    login: '/auth/login/',
    register: '/auth/register/',
    refresh: '/token/refresh/',
    logout: '/auth/logout/',
    profile: '/auth/profile/',
    updateProfile: '/auth/profile/update/',
    changePassword: '/auth/change-password/',
    updatePreferences: '/auth/preferences/update/',
    verify: '/auth/verify/',
    passwordResetRequest: '/auth/password-reset/request/',
    passwordResetConfirm: '/auth/password-reset/confirm/',
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
  
  matches: {
    live: '/matches/live/',
    upcoming: '/matches/upcoming/',
    completed: '/matches/completed/',
    all: '/matches/all/',  // ✅ Get ALL matches from database
    results: (sportKey: string) => `/matches/results/${sportKey}/`,
    details: (id: string | number) => `/matches/${id}/`,
    stats: (id: string | number) => `/matches/${id}/stats/`,
    odds: (sportKey: string) => `/matches/odds/${sportKey}/`,
    scores: (sportKey: string) => `/matches/scores/${sportKey}/`,
    upcomingOdds: '/matches/upcoming/odds/',
    headToHead: (team1Id: string | number, team2Id: string | number) => 
      `/matches/h2h/${team1Id}/${team2Id}/`,
    events: (id: string | number) => `/matches/${id}/events/`,
    lineup: (id: string | number) => `/matches/${id}/lineup/`,
    sports: '/matches/sports/',
    leagues: '/matches/leagues/',
    teams: '/matches/teams/',
    adminFixtures: '/matches/admin-fixtures/',
  },
  
  // Betting endpoints
  betting: {
    parlay: '/betting/parlay/',
    betTypes: '/betting/bet-types/',
    place: '/betting/place/',
    myBets: '/betting/my-bets/',
    pending: '/betting/pending/',
    history: '/betting/history/',
    upcoming: '/betting/matches/upcoming/',
    cashout: (id: number) => `/betting/cashout/${id}/`,
    shareSlip: '/betting/betslip/share/',
    loadSharedSlip: (code: string) => `/betting/betslip/load/${code}/`,
  },
  
  wallet: {
    balance: '/wallet/balance/',
    deposit: '/payments/deposit/',
    withdraw: '/payments/withdraw/',  // This will use your existing withdrawal endpoint
    transactions: '/wallet/transactions/',
    // Voucher endpoints
    redeemVoucher: '/wallet/vouchers/redeem/',
    createVoucher: '/wallet/vouchers/create_voucher/',
    voucherTypes: '/wallet/voucher-types/',
    voucherAudit: '/wallet/vouchers/audit_logs/',
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