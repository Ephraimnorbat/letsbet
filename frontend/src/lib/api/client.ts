import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import toast from 'react-hot-toast';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class ApiClient {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 1. Request interceptor: Attach the access_token
    this.api.interceptors.request.use(
      (config: CustomAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('access_token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 2. Response interceptor: Handle data and Token Refresh
    this.api.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // Check for 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

          // CRITICAL FIX: If no refresh token, don't throw. Silently logout.
          if (!refreshToken) {
            this.handleLogout();
            return Promise.reject('AUTH_EXPIRED'); 
          }

          try {
            // Use a clean axios instance for refresh to avoid interceptor loops
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/token/refresh/`, {
              refresh: refreshToken,
            });
            
            const newAccessToken = response.data.access;
            localStorage.setItem('access_token', newAccessToken);
            
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            
            // Retry the original request with the new token
            return this.api(originalRequest);

          } catch (refreshError) {
            this.handleLogout();
            return Promise.reject('AUTH_EXPIRED');
          }
        }

        // Avoid showing "Please login" toast for background balance checks
        const errorMessage = this.getErrorMessage(error);
        if (error.response?.status !== 401) {
          toast.error(errorMessage);
        }
        
        return Promise.reject(error);
      }
    );
  }

  private handleLogout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-storage'); // Use this if you use Zustand persist
      
      // Only redirect if we aren't already on the auth page
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
        toast.error('Session expired. Please login again.');
      }
    }
  }

  private getErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as any;
      if (data.message) return data.message;
      if (data.error) return data.error;
      if (data.detail) return data.detail;
    }
    
    switch (error.response?.status) {
      case 400: return 'Invalid request.';
      case 403: return 'Permission denied.';
      case 404: return 'Resource not found.';
      case 429: return 'Too many requests.';
      case 500: return 'Server error. Please try again.';
      default: return 'An unexpected error occurred.';
    }
  }

  public getApi() {
    return this.api;
  }
}

export const apiClient = new ApiClient().getApi();