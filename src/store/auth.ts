import { create } from "zustand";
import { persist } from "zustand/middleware";
import { auth } from "../lib/api";
import { User } from "../types";
import { initClarity } from "../lib/clarity";
import { getConsentCookies } from "../lib/utils";
import { parseError } from "../lib/errors";

// Delegates to the shared error parser (single source of truth for messages).
// The backend now returns specific messages (e.g. "Invalid OTP"), so we surface
// those instead of the old blanket status-based copy.
const getErrorMessage = (error: any): string =>
  parseError(error, "An unexpected error occurred. Please try again.").message;

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  otpId: string | null;
  register: (email: string, name: string) => Promise<string>;
  verifyOTP: (otpId: string, otp: string) => Promise<void>;
  verifyMagicLink: (token: string) => Promise<void>;
  login: (email: string) => Promise<string>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
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
          const errorMessage = getErrorMessage(error);
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      verifyOTP: async (otpId: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          await auth.verifyOTP(otpId, otp);
          const user = await auth.getCurrentUser();
          set({ user, isLoading: false, otpId: null });
          // Initialize Clarity on successful login
          initClarity(getConsentCookies(), user);
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      verifyMagicLink: async (token: string) => {
        set({ isLoading: true, error: null });
        try {
          await auth.verifyMagicLink(token);
          const user = await auth.getCurrentUser();
          set({ user, isLoading: false, otpId: null });
          initClarity(getConsentCookies(), user);
        } catch (error) {
          const errorMessage = getErrorMessage(error);
          set({ isLoading: false, error: errorMessage });
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
          const errorMessage = getErrorMessage(error);
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, otpId: null, error: null });
      },

      loadUser: async () => {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        set({ isLoading: true });
        try {
          const user = await auth.getCurrentUser();
          set({ user, isLoading: false });
        } catch (error) {
          set({ isLoading: false, user: null });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
