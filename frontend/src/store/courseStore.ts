import { create } from "zustand";

import { coursesApi } from "@/services/api/coursesApi";
import type { CourseFilters } from "@/types/api";
import type { Course } from "@/types/domain";

interface CourseState {
  courses: Course[];
  selectedCourse: Course | null;
  filters: Required<CourseFilters>;
  isLoadingList: boolean;
  isLoadingCourse: boolean;
  error: string | null;
  setFilters: (patch: Partial<Required<CourseFilters>>) => void;
  fetchCourses: () => Promise<void>;
  fetchCourseById: (id: number) => Promise<void>;
}

const DEFAULT_FILTERS: Required<CourseFilters> = {
  search: "",
  category: "all",
  level: "all",
};

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  selectedCourse: null,
  filters: DEFAULT_FILTERS,
  isLoadingList: false,
  isLoadingCourse: false,
  error: null,

  setFilters: (patch) => {
    set({ filters: { ...get().filters, ...patch } });
  },

  fetchCourses: async () => {
    set({ isLoadingList: true, error: null });

    try {
      const { filters } = get();
      const courses = await coursesApi.list(filters);
      set({ courses, isLoadingList: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось загрузить курсы";
      set({ isLoadingList: false, error: message });
    }
  },

  fetchCourseById: async (id) => {
    set({ isLoadingCourse: true, error: null });

    try {
      const course = await coursesApi.getById(id);
      set({ selectedCourse: course, isLoadingCourse: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Курс не найден";
      set({ isLoadingCourse: false, error: message, selectedCourse: null });
    }
  },
}));
