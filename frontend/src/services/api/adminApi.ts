import { API_ENDPOINTS } from "@/shared/constants/api";
import { apiClient } from "@/services/api/client";
import { USE_MOCK_API } from "@/services/api/config";
import type {
  AdminApi,
  AdminCourseWritePayload,
  AdminCoursesFilters,
  AdminUsersFilters,
  UpdateAdminUserPayload,
} from "@/types/api";
import type { AdminCourse, AdminCourseSlide, AdminUser } from "@/types/domain";

const normalizeSlides = (slides: AdminCourseSlide[]): AdminCourseSlide[] =>
  [...slides]
    .sort((left, right) => left.orderIndex - right.orderIndex)
    .map((slide, index) => ({
      ...slide,
      orderIndex: index,
      title: slide.title.trim(),
      summary: slide.summary.trim(),
      theoryBlocks: slide.theoryBlocks.map((item) => item.trim()),
      bullets: slide.bullets.map((item) => item.trim()),
      example: slide.example.trim(),
      practiceTask: slide.practiceTask.trim(),
    }));

const normalizeCoursePayload = (payload: AdminCourseWritePayload): AdminCourseWritePayload => ({
  title: payload.title.trim(),
  description: payload.description.trim(),
  category: payload.category.trim(),
  level: payload.level.trim(),
  lessonsCount: payload.lessonsCount,
  estimatedHours: payload.estimatedHours,
  slides: normalizeSlides(payload.slides),
});

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

  async listCourses(filters?: AdminCoursesFilters): Promise<AdminCourse[]> {
    if (USE_MOCK_API) {
      throw new Error("Админ-панель недоступна в mock-режиме");
    }

    const response = await apiClient.get<AdminCourse[]>(API_ENDPOINTS.adminCourses, {
      params: filters?.search ? { search: filters.search } : undefined,
    });
    return response.data;
  },

  async createCourse(payload: AdminCourseWritePayload): Promise<AdminCourse> {
    if (USE_MOCK_API) {
      throw new Error("Админ-панель недоступна в mock-режиме");
    }

    const response = await apiClient.post<AdminCourse>(API_ENDPOINTS.adminCourses, normalizeCoursePayload(payload));
    return response.data;
  },

  async updateCourse(courseId: number, payload: AdminCourseWritePayload): Promise<AdminCourse> {
    if (USE_MOCK_API) {
      throw new Error("Админ-панель недоступна в mock-режиме");
    }

    const response = await apiClient.patch<AdminCourse>(
      `${API_ENDPOINTS.adminCourses}/${courseId}`,
      normalizeCoursePayload(payload),
    );
    return response.data;
  },

  async deleteCourse(courseId: number): Promise<void> {
    if (USE_MOCK_API) {
      throw new Error("Админ-панель недоступна в mock-режиме");
    }

    await apiClient.delete(`${API_ENDPOINTS.adminCourses}/${courseId}`);
  },
};
