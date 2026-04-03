import {
  BookOpenText,
  ChevronDown,
  ChevronUp,
  Clock3,
  PencilLine,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/services/api/adminApi";
import type { AdminCourseWritePayload } from "@/types/api";
import type { AdminCourse, AdminCourseSlide } from "@/types/domain";

const EMPTY_COURSES: AdminCourse[] = [];

const createEmptySlide = (orderIndex: number): AdminCourseSlide => ({
  orderIndex,
  title: "",
  summary: "",
  theoryBlocks: [""],
  bullets: [""],
  example: "",
  practiceTask: "",
});

const createEmptyCourseForm = (): AdminCourseWritePayload => ({
  title: "",
  description: "",
  category: "",
  level: "Beginner",
  lessonsCount: 1,
  estimatedHours: 1,
  slides: [createEmptySlide(0)],
});

const cloneCourseToForm = (course: AdminCourse): AdminCourseWritePayload => ({
  title: course.title,
  description: course.description,
  category: course.category,
  level: course.level,
  lessonsCount: course.lessonsCount,
  estimatedHours: course.estimatedHours,
  slides: course.slides.map((slide, index) => ({
    id: slide.id,
    orderIndex: index,
    title: slide.title,
    summary: slide.summary,
    theoryBlocks: [...slide.theoryBlocks],
    bullets: [...slide.bullets],
    example: slide.example,
    practiceTask: slide.practiceTask,
  })),
});

const normalizeSlidesOrder = (slides: AdminCourseSlide[]): AdminCourseSlide[] =>
  slides.map((slide, index) => ({
    ...slide,
    orderIndex: index,
  }));

const formatDate = (value: string): string =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data;

    if (typeof data === "object" && data !== null && "detail" in data) {
      if (typeof data.detail === "string") {
        return data.detail;
      }

      if (Array.isArray(data.detail)) {
        return data.detail
          .map((item) =>
            typeof item === "object" && item !== null && "msg" in item && typeof item.msg === "string" ? item.msg : "",
          )
          .filter(Boolean)
          .join(", ");
      }
    }
  }

  return error instanceof Error ? error.message : fallback;
};

const getCourseValidationError = (form: AdminCourseWritePayload | null): string | null => {
  if (!form) {
    return null;
  }

  if (!form.title.trim()) {
    return "Укажите название курса.";
  }

  if (!form.description.trim()) {
    return "Заполните описание курса.";
  }

  if (!form.category.trim()) {
    return "Укажите категорию курса.";
  }

  if (!form.level.trim()) {
    return "Укажите уровень курса.";
  }

  if (form.lessonsCount < 1 || form.estimatedHours < 1) {
    return "Количество уроков и часов должно быть больше нуля.";
  }

  if (form.slides.length === 0) {
    return "Добавьте хотя бы один слайд перед сохранением.";
  }

  for (const [index, slide] of form.slides.entries()) {
    const slideNumber = index + 1;

    if (!slide.title.trim()) {
      return `Слайд ${slideNumber}: заполните заголовок.`;
    }

    if (!slide.summary.trim()) {
      return `Слайд ${slideNumber}: заполните summary.`;
    }

    if (!slide.example.trim()) {
      return `Слайд ${slideNumber}: заполните example.`;
    }

    if (!slide.practiceTask.trim()) {
      return `Слайд ${slideNumber}: заполните practice task.`;
    }

    if (!slide.theoryBlocks.some((item) => item.trim())) {
      return `Слайд ${slideNumber}: добавьте хотя бы один theory block.`;
    }

    if (!slide.bullets.some((item) => item.trim())) {
      return `Слайд ${slideNumber}: добавьте хотя бы один bullet.`;
    }
  }

  return null;
};

