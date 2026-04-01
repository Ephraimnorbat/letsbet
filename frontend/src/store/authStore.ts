import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

interface User {
  id: number;
  username: string;
  email: string;
  phone_number?: string;
  profile_picture?: string;
  total_bets: number;
  total_wins: number;
  total_profit: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  phone_number?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Django REST Framework token auth endpoint
          const response = await apiClient.post('/auth/login/', { email, password });
          
          const { token, user } = response.data;
          
          localStorage.setItem('auth_token', token);
          set({ user, token, isLoading: false });
          
          toast.success('Login successful!');
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.response?.data?.error || 'Login failed. Please try again.';
          toast.error(message);
          throw error;
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true });
        try {
          const response = await apiClient.post(API_ENDPOINTS.auth.register, userData);
          
          const { token, user } = response.data;
          
          localStorage.setItem('auth_token', token);
          set({ user, token, isLoading: false });
          
          toast.success('Registration successful!');
        } catch (error: any) {
          set({ isLoading: false });
          const errors = error.response?.data;
          if (errors) {
            Object.values(errors).forEach((err: any) => {
              toast.error(err[0]);
            });
          } else {
            toast.error('Registration failed. Please try again.');
          }
          throw error;
        }
      },

      logout: async () => {
        try {
          await apiClient.post(API_ENDPOINTS.auth.logout);
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('auth_token');
          set({ user: null, token: null });
          toast.success('Logged out successfully');
          window.location.href = '/';
        }
      },

      updateProfile: async (data: Partial<User>) => {
        try {
          const response = await apiClient.put(API_ENDPOINTS.user.updateProfile, data);
          set({ user: response.data.user });
          toast.success('Profile updated successfully');
        } catch (error) {
          toast.error('Failed to update profile');
          throw error;
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) return false;

        try {
          const response = await apiClient.get(API_ENDPOINTS.user.profile);
          set({ user: response.data, token });
          return true;
        } catch (error) {
          localStorage.removeItem('auth_token');
          set({ user: null, token: null });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);