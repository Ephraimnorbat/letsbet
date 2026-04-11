import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate_to_kES: number;
}

interface Country {
  id: number;
  code: string;
  name: string;
  phone_code: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  phone_number?: string;
  profile_picture?: string;
  total_bets: number;
  total_wins: number;
  total_profit: number;
  country?: Country;
  preferred_currency?: Currency;
  country_name?: string;
  currency_code?: string;
  currency_symbol?: string;
  exchange_rate: number;   
  balance?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string, loginType?: 'email' | 'phone') => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePreferences: (countryId: number, currencyId?: number) => Promise<void>;
  checkAuth: () => Promise<boolean>;
  refreshExchangeRates: () => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  phone_number?: string;
  country_id: number;
  preferred_currency_id?: number;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (identifier: string, password: string, loginType: 'email' | 'phone' = 'email') => {
              set({ isLoading: true });
              try {
                const loginData = loginType === 'email' 
                  ? { email: identifier, password }
                  : { phone: identifier, password };
                  
                const response = await apiClient.post(API_ENDPOINTS.auth.login, loginData);
                
                // JWT usually returns 'access' and 'refresh'
                const { token, refresh, user } = response;
                
                if (!user || !token) { // Check for 'token' here
                  throw new Error('Invalid response from server');
                }
                                // Store both tokens
              // Store tokens (Update the key names to match what you extracted)
              localStorage.setItem('access_token', token); 
              if (refresh) localStorage.setItem('refresh_token', refresh);

              set({ user, token: token, isLoading: false });
                
                toast.success(`Welcome back, ${user.username || 'User'}!`);
              } catch (error: any) {
                set({ isLoading: false });
                const message = error.response?.data?.detail || error.response?.data?.error || 'Login failed.';
                toast.error(message);
                throw error;
              }
            },

      register: async (userData: RegisterData) => {
        set({ isLoading: true });

        try {
          await apiClient.post(API_ENDPOINTS.auth.register, userData);

          set({ isLoading: false });

          toast.success('Account created! Please check your email to verify your account.');

        } catch (error: any) {
          set({ isLoading: false });

          const errors = error.response?.data;

          if (errors) {
            Object.values(errors).forEach((err: any) => {
              if (typeof err === 'string') {
                toast.error(err);
              } else if (Array.isArray(err)) {
                err.forEach(e => toast.error(e));
              }
            });
          } else {
            toast.error('Registration failed. Please try again.');
          }

          throw error;
        }
      },

      logout: async () => {
              try {
                // Attempt to notify backend (standard practice for JWT blacklist)
                const refresh = localStorage.getItem('refresh_token');
                await apiClient.post(API_ENDPOINTS.auth.logout, { refresh });
              } catch (error) {
                console.error('Logout error:', error);
              } finally {
                // Always clear local state even if API call fails
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                set({ user: null, token: null });
                toast.success('Logged out successfully');
                window.location.href = '/auth'; // Redirect to your unified auth page
              }
            },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.put(API_ENDPOINTS.auth.updateProfile, data);
          set({ user: response.user, isLoading: false });
          toast.success('Profile updated successfully');
        } catch (error) {
          set({ isLoading: false });
          toast.error('Failed to update profile');
          throw error;
        }
      },

      updatePreferences: async (countryId: number, currencyId?: number) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post(API_ENDPOINTS.auth.updatePreferences, {
            country_id: countryId,
            currency_id: currencyId
          });
          
          set({ 
            user: { ...get().user, ...response },
            isLoading: false 
          });
          
          toast.success('Preferences updated successfully');
          
          await get().refreshExchangeRates();
        } catch (error) {
          set({ isLoading: false });
          toast.error('Failed to update preferences');
          throw error;
        }
      },

      checkAuth: async () => {
              const token = localStorage.getItem('access_token');
              if (!token) return false;

              try {
                // This call will trigger the refresh interceptor in client.ts 
                // if the access_token is expired but refresh_token is valid.
                const response = await apiClient.get(API_ENDPOINTS.auth.profile);
                
                set({
                  user: response,
                  token: localStorage.getItem('access_token') // Get potentially refreshed token
                });
                
                return true;
              } catch (error) {
                // Interceptor handles the cleanup/redirect, so we just return false
                return false;
              }
            },

      refreshExchangeRates: async () => {
        try {
          const response = await apiClient.get(API_ENDPOINTS.currencies.exchangeRates);
          
          const { user } = get();
          if (user?.preferred_currency && response.rates) {
            const updatedCurrency = {
              ...user.preferred_currency,
              exchange_rate_to_kES: response.rates[user.preferred_currency.code] || user.preferred_currency.exchange_rate_to_kES
            };
            
            set({
              user: {
                ...user,
                preferred_currency: updatedCurrency
              }
            });
          }
        } catch (error) {
          console.error('Failed to refresh exchange rates:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
    }
  )
);