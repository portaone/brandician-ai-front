import { create } from "zustand";
import { persist } from "zustand/middleware";
import { auth } from "../lib/api";
import { User } from "../types";
import { initClarity } from "../lib/clarity";
import { getConsentCookies } from "../lib/utils";

// Helper function to get user-friendly error messages
const getErrorMessage = (error: any): string => {
  // Check for network/connection errors
  if (
    error.code === "ECONNREFUSED" ||
    error.code === "ERR_CONNECTION_REFUSED" ||
    error.message?.includes("ERR_CONNECTION_REFUSED") ||
    error.message?.includes("Network Error") ||
    !error.response
  ) {
    return "Unable to connect to the server. Please check your internet connection or try again later.";
  }

  // Check for server errors (5xx)
  if (error.response?.status >= 500) {
    return "The server is experiencing issues. Please try again later.";
  }

  // Check for client errors (4xx)
  if (error.response?.status >= 400 && error.response?.status < 500) {
    const serverMessage =
      error.response?.data?.message || error.response?.data?.detail;
    if (serverMessage) {
      return serverMessage;
    }

    switch (error.response?.status) {
      case 400:
        return "Invalid request. Please check your input and try again.";
      case 401:
        return "Invalid credentials. Please check your email and try again.";
      case 403:
        return "Access denied. Please contact support if this persists.";
      case 404:
        return "Service not found. Please try again later.";
      default:
        return "An error occurred. Please try again.";
    }
  }

  // Default fallback
  return "An unexpected error occurred. Please try again.";
};

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
