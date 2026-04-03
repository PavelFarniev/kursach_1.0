import { create } from "zustand";

import { authApi } from "@/services/api/authApi";
import { registerAuthSessionHandlers } from "@/services/api/authSession";
import {
  clearStoredTokens,
  readStoredTokens,
  writeStoredTokens,
} from "@/services/api/tokenStorage";
import { useChatStore } from "@/store/chatStore";
import { useCourseNotesStore } from "@/store/courseNotesStore";
import { useEnrollmentStore } from "@/store/enrollmentStore";
import type { ChangePasswordPayload, LoginPayload, RegisterPayload, TokenPair } from "@/types/api";
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
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const clearUserBoundState = (): void => {
  useCourseNotesStore.getState().clear();
  useEnrollmentStore.getState().clear();
  useChatStore.getState().clear();
};

const persistTokens = (tokens: TokenPair): void => {
  writeStoredTokens(tokens.accessToken, tokens.refreshToken);
};

const initialTokens = readStoredTokens();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: initialTokens.accessToken,
  refreshToken: initialTokens.refreshToken,
  isLoading: Boolean(initialTokens.accessToken),
  error: null,

  bootstrap: async () => {
    const { accessToken, refreshToken } = readStoredTokens();

    if (!accessToken || !refreshToken) {
      clearUserBoundState();
      set({ user: null, accessToken: null, refreshToken: null, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null, accessToken, refreshToken });

    try {
      const user = await authApi.profile();
      const latestTokens = readStoredTokens();
      set({
        user,
        accessToken: latestTokens.accessToken,
        refreshToken: latestTokens.refreshToken,
        isLoading: false,
      });
    } catch {
      const latestTokens = readStoredTokens();

      if (!latestTokens.refreshToken) {
        clearUserBoundState();
        set({ user: null, accessToken: null, refreshToken: null, isLoading: false, error: "Сессия истекла" });
        return;
      }

      try {
        const tokens = await authApi.refresh({ refreshToken: latestTokens.refreshToken });
        persistTokens(tokens);
        const user = await authApi.profile();
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isLoading: false,
          error: null,
        });
      } catch {
        clearStoredTokens();
        clearUserBoundState();
        set({ user: null, accessToken: null, refreshToken: null, isLoading: false, error: "Сессия истекла" });
      }
    }
  },

  login: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const tokens = await authApi.login(payload);
      persistTokens(tokens);
      const user = await authApi.profile();

      set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка входа";
      clearStoredTokens();
      clearUserBoundState();
      set({ isLoading: false, error: message, user: null, accessToken: null, refreshToken: null });
      throw error;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const tokens = await authApi.register(payload);
      persistTokens(tokens);
      const user = await authApi.profile();

      set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка регистрации";
      clearStoredTokens();
      clearUserBoundState();
      set({ isLoading: false, error: message, user: null, accessToken: null, refreshToken: null });
      throw error;
    }
  },

  changePassword: async (payload) => {
    set({ isLoading: true, error: null });

    try {
      const tokens = await authApi.changePassword(payload);
      persistTokens(tokens);
      const user = await authApi.profile();

      set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось сменить пароль";
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: () => {
    clearStoredTokens();
    clearUserBoundState();
    set({ user: null, accessToken: null, refreshToken: null, error: null });
  },

  clearError: () => {
    if (get().error) {
      set({ error: null });
    }
  },
}));

registerAuthSessionHandlers({
  onSessionUpdated: (tokens) => {
    useAuthStore.setState({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      error: null,
    });
  },
  onUnauthorized: () => {
    clearUserBoundState();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: "Сессия истекла",
    });
  },
});
