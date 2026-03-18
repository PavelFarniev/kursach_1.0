import { BookText, Clock3, Flame, NotebookPen, Radar, Target, Trash2, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { coursesApi } from "@/services/api/coursesApi";
import { cn } from "@/shared/lib/utils";
import { useCourseNotesStore } from "@/store/courseNotesStore";

type PulseMode = "today" | "week" | "sprint";

interface PulseData {
  label: string;
  readiness: number;
  solvedTasks: number;
  focusMinutes: number;
  streakDays: number;
  weakestTopic: string;
  chart: number[];
  plan: string[];
}

const MODE_OPTIONS: Array<{ key: PulseMode; label: string }> = [
  { key: "today", label: "Сегодня" },
  { key: "week", label: "Неделя" },
  { key: "sprint", label: "Спринт" },
];

const PULSE_DATA: Record<PulseMode, PulseData> = {
  today: {
    label: "Текущий день",
    readiness: 76,
    solvedTasks: 24,
    focusMinutes: 105,
    streakDays: 6,
    weakestTopic: "Параметры",
    chart: [34, 42, 45, 51, 58, 62, 74, 76],
    plan: [
      "Повторить 2 задачи на параметры",
      "Решить мини-блок по производной",
      "Спросить AI о типичных ошибках в 18-м задании",
    ],
  },
  week: {
    label: "7 дней",
    readiness: 83,
    solvedTasks: 116,
    focusMinutes: 540,
    streakDays: 6,
    weakestTopic: "Стереометрия",
    chart: [41, 48, 57, 60, 66, 74, 79, 83],
    plan: [
      "Закрыть пробелы по стереометрии",
      "Собрать чек-лист формул к субботе",
      "Пройти AI-разбор последнего пробника",
    ],
  },
  sprint: {
    label: "Ближайшие 14 дней",
    readiness: 89,
    solvedTasks: 238,
    focusMinutes: 1140,
    streakDays: 6,
    weakestTopic: "Геометрия (углы)",
    chart: [49, 54, 61, 68, 73, 78, 85, 89],
    plan: [
      "Довести прогресс курса до 95%",
      "Каждый день 1 вопрос в AI-чат по сложной теме",
      "Сделать 2 полноценных пробных варианта",
    ],
  },
};

const buildSparklinePath = (points: number[], width: number, height: number): string => {
  if (points.length < 2) {
    return "";
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const scale = max - min === 0 ? 1 : max - min;
  const step = width / (points.length - 1);

  return points
    .map((point, index) => {
      const x = index * step;
      const normalizedY = (point - min) / scale;
      const y = height - normalizedY * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
};

export function LearningPulsePanel(): JSX.Element {
  const [mode, setMode] = useState<PulseMode>("today");
  const [courseTitleById, setCourseTitleById] = useState<Record<number, string>>({});
  const notesListByCourseId = useCourseNotesStore((state) => state.notesListByCourseId);
  const removeNoteForCourse = useCourseNotesStore((state) => state.removeNoteForCourse);
  const data = PULSE_DATA[mode];

  const aggregatedCourseNotes = useMemo(
    () =>
      Object.entries(notesListByCourseId).flatMap(([rawCourseId, notes]) =>
        (Array.isArray(notes) ? notes : []).map((note, index) => ({
          id: `${rawCourseId}-${index}-${note}`,
          courseId: Number(rawCourseId),
          noteIndex: index,
          note,
        })),
      ),
    [notesListByCourseId],
  );

  const notedCourseIds = useMemo(
    () => Array.from(new Set(aggregatedCourseNotes.map((item) => item.courseId))),
    [aggregatedCourseNotes],
  );

  useEffect(() => {
    const missingCourseIds = notedCourseIds.filter((courseId) => !courseTitleById[courseId]);

    if (missingCourseIds.length === 0) {
      return;
    }

    let cancelled = false;

    void Promise.all(
      missingCourseIds.map(async (courseId) => {
        try {
          const course = await coursesApi.getById(courseId);
          return { courseId, title: course.title };
        } catch {
          return { courseId, title: `Курс ${courseId}` };
        }
      }),
    ).then((items) => {
      if (cancelled) {
        return;
      }

      setCourseTitleById((prev) => {
        const next = { ...prev };
        items.forEach(({ courseId, title }) => {
          next[courseId] = title;
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [notedCourseIds, courseTitleById]);

  const sparkline = useMemo(() => {
    const width = 280;
    const height = 72;
    const linePath = buildSparklinePath(data.chart, width, height);
    const areaPath = `${linePath} L${width} ${height} L0 ${height} Z`;

    return {
      linePath,
      areaPath,
      width,
      height,
    };
  }, [data.chart]);

  return (
    <Card className="pulse-surface relative overflow-hidden border-border/75 bg-card/74 shadow-md shadow-sky-900/5">
      <div className="pulse-orb pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
      <div className="pulse-orb pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />

      <CardHeader className="relative z-10 gap-2.5 p-4 pb-3 md:flex-row md:items-start md:justify-between md:p-5 md:pb-4">
        <div className="space-y-1.5">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Radar className="h-3.5 w-3.5" />
            AI Study Pulse
          </p>
          <CardTitle className="text-lg md:text-xl">Ваша персональная панель подготовки</CardTitle>
          <p className="max-w-xl text-sm text-muted-foreground">
            Живой статус по подготовке: темп, зона риска и следующий шаг, который стоит сделать прямо сейчас.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-border/80 bg-background/66 p-1 backdrop-blur">
          {MODE_OPTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setMode(item.key)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition sm:text-sm",
                mode === item.key ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-secondary/70",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-3 p-4 pt-0 md:p-5 md:pt-0">
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-border/80 bg-background/62 p-2.5">
            <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">Готовность</p>
            <p className="text-xl font-bold">{data.readiness}%</p>
            <div className="mt-2 h-2 rounded-full bg-muted/70">
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${data.readiness}%` }} />
            </div>
          </div>

          <div className="rounded-xl border border-border/80 bg-background/62 p-2.5">
            <p className="mb-1.5 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              Задачи
            </p>
            <p className="text-xl font-bold">{data.solvedTasks}</p>
            <p className="text-xs text-muted-foreground">решено за период</p>
          </div>

          <div className="rounded-xl border border-border/80 bg-background/62 p-2.5">
            <p className="mb-1.5 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Clock3 className="h-3.5 w-3.5" />
              Фокус
            </p>
            <p className="text-xl font-bold">{data.focusMinutes}</p>
            <p className="text-xs text-muted-foreground">минут работы</p>
          </div>

          <div className="rounded-xl border border-border/80 bg-background/62 p-2.5">
            <p className="mb-1.5 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Flame className="h-3.5 w-3.5" />
              Серия
            </p>
            <p className="text-xl font-bold">{data.streakDays}</p>
            <p className="text-xs text-muted-foreground">дней подряд</p>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.05fr_1fr]">
          <div className="rounded-xl border border-border/80 bg-background/62 p-3">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-sm font-semibold">Динамика подготовки</p>
              <Badge variant="outline">live</Badge>
            </div>
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Период: {data.label}</span>
              <span>Слабая зона: {data.weakestTopic}</span>
            </div>

            <svg viewBox={`0 0 ${sparkline.width} ${sparkline.height}`} className="h-16 w-full">
              <defs>
                <linearGradient id="pulseAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(14, 165, 233, 0.35)" />
                  <stop offset="100%" stopColor="rgba(14, 165, 233, 0.03)" />
                </linearGradient>
              </defs>
              <path d={sparkline.areaPath} fill="url(#pulseAreaGradient)" />
              <path d={sparkline.linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border/80 bg-background/62 p-3">
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
                <NotebookPen className="h-4 w-4 text-primary" />
                Заметки пользователя
              </p>
              {aggregatedCourseNotes.length > 0 ? (
                <div className="max-h-36 space-y-2 overflow-y-auto pr-1 text-sm">
                  {aggregatedCourseNotes.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 px-2 py-1.5">
                      <p className="flex items-start gap-2">
                        <BookText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="text-foreground">
                          {item.note}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({courseTitleById[item.courseId] ?? `Курс ${item.courseId}`})
                          </span>
                        </span>
                      </p>
                      <button
                        type="button"
                        aria-label="Удалить заметку"
                        onClick={() => removeNoteForCourse(item.courseId, item.noteIndex)}
                        className="rounded-md p-1 text-muted-foreground transition hover:bg-background hover:text-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Пока нет заметок из курсов.</p>
              )}
            </div>

            <div className="rounded-xl border border-border/80 bg-background/62 p-3">
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-semibold">
                <WandSparkles className="h-4 w-4 text-primary" />
                Рекомендации
              </p>
              <div className="max-h-36 space-y-2 overflow-y-auto pr-1 text-sm">
                {data.plan.map((task) => (
                  <div key={task} className="flex items-start gap-2 rounded-lg bg-muted/40 px-2 py-1.5">
                    <BookText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="text-foreground">{task}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
