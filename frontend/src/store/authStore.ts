import { create } from "zustand";

import { authApi } from "@/services/api/authApi";
import type { LoginPayload, RegisterPayload } from "@/types/api";
import type { UserProfile } from "@/types/domain";

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

const readStoredToken = (): { accessToken: string | null; refreshToken: string | null } => ({
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
});

const persistTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const initialTokens = readStoredToken();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: initialTokens.accessToken,
  refreshToken: initialTokens.refreshToken,
  isLoading: Boolean(initialTokens.accessToken),
  error: null,

  bootstrap: async () => {
    const { accessToken, refreshToken } = readStoredToken();

    if (!accessToken || !refreshToken) {
      set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null, accessToken, refreshToken });

    try {
      const user = await authApi.profile();
      set({ user, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, accessToken: null, refreshToken: null, isLoading: false, error: "Сессия истекла" });
    }
  },

  login: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const tokens = await authApi.login(payload);
      persistTokens(tokens.accessToken, tokens.refreshToken);
      const user = await authApi.profile();

      set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка входа";
      clearTokens();
      set({ isLoading: false, error: message, user: null, accessToken: null, refreshToken: null });
      throw error;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const tokens = await authApi.register(payload);
      persistTokens(tokens.accessToken, tokens.refreshToken);
      const user = await authApi.profile();

      set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка регистрации";
      clearTokens();
      set({ isLoading: false, error: message, user: null, accessToken: null, refreshToken: null });
      throw error;
    }
  },

  logout: () => {
    clearTokens();
    set({ user: null, accessToken: null, refreshToken: null, error: null });
  },

  clearError: () => {
    if (get().error) {
      set({ error: null });
    }
  },
}));
