import { useEffect } from "react";

import { CourseFilters } from "@/features/courses/CourseFilters";
import { coursesMetaApi } from "@/services/api/coursesApi";
import { useCourseStore } from "@/store/courseStore";
import { CourseCard } from "@/widgets/course/CourseCard";

export function CoursesPage(): JSX.Element {
  const courses = useCourseStore((state) => state.courses);
  const filters = useCourseStore((state) => state.filters);
  const isLoadingList = useCourseStore((state) => state.isLoadingList);
  const error = useCourseStore((state) => state.error);
  const setFilters = useCourseStore((state) => state.setFilters);
  const fetchCourses = useCourseStore((state) => state.fetchCourses);

  useEffect(() => {
    void fetchCourses();
  }, [filters, fetchCourses]);

  const categories = coursesMetaApi.categories();
  const levels = coursesMetaApi.levels();

  return (
    <section className="space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <p className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          Каталог курсов
        </p>
        <h1 className="text-3xl font-bold">Выберите курс и начните подготовку</h1>
        <p className="text-muted-foreground">Фильтруйте по предмету и уровню сложности, чтобы быстро найти нужную траекторию.</p>
      </div>

      <CourseFilters
        filters={filters}
        categories={categories}
        levels={levels}
        onFiltersChange={setFilters}
      />

      {isLoadingList && <p className="text-sm text-muted-foreground">Загружаем курсы...</p>}
      {error && <p className="text-sm text-warning">{error}</p>}

      {!isLoadingList && courses.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/80 bg-card/52 p-8 text-center text-muted-foreground shadow-sm supports-[backdrop-filter]:bg-card/24 backdrop-blur-2xl backdrop-saturate-150">
          Курсы по выбранным фильтрам не найдены
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}
