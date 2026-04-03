import { create } from "zustand";

import { coursesApi } from "@/services/api/coursesApi";
import type { CourseFilters } from "@/types/api";
import type { Course } from "@/types/domain";

interface CourseState {
  courses: Course[];
  selectedCourse: Course | null;
  filters: Required<CourseFilters>;
  availableCategories: string[];
  availableLevels: string[];
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

const buildUniqueValues = <T extends string>(items: T[]): T[] => Array.from(new Set(items));

const isDefaultFilters = (filters: Required<CourseFilters>): boolean =>
  filters.search === DEFAULT_FILTERS.search &&
  filters.category === DEFAULT_FILTERS.category &&
  filters.level === DEFAULT_FILTERS.level;

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  selectedCourse: null,
  filters: DEFAULT_FILTERS,
  availableCategories: [],
  availableLevels: [],
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
      const shouldUseCatalogSnapshot = get().availableCategories.length === 0 || get().availableLevels.length === 0;
      const allCourses = shouldUseCatalogSnapshot ? await coursesApi.list() : null;
      const courses = allCourses && isDefaultFilters(filters) ? allCourses : await coursesApi.list(filters);

      set({
        courses,
        availableCategories: allCourses
          ? buildUniqueValues(allCourses.map((course) => course.category))
          : get().availableCategories,
        availableLevels: allCourses ? buildUniqueValues(allCourses.map((course) => course.level)) : get().availableLevels,
        isLoadingList: false,
      });
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
