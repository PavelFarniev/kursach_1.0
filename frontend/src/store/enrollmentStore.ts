import { create } from "zustand";

import { coursesApi } from "@/services/api/coursesApi";
import { enrollmentsApi } from "@/services/api/enrollmentsApi";
import type { EnrollmentWithCourse } from "@/types/domain";

interface EnrollmentState {
  enrollments: EnrollmentWithCourse[];
  isLoading: boolean;
  error: string | null;
  fetchMyEnrollments: () => Promise<void>;
  enrollToCourse: (courseId: number) => Promise<EnrollmentWithCourse>;
  updateProgress: (enrollmentId: number, progressPercent: number) => Promise<void>;
  getEnrollmentByCourseId: (courseId: number) => EnrollmentWithCourse | undefined;
}

export const useEnrollmentStore = create<EnrollmentState>((set, get) => ({
  enrollments: [],
  isLoading: false,
  error: null,

  fetchMyEnrollments: async () => {
    set({ isLoading: true, error: null });

    try {
      const enrollments = await enrollmentsApi.my();
      set({ enrollments, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось загрузить прогресс";
      set({ error: message, isLoading: false });
    }
  },

  enrollToCourse: async (courseId) => {
    set({ error: null });

    const existing = get().enrollments.find((item) => item.courseId === courseId);
    if (existing) {
      return existing;
    }

    const enrollment = await enrollmentsApi.enroll({ courseId });
    const course = await coursesApi.getById(courseId);

    const withCourse: EnrollmentWithCourse = {
      ...enrollment,
      course,
    };

    set((state) => ({ enrollments: [...state.enrollments, withCourse] }));
    return withCourse;
  },

  updateProgress: async (enrollmentId, progressPercent) => {
    set({ error: null });

    try {
      const updated = await enrollmentsApi.patchProgress(enrollmentId, { progressPercent });

      set((state) => ({
        enrollments: state.enrollments.map((item) =>
          item.id === enrollmentId
            ? {
                ...item,
                progressPercent: updated.progressPercent,
                status: updated.status,
              }
            : item,
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось обновить прогресс";
      set({ error: message });
    }
  },

  getEnrollmentByCourseId: (courseId) => get().enrollments.find((item) => item.courseId === courseId),
}));
