import { create } from "zustand";

import { authApi } from "@/services/api/authApi";
import { USE_MOCK_API } from "@/services/api/config";
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
  logout: () => Promise<void>;
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
const SESSION_MARKER = "cookie-session";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: USE_MOCK_API ? initialTokens.accessToken : null,
  refreshToken: USE_MOCK_API ? initialTokens.refreshToken : null,
  isLoading: true,
  error: null,

  bootstrap: async () => {
    if (!USE_MOCK_API) {
      set({ isLoading: true, error: null });

      try {
        const user = await authApi.profile();
        set({
          user,
          accessToken: SESSION_MARKER,
          refreshToken: SESSION_MARKER,
          isLoading: false,
          error: null,
        });
      } catch {
        try {
          await authApi.refresh();
          const user = await authApi.profile();
          set({
            user,
            accessToken: SESSION_MARKER,
            refreshToken: SESSION_MARKER,
            isLoading: false,
            error: null,
          });
        } catch {
          clearUserBoundState();
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            error: null,
          });
        }
      }

      return;
    }

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
      if (USE_MOCK_API) {
        persistTokens(tokens);
      }
      const user = await authApi.profile();

      set({
        user,
        accessToken: USE_MOCK_API ? tokens.accessToken : SESSION_MARKER,
        refreshToken: USE_MOCK_API ? tokens.refreshToken : SESSION_MARKER,
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
      if (USE_MOCK_API) {
        persistTokens(tokens);
      }
      const user = await authApi.profile();

      set({
        user,
        accessToken: USE_MOCK_API ? tokens.accessToken : SESSION_MARKER,
        refreshToken: USE_MOCK_API ? tokens.refreshToken : SESSION_MARKER,
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
      if (USE_MOCK_API) {
        persistTokens(tokens);
      }
      const user = await authApi.profile();

      set({
        user,
        accessToken: USE_MOCK_API ? tokens.accessToken : SESSION_MARKER,
        refreshToken: USE_MOCK_API ? tokens.refreshToken : SESSION_MARKER,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось сменить пароль";
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if backend logout fails, we still clear local user-bound state.
    }
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
  onSessionUpdated: (_tokens) => {
    useAuthStore.setState({
      accessToken: SESSION_MARKER,
      refreshToken: SESSION_MARKER,
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
