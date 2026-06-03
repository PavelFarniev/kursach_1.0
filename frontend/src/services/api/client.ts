import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { API_ENDPOINTS } from "@/shared/constants/api";
import { notifySessionUpdated, notifyUnauthorized } from "@/services/api/authSession";
import type { TokenPair } from "@/types/api";

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const API_BASE_URL = "/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  withCredentials: true,
});

let refreshPromise: Promise<TokenPair> | null = null;
const PUBLIC_AUTH_PATHS = [
  API_ENDPOINTS.authLogin,
  API_ENDPOINTS.authRegister,
  "/auth/password-reset/request",
  "/auth/password-reset/confirm",
];

const requestTokenRefresh = async (): Promise<TokenPair> => {
  const response = await refreshClient.post<TokenPair>(API_ENDPOINTS.authRefresh, {});
  return response.data;
};

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

    originalRequest._retry = true;

    try {
      refreshPromise ??= requestTokenRefresh().finally(() => {
        refreshPromise = null;
      });

      const tokens = await refreshPromise;
      notifySessionUpdated(tokens);
      return apiClient(originalRequest);
    } catch (refreshError) {
      notifyUnauthorized();
      return Promise.reject(refreshError);
    }
  },
);
