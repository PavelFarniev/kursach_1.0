import { API_ENDPOINTS } from "@/shared/constants/api";
import { apiClient } from "@/services/api/client";
import { USE_MOCK_API } from "@/services/api/config";
import type { AdminApi, AdminUsersFilters, UpdateAdminUserPayload } from "@/types/api";
import type { AdminUser } from "@/types/domain";

export const adminApi: AdminApi = {
  async listUsers(filters?: AdminUsersFilters): Promise<AdminUser[]> {
    if (USE_MOCK_API) {
      throw new Error("Админ-панель недоступна в mock-режиме");
    }

    const response = await apiClient.get<AdminUser[]>(API_ENDPOINTS.adminUsers, {
      params: filters?.search ? { search: filters.search } : undefined,
    });
    return response.data;
  },

  async updateUser(userId: number, payload: UpdateAdminUserPayload): Promise<AdminUser> {
    if (USE_MOCK_API) {
      throw new Error("Админ-панель недоступна в mock-режиме");
    }

    const response = await apiClient.patch<AdminUser>(`${API_ENDPOINTS.adminUsers}/${userId}`, payload);
    return response.data;
  },

  async deleteUser(userId: number): Promise<void> {
    if (USE_MOCK_API) {
      throw new Error("Админ-панель недоступна в mock-режиме");
    }

    await apiClient.delete(`${API_ENDPOINTS.adminUsers}/${userId}`);
  },
};
