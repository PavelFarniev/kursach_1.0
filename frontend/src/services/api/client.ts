import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { API_ENDPOINTS } from "@/shared/constants/api";
import { notifySessionUpdated, notifyUnauthorized } from "@/services/api/authSession";
import { clearStoredTokens, readStoredTokens, writeStoredTokens } from "@/services/api/tokenStorage";
import type { TokenPair } from "@/types/api";

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const API_BASE_URL = "/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
});

let refreshPromise: Promise<TokenPair> | null = null;
const PUBLIC_AUTH_PATHS = [
  API_ENDPOINTS.authLogin,
  API_ENDPOINTS.authRegister,
  "/auth/password-reset/request",
  "/auth/password-reset/confirm",
];

const requestTokenRefresh = async (): Promise<TokenPair> => {
  const { refreshToken } = readStoredTokens();

  if (!refreshToken) {
    throw new Error("Refresh token is missing");
  }

  const response = await refreshClient.post<TokenPair>(API_ENDPOINTS.authRefresh, {
    refreshToken,
  });
  return response.data;
};

apiClient.interceptors.request.use((config) => {
  const token = readStoredTokens().accessToken;

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const statusCode = error.response?.status;
    const requestUrl = originalRequest?.url ?? "";
    const isRefreshRequest = requestUrl.includes(API_ENDPOINTS.authRefresh);
    const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some((path) => requestUrl.includes(path));

    if (statusCode !== 401 || !originalRequest || originalRequest._retry || isRefreshRequest || isPublicAuthRequest) {
      return Promise.reject(error);
    }

    const { refreshToken } = readStoredTokens();
    if (!refreshToken) {
      clearStoredTokens();
      notifyUnauthorized();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshPromise ??= requestTokenRefresh().finally(() => {
        refreshPromise = null;
      });

      const tokens = await refreshPromise;
      writeStoredTokens(tokens.accessToken, tokens.refreshToken);
      notifySessionUpdated(tokens);
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      clearStoredTokens();
      notifyUnauthorized();
      return Promise.reject(refreshError);
    }
  },
);
