import { API_ENDPOINTS } from "@/shared/constants/api";
import { mockCoursesApi } from "@/shared/mocks/mockData";
import { apiClient } from "@/services/api/client";
import { USE_MOCK_API } from "@/services/api/config";
import type { CourseFilters } from "@/types/api";
import type { Course } from "@/types/domain";

export const coursesApi = {
  async list(filters?: CourseFilters): Promise<Course[]> {
    if (USE_MOCK_API) {
      return mockCoursesApi.list(filters);
    }

    const response = await apiClient.get<Course[]>(API_ENDPOINTS.courses, {
      params: filters,
    });

    return response.data;
  },

  async getById(courseId: number): Promise<Course> {
    if (USE_MOCK_API) {
      return mockCoursesApi.byId(courseId);
    }

    const response = await apiClient.get<Course>(`${API_ENDPOINTS.courses}/${courseId}`);
    return response.data;
  },
};
