import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '../lib/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  otpId: string | null;
  register: (email: string, name: string) => Promise<string>;
  verifyOTP: (otpId: string, otp: string) => Promise<void>;
  login: (email: string) => Promise<string>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      otpId: null,
      
      register: async (email: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          const { otp_id } = await auth.register(email, name);
          set({ isLoading: false, otpId: otp_id });
          return otp_id;
        } catch (error) {
          set({ isLoading: false, error: 'Registration failed' });
          throw error;
        }
      },
      
      verifyOTP: async (otpId: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          await auth.verifyOTP(otpId, otp);
          const user = await auth.getCurrentUser();
          set({ user, isLoading: false, otpId: null });
        } catch (error) {
          set({ isLoading: false, error: 'OTP verification failed' });
          throw error;
        }
      },
      
      login: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const { otp_id } = await auth.login(email);
          set({ isLoading: false, otpId: otp_id });
          return otp_id;
        } catch (error) {
          set({ isLoading: false, error: 'Login failed' });
          throw error;
        }
      },
      
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, otpId: null });
      },
      
      loadUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        
        set({ isLoading: true });
        try {
          const user = await auth.getCurrentUser();
          set({ user, isLoading: false });
        } catch (error) {
          set({ isLoading: false, user: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);