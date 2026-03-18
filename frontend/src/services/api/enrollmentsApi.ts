import { API_ENDPOINTS } from "@/shared/constants/api";
import { mockCoursesApi, mockEnrollmentsApi } from "@/shared/mocks/mockData";
import { apiClient } from "@/services/api/client";
import { USE_MOCK_API } from "@/services/api/config";
import type { EnrollPayload, ProgressPayload } from "@/types/api";
import type { Enrollment, EnrollmentWithCourse } from "@/types/domain";

const mapWithCourse = async (items: Enrollment[]): Promise<EnrollmentWithCourse[]> => {
  const mapped = await Promise.all(
    items.map(async (item) => ({
      ...item,
      course: await mockCoursesApi.byId(item.courseId),
    })),
  );

  return mapped;
};

export const enrollmentsApi = {
  async enroll(payload: EnrollPayload): Promise<Enrollment> {
    if (USE_MOCK_API) {
      return mockEnrollmentsApi.enroll(payload.courseId, localStorage.getItem("access_token") ?? undefined);
    }

    const response = await apiClient.post<Enrollment>(API_ENDPOINTS.enrollments, payload);
    return response.data;
  },

  async my(): Promise<EnrollmentWithCourse[]> {
    if (USE_MOCK_API) {
      const result = await mockEnrollmentsApi.my(localStorage.getItem("access_token") ?? undefined);
      return mapWithCourse(result);
    }

    const response = await apiClient.get<EnrollmentWithCourse[]>(API_ENDPOINTS.myEnrollments);
    return response.data;
  },

  async patchProgress(enrollmentId: number, payload: ProgressPayload): Promise<EnrollmentWithCourse> {
    if (USE_MOCK_API) {
      const updated = await mockEnrollmentsApi.updateProgress(
        enrollmentId,
        payload.progressPercent,
        localStorage.getItem("access_token") ?? undefined,
      );

      return {
        ...updated,
        course: await mockCoursesApi.byId(updated.courseId),
      };
    }

    const response = await apiClient.patch<EnrollmentWithCourse>(
      `${API_ENDPOINTS.enrollments}/${enrollmentId}/progress`,
      payload,
    );

    return response.data;
  },
};
