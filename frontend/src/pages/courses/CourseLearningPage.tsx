import { ArrowLeft, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCourseStore } from "@/store/courseStore";
import { useEnrollmentStore } from "@/store/enrollmentStore";
import { CourseSlidesDeck } from "@/widgets/course/CourseSlidesDeck";
import { CourseSupportDropdown } from "@/widgets/course/CourseSupportDropdown";

const progressToSlideIndex = (progressPercent: number, slidesCount: number): number => {
  if (slidesCount <= 0 || progressPercent <= 0) {
    return 0;
  }

  for (let slideIndex = 0; slideIndex < slidesCount; slideIndex += 1) {
    const slideProgress = Math.round(((slideIndex + 1) / slidesCount) * 100);

    if (progressPercent <= slideProgress) {
      return slideIndex;
    }
  }

  return slidesCount - 1;
};

const slideIndexToProgress = (slideIndex: number, slidesCount: number): number => {
  if (slidesCount <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(((slideIndex + 1) / slidesCount) * 100)));
};

export function CourseLearningPage(): JSX.Element {
  const params = useParams<{ id: string }>();
  const courseId = Number(params.id);
  const [actionLoading, setActionLoading] = useState(false);

  const selectedCourse = useCourseStore((state) => state.selectedCourse);
  const isLoadingCourse = useCourseStore((state) => state.isLoadingCourse);
  const courseError = useCourseStore((state) => state.error);
  const fetchCourseById = useCourseStore((state) => state.fetchCourseById);

  const enrollments = useEnrollmentStore((state) => state.enrollments);
  const fetchMyEnrollments = useEnrollmentStore((state) => state.fetchMyEnrollments);
  const enrollToCourse = useEnrollmentStore((state) => state.enrollToCourse);
  const updateProgress = useEnrollmentStore((state) => state.updateProgress);

  const enrollment = useMemo(() => enrollments.find((item) => item.courseId === courseId), [enrollments, courseId]);
  const progressPercent = enrollment?.progressPercent ?? 0;
  const isCompleted = enrollment?.status === "completed";
  const slidesCount = selectedCourse?.slides?.length ?? 0;
  const derivedSlideIndex = useMemo(() => progressToSlideIndex(progressPercent, slidesCount), [progressPercent, slidesCount]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(derivedSlideIndex);
  const persistedProgressRef = useRef(progressPercent);
  const desiredProgressRef = useRef(progressPercent);
  const isSyncingProgressRef = useRef(false);
  const hasLocalSlideControlRef = useRef(false);
  const displayProgressPercent = enrollment ? slideIndexToProgress(currentSlideIndex, slidesCount) : 0;

  useEffect(() => {
    if (!Number.isFinite(courseId)) {
      return;
    }

    void fetchCourseById(courseId);
    void fetchMyEnrollments();
  }, [courseId, fetchCourseById, fetchMyEnrollments]);

  useEffect(() => {
    hasLocalSlideControlRef.current = false;
    setCurrentSlideIndex(derivedSlideIndex);
    persistedProgressRef.current = progressPercent;
    desiredProgressRef.current = progressPercent;
  }, [courseId]);

  useEffect(() => {
    persistedProgressRef.current = progressPercent;

    if (!hasLocalSlideControlRef.current) {
      setCurrentSlideIndex(derivedSlideIndex);
      desiredProgressRef.current = progressPercent;
    }
  }, [derivedSlideIndex, progressPercent]);

  const flushProgressSync = async (enrollmentId: number): Promise<void> => {
    if (isSyncingProgressRef.current) {
      return;
    }

    isSyncingProgressRef.current = true;

    try {
      while (desiredProgressRef.current !== persistedProgressRef.current) {
        const nextProgress = desiredProgressRef.current;

        try {
          await updateProgress(enrollmentId, nextProgress);
          persistedProgressRef.current = nextProgress;
        } catch {
          desiredProgressRef.current = persistedProgressRef.current;
          hasLocalSlideControlRef.current = false;
          setCurrentSlideIndex(progressToSlideIndex(persistedProgressRef.current, slidesCount));
          break;
        }
      }
    } finally {
      isSyncingProgressRef.current = false;
    }
  };

  const handleStartCourse = async (): Promise<void> => {
    if (!selectedCourse || enrollment) {
      return;
    }

    setActionLoading(true);

    try {
      const createdEnrollment = await enrollToCourse(selectedCourse.id);
      const initialSlideIndex = Math.min(currentSlideIndex, Math.max(0, slidesCount - 1));
      const initialProgress = slideIndexToProgress(initialSlideIndex, slidesCount);

      if (slidesCount > 0) {
        desiredProgressRef.current = initialProgress;
        persistedProgressRef.current = createdEnrollment.progressPercent;
        await flushProgressSync(createdEnrollment.id);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestartCourse = async (): Promise<void> => {
    if (!enrollment) {
      return;
    }

    setActionLoading(true);

    try {
      desiredProgressRef.current = 0;
      persistedProgressRef.current = 0;
      hasLocalSlideControlRef.current = true;
      await updateProgress(enrollment.id, 0);
      setCurrentSlideIndex(0);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSlideChange = (nextIndex: number): void => {
    const clampedIndex = Math.min(Math.max(0, nextIndex), Math.max(0, slidesCount - 1));
    hasLocalSlideControlRef.current = true;
    setCurrentSlideIndex(clampedIndex);

    if (!enrollment) {
      return;
    }

    desiredProgressRef.current = slideIndexToProgress(clampedIndex, slidesCount);
    void flushProgressSync(enrollment.id);
  };

  if (!Number.isFinite(courseId)) {
    return <p className="text-warning">Некорректный идентификатор курса</p>;
  }

  if (courseError) {
    return <p className="text-warning">{courseError}</p>;
  }

  if (isLoadingCourse || !selectedCourse || selectedCourse.id !== courseId) {
    return <p className="text-muted-foreground">Загружаем материалы курса...</p>;
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 pb-28 xl:pb-40 animate-fade-in-up">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" className="-ml-2 w-fit">
          <Link to={`/courses/${courseId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к курсу
          </Link>
        </Button>
      </div>

      <Card className="border-border/70 bg-card/80 shadow-sm">
        <CardContent className="space-y-5 p-6 md:p-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {selectedCourse.category} • {selectedCourse.level}
            </p>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight md:text-4xl">{selectedCourse.title}</h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Обычный учебный режим: один экран, один слайд, одна мысль за раз. Сначала теория, затем переход к следующему блоку.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="text-muted-foreground">Прогресс по курсу</p>
              <p className="font-semibold text-foreground">{displayProgressPercent}%</p>
            </div>

            <Progress value={displayProgressPercent} />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Слайды: {slidesCount > 0 && enrollment ? currentSlideIndex + 1 : 0} / {slidesCount}
                </p>
                <p className="text-sm text-muted-foreground">
                  Прогресс соответствует текущему открытому слайду и меняется при переходах вперёд и назад.
                </p>
              </div>

              {!enrollment ? (
                <Button onClick={() => void handleStartCourse()} disabled={actionLoading}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Начать обучение
                </Button>
              ) : isCompleted ? (
                <Button variant="outline" onClick={() => void handleRestartCourse()} disabled={actionLoading}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Пройти заново
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <CourseSlidesDeck course={selectedCourse} currentIndex={currentSlideIndex} onSlideChange={handleSlideChange} />

      <CourseSupportDropdown courseId={selectedCourse.id} courseTitle={selectedCourse.title} />

      {actionLoading ? <p className="text-sm text-muted-foreground">Сохраняем изменения...</p> : null}
    </section>
  );
}
