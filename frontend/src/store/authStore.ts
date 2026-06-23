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
  is_staff?: boolean;
  is_superuser?: boolean;
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

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  setHydrated: (state: boolean) => void;
  setUser: (user: User | null) => void; // Added to satisfy the wallet page balance updates

  // Updated signatures to match actual implementation return types
  login: (
    identifier: string,
    password: string,
    loginType?: 'email' | 'phone'
  ) => Promise<{ user: any; token: any }>;

  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePreferences: (
    countryId: number,
    currencyId?: number
  ) => Promise<void>;
  checkAuth: () => Promise<boolean>;
  refreshExchangeRates: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,

      setHydrated: (state: boolean) => set({ isHydrated: state }),
      
      setUser: (user: User | null) => set({ user }),

      login: async (identifier: string, password: string, loginType: 'email' | 'phone' = 'email') => {
        set({ isLoading: true });

        try {
          const loginData =
            loginType === 'email'
              ? { email: identifier, password }
              : { phone: identifier, password };

          const response = await apiClient.post(API_ENDPOINTS.auth.login, loginData);
          console.log("LOGIN RESPONSE:", response);
          console.log("STORE USER:", useAuthStore.getState().user);

          // ✅ HANDLE BOTH API SHAPES SAFELY
          const data = response?.data ?? response;

          const token = data?.token;
          const refresh = data?.refresh;
          const user = data?.user;

          if (!token || !user) {
            console.log('LOGIN RESPONSE DEBUG:', response);
            throw new Error('Invalid response from server');
          }

          localStorage.setItem('access_token', token);
          if (refresh) localStorage.setItem('refresh_token', refresh);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });

          toast.success(`Welcome back, ${user.username || 'User'}!`);
          return { user, token };
        } catch (error: any) {
          set({ isLoading: false });

          const message =
            error.response?.data?.detail ||
            error.response?.data?.error ||
            error.message ||
            'Login failed.';

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
          set({
            user: null,
            token: null,
            isAuthenticated: false
          });
          toast.success('Logged out successfully');
          window.location.href = '/auth'; // Redirect to your unified auth page
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.put(API_ENDPOINTS.auth.updateProfile, data);
          
          // ✅ FIXED: Unbox data payload properties out of the Axios wrapper
          const resData = (response as any)?.data || response;
          
          set({ user: resData.user || resData, isLoading: false });
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
          
          // ✅ FIXED: Unbox layout data configuration payload safely
          const resData = (response as any)?.data || response;
          
          set({ 
            user: { ...get().user, ...resData },
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
          
          // ✅ FIXED: Safely target the correct payload signature for session hydration
          const resData = (response as any)?.data || response;
          
          set({
            user: resData.user || resData,
            token: localStorage.getItem('access_token'),
            isAuthenticated: true
          });
                    
          return true;
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false
          });

          return false;
        }
      },

      refreshExchangeRates: async () => {
        try {
          const response = await apiClient.get(API_ENDPOINTS.currencies.exchangeRates);
          
          // ✅ FIXED: Unbox rates dictionary from the Axios wrapper layout payload safely
          const resData = (response as any)?.data || response;
          
          const { user } = get();
          if (user?.preferred_currency && resData.rates) {
            const updatedCurrency = {
              ...user.preferred_currency,
              exchange_rate_to_kES: resData.rates[user.preferred_currency.code] || user.preferred_currency.exchange_rate_to_kES
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
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),

      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);