interface RepeatableTextListEditorProps {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

function RepeatableTextListEditor({
  label,
  placeholder,
  values,
  onChange,
  onAdd,
  onRemove,
}: RepeatableTextListEditorProps): JSX.Element {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <Button type="button" size="sm" variant="outline" onClick={onAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить
        </Button>
      </div>

      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={`${label}-${index}`} className="flex items-start gap-2">
            <Textarea
              value={value}
              onChange={(event) => onChange(index, event.target.value)}
              placeholder={`${placeholder} ${index + 1}`}
              className="min-h-[88px]"
            />
            <Button type="button" size="icon" variant="outline" onClick={() => onRemove(index)} aria-label={`Удалить ${label.toLowerCase()}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminCoursesSection(): JSX.Element {
  const [courses, setCourses] = useState<AdminCourse[]>(EMPTY_COURSES);
  const [searchDraft, setSearchDraft] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [openCourseId, setOpenCourseId] = useState<number | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminCourseWritePayload | null>(null);

  const totalSlides = useMemo(
    () => courses.reduce((sum, course) => sum + course.slides.length, 0),
    [courses],
  );
  const categoriesCount = useMemo(() => new Set(courses.map((course) => course.category)).size, [courses]);
  const validationError = useMemo(() => getCourseValidationError(form), [form]);

  const loadCourses = async (search = activeSearch): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const nextCourses = await adminApi.listCourses({ search });
      setCourses(nextCourses);
    } catch (nextError) {
      setError(getErrorMessage(nextError, "Не удалось загрузить курсы"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses("");
  }, []);

  useEffect(() => {
    if (courses.length === 0) {
      setOpenCourseId(null);
      return;
    }

    if (editingCourseId !== null && courses.some((course) => course.id === editingCourseId)) {
      setOpenCourseId(editingCourseId);
      return;
    }

    if (openCourseId !== null && !courses.some((course) => course.id === openCourseId)) {
      setOpenCourseId(null);
    }
  }, [courses, editingCourseId, openCourseId]);

  const handleSearchSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const nextSearch = searchDraft.trim();
    setActiveSearch(nextSearch);
    await loadCourses(nextSearch);
  };

  const handleCreateNew = (): void => {
    setEditingCourseId(null);
    setForm(createEmptyCourseForm());
    setError(null);
  };

  const handleStartEdit = (course: AdminCourse): void => {
    setEditingCourseId(course.id);
    setOpenCourseId(course.id);
    setForm(cloneCourseToForm(course));
    setError(null);
  };

  const handleCancelEdit = (): void => {
    setEditingCourseId(null);
    setForm(null);
  };

  const updateForm = <K extends keyof AdminCourseWritePayload>(field: K, value: AdminCourseWritePayload[K]): void => {
    setForm((state) => (state ? { ...state, [field]: value } : state));
  };

  const updateSlide = (slideIndex: number, patch: Partial<AdminCourseSlide>): void => {
    setForm((state) => {
      if (!state) {
        return state;
      }

      const nextSlides = state.slides.map((slide, index) =>
        index === slideIndex ? { ...slide, ...patch } : slide,
      );

      return {
        ...state,
        slides: normalizeSlidesOrder(nextSlides),
      };
    });
  };

  const moveSlide = (slideIndex: number, direction: -1 | 1): void => {
    setForm((state) => {
      if (!state) {
        return state;
      }

      const nextIndex = slideIndex + direction;
      if (nextIndex < 0 || nextIndex >= state.slides.length) {
        return state;
      }

      const nextSlides = [...state.slides];
      const [slide] = nextSlides.splice(slideIndex, 1);
      nextSlides.splice(nextIndex, 0, slide);

      return {
        ...state,
        slides: normalizeSlidesOrder(nextSlides),
      };
    });
  };

  const addSlide = (): void => {
    setForm((state) =>
      state
        ? {
            ...state,
            slides: [...state.slides, createEmptySlide(state.slides.length)],
          }
        : state,
    );
  };

  const removeSlide = (slideIndex: number): void => {
    setForm((state) => {
      if (!state) {
        return state;
      }

      const nextSlides = state.slides.filter((_, index) => index !== slideIndex);

      return {
        ...state,
        slides: normalizeSlidesOrder(nextSlides),
      };
    });
  };

  const updateSlideListItem = (
    slideIndex: number,
    field: "theoryBlocks" | "bullets",
    itemIndex: number,
    value: string,
  ): void => {
    setForm((state) => {
      if (!state) {
        return state;
      }

      const nextSlides = state.slides.map((slide, index) => {
        if (index !== slideIndex) {
          return slide;
        }

        const nextItems = slide[field].map((item, currentIndex) => (currentIndex === itemIndex ? value : item));
        return {
          ...slide,
          [field]: nextItems,
        };
      });

      return {
        ...state,
        slides: nextSlides,
      };
    });
  };

  const addSlideListItem = (slideIndex: number, field: "theoryBlocks" | "bullets"): void => {
    setForm((state) => {
      if (!state) {
        return state;
      }

      const nextSlides = state.slides.map((slide, index) =>
        index === slideIndex
          ? {
              ...slide,
              [field]: [...slide[field], ""],
            }
          : slide,
      );

      return {
        ...state,
        slides: nextSlides,
      };
    });
  };

  const removeSlideListItem = (slideIndex: number, field: "theoryBlocks" | "bullets", itemIndex: number): void => {
    setForm((state) => {
      if (!state) {
        return state;
      }

      const nextSlides = state.slides.map((slide, index) => {
        if (index !== slideIndex) {
          return slide;
        }

        const nextItems = slide[field].filter((_, currentIndex) => currentIndex !== itemIndex);

        return {
          ...slide,
          [field]: nextItems.length > 0 ? nextItems : [""],
        };
      });

      return {
        ...state,
        slides: nextSlides,
      };
    });
  };

  const handleSave = async (): Promise<void> => {
    if (!form || validationError) {
      if (validationError) {
        setError(validationError);
      }
      return;
    }

    setPendingKey(editingCourseId === null ? "create-course" : `save-course-${editingCourseId}`);
    setError(null);

    try {
      const savedCourse =
        editingCourseId === null
          ? await adminApi.createCourse(form)
          : await adminApi.updateCourse(editingCourseId, form);

      setCourses((state) => {
        const exists = state.some((course) => course.id === savedCourse.id);
        if (exists) {
          return state.map((course) => (course.id === savedCourse.id ? savedCourse : course));
        }

        return [savedCourse, ...state];
      });
      setEditingCourseId(savedCourse.id);
      setForm(cloneCourseToForm(savedCourse));

      if (activeSearch) {
        await loadCourses(activeSearch);
      }
    } catch (nextError) {
      setError(getErrorMessage(nextError, "Не удалось сохранить курс"));
    } finally {
      setPendingKey(null);
    }
  };

  const handleDelete = async (course: AdminCourse): Promise<void> => {
    const confirmed = window.confirm(
      `Удалить курс «${course.title}»? Это действие удалит связанные зачисления, заметки и историю AI-чата.`,
    );

    if (!confirmed) {
      return;
    }

    setPendingKey(`delete-course-${course.id}`);
    setError(null);

    try {
      await adminApi.deleteCourse(course.id);
      setCourses((state) => state.filter((item) => item.id !== course.id));

      if (editingCourseId === course.id) {
        handleCancelEdit();
      }
    } catch (nextError) {
      setError(getErrorMessage(nextError, "Не удалось удалить курс"));
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <section className="space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <p className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
          Курсы
        </p>
        <h1 className="text-3xl font-bold">Управление курсами</h1>
        <p className="max-w-3xl text-muted-foreground">
          Здесь можно искать курсы, редактировать карточку и полностью управлять учебными слайдами в одном редакторе.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70 bg-card/72">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-xl bg-secondary p-3 text-primary">
              <BookOpenText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Всего курсов</p>
              <p className="text-2xl font-semibold">{courses.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/72">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-xl bg-success/15 p-3 text-success">
              <BookOpenText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Слайдов в базе</p>
              <p className="text-2xl font-semibold">{totalSlides}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/72">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-xl bg-warning/15 p-3 text-warning">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Категорий</p>
              <p className="text-2xl font-semibold">{categoriesCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card className="border-border/70 bg-card/72">
            <CardHeader>
              <CardTitle>Поиск и действия</CardTitle>
              <CardDescription>Ищите по id, названию, категории или уровню и открывайте курс в редакторе.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form className="flex flex-col gap-3" onSubmit={(event) => void handleSearchSubmit(event)}>
                <Input
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Например: Математика или Advanced"
                />
                <Button type="submit" disabled={isLoading}>
                  <Search className="mr-2 h-4 w-4" />
                  Найти
                </Button>
              </form>

              <Button type="button" variant="outline" className="w-full" onClick={handleCreateNew} disabled={pendingKey !== null}>
                <Plus className="mr-2 h-4 w-4" />
                Новый курс
              </Button>
            </CardContent>
          </Card>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Загружаем курсы...</p>
          ) : courses.length === 0 ? (
            <Card className="border-border/70 bg-card/72">
              <CardContent className="p-6 text-sm text-muted-foreground">
                По запросу {activeSearch ? `«${activeSearch}»` : "без фильтра"} курсы не найдены.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => {
                const isEditing = editingCourseId === course.id;
                const isOpen = openCourseId === course.id;

                return (
                  <Card
                    key={course.id}
                    className={`border-border/70 bg-card/72 transition ${
                      isEditing ? "ring-2 ring-primary/20" : ""
                    }`}
                  >
                    <CardContent className="p-5">
                      <button
                        type="button"
                        onClick={() => setOpenCourseId((state) => (state === course.id ? null : course.id))}
                        className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-semibold">{course.title}</h2>
                            <Badge variant="outline">id: {course.id}</Badge>
                          </div>

                          <Badge className="w-fit">{course.level}</Badge>

                          <p className="text-sm text-muted-foreground">
                            {course.category} · {course.slides.length} слайдов · {course.lessonsCount} уроков · {course.estimatedHours} ч
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                      </button>

                      {isOpen ? (
                        <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{course.category}</Badge>
                              <Badge variant="outline">{course.slides.length} слайдов</Badge>
                              <Badge variant="outline">{course.lessonsCount} уроков</Badge>
                              <Badge variant="outline">{course.estimatedHours} ч</Badge>
                            </div>

                            <p className="text-sm text-muted-foreground">{course.description}</p>
                            <p className="text-xs text-muted-foreground">Обновлен: {formatDate(course.updatedAt)}</p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => handleStartEdit(course)} disabled={pendingKey !== null}>
                              <PencilLine className="mr-2 h-4 w-4" />
                              Редактировать
                            </Button>
                            <Button
                              variant="outline"
                              className="border-warning/30 text-warning hover:bg-warning/10"
                              onClick={() => void handleDelete(course)}
                              disabled={pendingKey !== null}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Удалить
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <Card className="border-border/70 bg-card/72">
          <CardHeader>
            <CardTitle>{editingCourseId === null ? "Создание курса" : `Редактирование курса #${editingCourseId}`}</CardTitle>
            <CardDescription>
              Редактор сохраняет карточку курса и полностью заменяет состав и порядок слайдов.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error ? <p className="text-sm text-warning">{error}</p> : null}
            {validationError ? <p className="text-sm text-muted-foreground">{validationError}</p> : null}

            {form ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="course-title">Название курса</Label>
                    <Input
                      id="course-title"
                      value={form.title}
                      onChange={(event) => updateForm("title", event.target.value)}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="course-description">Описание</Label>
                    <Textarea
                      id="course-description"
                      value={form.description}
                      onChange={(event) => updateForm("description", event.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course-category">Категория</Label>
                    <Input
                      id="course-category"
                      value={form.category}
                      onChange={(event) => updateForm("category", event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course-level">Уровень</Label>
                    <Input
                      id="course-level"
                      value={form.level}
                      onChange={(event) => updateForm("level", event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course-lessons-count">Уроков</Label>
                    <Input
                      id="course-lessons-count"
                      type="number"
                      min={1}
                      value={form.lessonsCount}
                      onChange={(event) => updateForm("lessonsCount", Math.max(1, Number(event.target.value) || 1))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course-estimated-hours">Часов</Label>
                    <Input
                      id="course-estimated-hours"
                      type="number"
                      min={1}
                      value={form.estimatedHours}
                      onChange={(event) => updateForm("estimatedHours", Math.max(1, Number(event.target.value) || 1))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">Слайды</h2>
                      <p className="text-sm text-muted-foreground">
                        Минимум один слайд. Порядок сверху вниз совпадает с тем, что увидит ученик.
                      </p>
                    </div>
                    <Button type="button" variant="outline" onClick={addSlide}>
                      <Plus className="mr-2 h-4 w-4" />
                      Добавить слайд
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {form.slides.map((slide, slideIndex) => (
                      <Card key={`${slide.id ?? "new"}-${slide.orderIndex}`} className="border-border/70 bg-background/70">
                        <CardHeader className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                              <CardTitle>Слайд {slideIndex + 1}</CardTitle>
                              <CardDescription>
                                Отдельный учебный блок с теорией, ключевыми мыслями, примером и практикой.
                              </CardDescription>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => moveSlide(slideIndex, -1)}
                                disabled={slideIndex === 0}
                              >
                                <ChevronUp className="mr-2 h-4 w-4" />
                                Выше
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => moveSlide(slideIndex, 1)}
                                disabled={slideIndex === form.slides.length - 1}
                              >
                                <ChevronDown className="mr-2 h-4 w-4" />
                                Ниже
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="border-warning/30 text-warning hover:bg-warning/10"
                                onClick={() => removeSlide(slideIndex)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Удалить
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`slide-title-${slideIndex}`}>Заголовок</Label>
                              <Input
                                id={`slide-title-${slideIndex}`}
                                value={slide.title}
                                onChange={(event) => updateSlide(slideIndex, { title: event.target.value })}
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor={`slide-summary-${slideIndex}`}>Summary</Label>
                              <Textarea
                                id={`slide-summary-${slideIndex}`}
                                value={slide.summary}
                                onChange={(event) => updateSlide(slideIndex, { summary: event.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`slide-example-${slideIndex}`}>Example</Label>
                              <Textarea
                                id={`slide-example-${slideIndex}`}
                                value={slide.example}
                                onChange={(event) => updateSlide(slideIndex, { example: event.target.value })}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`slide-practice-${slideIndex}`}>Practice task</Label>
                              <Textarea
                                id={`slide-practice-${slideIndex}`}
                                value={slide.practiceTask}
                                onChange={(event) => updateSlide(slideIndex, { practiceTask: event.target.value })}
                              />
                            </div>
                          </div>

                          <RepeatableTextListEditor
                            label="Theory blocks"
                            placeholder="Теоретический блок"
                            values={slide.theoryBlocks}
                            onChange={(itemIndex, value) => updateSlideListItem(slideIndex, "theoryBlocks", itemIndex, value)}
                            onAdd={() => addSlideListItem(slideIndex, "theoryBlocks")}
                            onRemove={(itemIndex) => removeSlideListItem(slideIndex, "theoryBlocks", itemIndex)}
                          />

                          <RepeatableTextListEditor
                            label="Bullets"
                            placeholder="Ключевая мысль"
                            values={slide.bullets}
                            onChange={(itemIndex, value) => updateSlideListItem(slideIndex, "bullets", itemIndex, value)}
                            onAdd={() => addSlideListItem(slideIndex, "bullets")}
                            onRemove={(itemIndex) => removeSlideListItem(slideIndex, "bullets", itemIndex)}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void handleSave()} disabled={pendingKey !== null || validationError !== null}>
                    <Save className="mr-2 h-4 w-4" />
                    {editingCourseId === null ? "Создать курс" : "Сохранить курс"}
                  </Button>
                  <Button variant="outline" onClick={handleCancelEdit} disabled={pendingKey !== null}>
                    <X className="mr-2 h-4 w-4" />
                    Закрыть редактор
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4 rounded-2xl border border-dashed border-border/70 bg-background/50 p-6">
                <p className="text-sm text-muted-foreground">
                  Выберите курс слева или создайте новый, чтобы открыть редактор карточки и учебных слайдов.
                </p>
                <Button type="button" onClick={handleCreateNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать курс
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
