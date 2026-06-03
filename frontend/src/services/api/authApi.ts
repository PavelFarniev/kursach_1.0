import { API_ENDPOINTS } from "@/shared/constants/api";
import { mockAuthApi } from "@/shared/mocks/mockData";
import { apiClient } from "@/services/api/client";
import { USE_MOCK_API } from "@/services/api/config";
import { readStoredTokens } from "@/services/api/tokenStorage";
import type {
  ChangePasswordPayload,
  GigaChatCredentialsPayload,
  GigaChatCredentialsStatus,
  LoginPayload,
  MessageResponse,
  RefreshTokenPayload,
  RegisterPayload,
  TokenPair,
} from "@/types/api";
import type { UserProfile } from "@/types/domain";

export const authApi = {
  async register(payload: RegisterPayload): Promise<TokenPair> {
    if (USE_MOCK_API) {
      return mockAuthApi.register(payload);
    }

    const response = await apiClient.post<TokenPair>(
      API_ENDPOINTS.authRegister,
      payload,
    );
    return response.data;
  },

  async login(payload: LoginPayload): Promise<TokenPair> {
    if (USE_MOCK_API) {
      return mockAuthApi.login(payload);
    }

    const response = await apiClient.post<TokenPair>(
      API_ENDPOINTS.authLogin,
      payload,
    );
    return response.data;
  },

  async refresh(payload?: RefreshTokenPayload): Promise<TokenPair> {
    if (USE_MOCK_API) {
      throw new Error("Обновление токена недоступно в mock-режиме");
    }

    const response = await apiClient.post<TokenPair>(
      API_ENDPOINTS.authRefresh,
      payload ?? {},
    );
    return response.data;
  },

  async logout(): Promise<MessageResponse> {
    if (USE_MOCK_API) {
      return { message: "Сессия завершена" };
    }

    const response = await apiClient.post<MessageResponse>(
      API_ENDPOINTS.authLogout,
      {},
    );
    return response.data;
  },

  async profile(): Promise<UserProfile> {
    if (USE_MOCK_API) {
      return mockAuthApi.profile(readStoredTokens().accessToken ?? undefined);
    }

    const response = await apiClient.get<UserProfile>(API_ENDPOINTS.profile);
    return response.data;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<TokenPair> {
    if (USE_MOCK_API) {
      throw new Error("Смена пароля недоступна в mock-режиме");
    }

    const response = await apiClient.post<TokenPair>(
      API_ENDPOINTS.authChangePassword,
      payload,
    );
    return response.data;
  },

  async getGigachatCredentialsStatus(): Promise<GigaChatCredentialsStatus> {
    if (USE_MOCK_API) {
      return { hasCredentials: false };
    }

    const response = await apiClient.get<GigaChatCredentialsStatus>(
      API_ENDPOINTS.userGigachatCredentials,
    );
    return response.data;
  },

  async updateGigachatCredentials(
    payload: GigaChatCredentialsPayload,
  ): Promise<GigaChatCredentialsStatus> {
    if (USE_MOCK_API) {
      return { hasCredentials: true };
    }

    const response = await apiClient.put<GigaChatCredentialsStatus>(
      API_ENDPOINTS.userGigachatCredentials,
      payload,
    );
    return response.data;
  },

  async deleteGigachatCredentials(): Promise<GigaChatCredentialsStatus> {
    if (USE_MOCK_API) {
      return { hasCredentials: false };
    }

    const response = await apiClient.delete<GigaChatCredentialsStatus>(
      API_ENDPOINTS.userGigachatCredentials,
    );
    return response.data;
  },
};
