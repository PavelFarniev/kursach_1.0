import { BookOpenCheck, RotateCcw, Sparkles, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import type { EnrollmentStatus } from "@/types/domain";

interface ProgressWidgetProps {
  mode?: "overview" | "learning";
  progressPercent: number;
  status: EnrollmentStatus;
  lessonsCount: number;
  isEnrolled: boolean;
  onStartCourse: () => Promise<void>;
  onContinueCourse?: () => Promise<void>;
  onProgressChange?: (nextPercent: number) => Promise<void>;
}

const getStageTitle = (progressPercent: number): string => {
  if (progressPercent >= 100) {
    return "Курс завершён";
  }

  if (progressPercent >= 80) {
    return "Финишная прямая";
  }

  if (progressPercent >= 50) {
    return "Уверенный прогресс";
  }

  if (progressPercent >= 20) {
    return "Хороший темп";
  }

  return "Старт обучения";
};

const getStatusLabel = (status: EnrollmentStatus, isEnrolled: boolean): string => {
  if (!isEnrolled) {
    return "не начат";
  }

  return status === "completed" ? "завершён" : "в процессе";
};

export function ProgressWidget({
  mode = "learning",
  progressPercent,
  status,
  lessonsCount,
  isEnrolled,
  onStartCourse,
  onContinueCourse,
  onProgressChange,
}: ProgressWidgetProps): JSX.Element {
  const isOverviewMode = mode === "overview";
  const isCompleted = status === "completed";
  const safeLessonsCount = Math.max(1, lessonsCount);
  const [isPending, setIsPending] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(1);

  useEffect(() => {
    setSelectedLesson(1);
  }, [lessonsCount]);

  const completedLessons = useMemo(() => {
    if (!isEnrolled || progressPercent <= 0 || lessonsCount <= 0) {
      return 0;
    }

    const calculated = Math.round((progressPercent / 100) * lessonsCount);
    return Math.max(1, Math.min(lessonsCount, calculated));
  }, [isEnrolled, lessonsCount, progressPercent]);

  const remainingLessons = Math.max(0, lessonsCount - completedLessons);
  const stageTitle = getStageTitle(progressPercent);
  const statusLabel = getStatusLabel(status, isEnrolled);
  const statusVariant = !isEnrolled ? "outline" : isCompleted ? "success" : "warning";
  const nextLessonsValue = Math.min(lessonsCount, completedLessons + 1);
  const nextPercent = lessonsCount > 0 ? Math.round((nextLessonsValue / lessonsCount) * 100) : 0;
  const lessonOptions = useMemo(() => Array.from({ length: lessonsCount }, (_, index) => index + 1), [lessonsCount]);

  const handlePrimaryAction = async (): Promise<void> => {
    setIsPending(true);

    try {
      if (isOverviewMode) {
        if (!isEnrolled) {
          await onStartCourse();
          return;
        }

        if (onContinueCourse) {
          await onContinueCourse();
          return;
        }
      }

      if (!isEnrolled) {
        await onStartCourse();
        return;
      }

      if (!isCompleted && onProgressChange) {
        await onProgressChange(nextPercent);
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleReturnToLesson = async (): Promise<void> => {
    if (!onProgressChange) {
      return;
    }

    setIsPending(true);

    try {
      const clampedLesson = Math.min(safeLessonsCount, Math.max(1, selectedLesson));
      const reopenedPercent = Math.min(99, Math.round(((clampedLesson - 1) / safeLessonsCount) * 100));
      await onProgressChange(reopenedPercent);
    } finally {
      setIsPending(false);
    }
  };

  const handleRestartCourse = async (): Promise<void> => {
    if (!onProgressChange) {
      return;
    }

    setIsPending(true);

    try {
      await onProgressChange(0);
      setSelectedLesson(1);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="self-start border-border/70 bg-card/68">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <CardTitle>Прогресс по курсу</CardTitle>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{stageTitle}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <Progress value={progressPercent} />
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">Текущий прогресс</p>
          <p className="font-semibold">{progressPercent}%</p>
        </div>

        <div className="space-y-2 rounded-lg border border-border/70 bg-background/60 p-3 text-sm">
          <p className="flex items-center justify-between text-muted-foreground">
            <span>Пройдено уроков</span>
            <span className="font-semibold text-foreground">
              {completedLessons} / {lessonsCount}
            </span>
          </p>
          <p className="flex items-center justify-between text-muted-foreground">
            <span>Осталось до завершения</span>
            <span className="font-semibold text-foreground">{remainingLessons}</span>
          </p>
        </div>

        {(isOverviewMode || !isCompleted || !isEnrolled) && (
          <Button className="w-full" variant="default" onClick={() => void handlePrimaryAction()} disabled={isPending}>
            {!isEnrolled ? (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {isOverviewMode ? "Начать курс" : "Начать обучение"}
              </>
            ) : (
              <>
                <BookOpenCheck className="mr-2 h-4 w-4" />
                {isOverviewMode ? "Продолжить курс" : "Завершить урок"}
              </>
            )}
          </Button>
        )}

        {!isOverviewMode && isEnrolled && isCompleted && (
          <div className="space-y-3 rounded-lg border border-border/70 bg-background/60 p-3">
            <p className="text-sm text-muted-foreground">Курс завершён. Вы можете вернуться к любому уроку или пройти его заново.</p>

            <Select
              value={String(selectedLesson)}
              onChange={(event) => setSelectedLesson(Number(event.target.value))}
              disabled={isPending}
            >
              {lessonOptions.map((lesson) => (
                <option key={lesson} value={lesson}>
                  Урок {lesson}
                </option>
              ))}
            </Select>

            <Button className="w-full" variant="outline" onClick={() => void handleReturnToLesson()} disabled={isPending}>
              <Undo2 className="mr-2 h-4 w-4" />
              Вернуться к выбранному уроку
            </Button>

            <Button className="w-full" variant="secondary" onClick={() => void handleRestartCourse()} disabled={isPending}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Начать курс заново
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
