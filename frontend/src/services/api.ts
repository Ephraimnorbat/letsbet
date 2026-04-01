import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  balance: number;
  currency: string;
  createdAt: string;
}

export interface Bet {
  id: string;
  userId: string;
  matchId: string;
  market: string;
  outcome: string;
  odds: number;
  stake: number;
  potentialWin: number;
  status: 'pending' | 'won' | 'lost' | 'void';
  createdAt: string;
}

export interface Match {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  isLive: boolean;
  markets: Market[];
}

export interface Market {
  id: string;
  name: string;
  outcomes: Outcome[];
}

export interface Outcome {
  id: string;
  name: string;
  odds: number;
}

export interface DepositRequest {
  amount: number;
  currency: 'BTC' | 'ETH' | 'USDT' | 'SOL';
  walletAddress?: string;
}

export interface WithdrawRequest {
  amount: number;
  currency: 'BTC' | 'ETH' | 'USDT' | 'SOL';
  walletAddress: string;
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to inject JWT token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          this.handleUnauthorized();
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else if (error.response?.data?.message) {
          toast.error(error.response.data.message);
        } else if (error.code === 'ECONNABORTED') {
          toast.error('Request timeout. Please check your connection.');
        } else {
          toast.error('An unexpected error occurred.');
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  private removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private handleUnauthorized() {
    this.removeToken();
    toast.error('Session expired. Please login again.');
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.api.post('/auth/login', credentials);
    const { user, token } = response.data;
    this.setToken(token);
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.api.post('/auth/register', userData);
    const { user, token } = response.data;
    this.setToken(token);
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    const response = await this.api.post('/auth/logout');
    this.removeToken();
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Sports endpoints
  async getMatches(sport?: string, isLive?: boolean): Promise<ApiResponse<Match[]>> {
    const params = new URLSearchParams();
    if (sport) params.append('sport', sport);
    if (isLive !== undefined) params.append('isLive', isLive.toString());
    
    const response = await this.api.get(`/sports/matches?${params}`);
    return response.data;
  }

  async getMatchById(matchId: string): Promise<ApiResponse<Match>> {
    const response = await this.api.get(`/sports/matches/${matchId}`);
    return response.data;
  }

  async getSports(): Promise<ApiResponse<string[]>> {
    const response = await this.api.get('/sports');
    return response.data;
  }

  // Betting endpoints
  async placeBet(betData: {
    matchId: string;
    market: string;
    outcome: string;
    odds: number;
    stake: number;
  }): Promise<ApiResponse<Bet>> {
    const response = await this.api.post('/bets', betData);
    return response.data;
  }

  async getBetHistory(): Promise<ApiResponse<Bet[]>> {
    const response = await this.api.get('/bets/history');
    return response.data;
  }

  async getActiveBets(): Promise<ApiResponse<Bet[]>> {
    const response = await this.api.get('/bets/active');
    return response.data;
  }

  // Payment endpoints
  async deposit(depositData: DepositRequest): Promise<ApiResponse<{ paymentUrl: string; depositId: string }>> {
    const response = await this.api.post('/payments/deposit', depositData);
    return response.data;
  }

  async withdraw(withdrawData: WithdrawRequest): Promise<ApiResponse<{ withdrawalId: string }>> {
    const response = await this.api.post('/payments/withdraw', withdrawData);
    return response.data;
  }

  async getTransactionHistory(): Promise<ApiResponse<any[]>> {
    const response = await this.api.get('/payments/history');
    return response.data;
  }

  // Referral endpoints
  async getReferralCode(): Promise<ApiResponse<{ code: string; link: string }>> {
    const response = await this.api.get('/referral/code');
    return response.data;
  }

  async getReferralStats(): Promise<ApiResponse<{ referrals: number; earnings: number }>> {
    const response = await this.api.get('/referral/stats');
    return response.data;
  }

  async claimReferralReward(): Promise<ApiResponse<{ reward: number }>> {
    const response = await this.api.post('/referral/claim');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
