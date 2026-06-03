import type { Course, CourseNote, Enrollment, LearningPulse } from "@/types/domain";

type MockPulseEventType = "site_visit" | "course_enroll" | "course_progress" | "ai_question";

interface MockPulseActivity {
  userId: number;
  eventType: MockPulseEventType;
  courseId?: number;
  value: number;
  createdAt: string;
}

interface PulsePeriod {
  key: keyof LearningPulse;
  label: string;
  bucketCount: number;
  bucketSizeMs: number;
}

const MOCK_PULSE_STORAGE_KEY = "mock-pulse-activity-log";
const MOCK_NOTES_STORAGE_KEY = "course-notes-storage";
const DEMO_USER_ID = 1;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const PULSE_PERIODS: PulsePeriod[] = [
  { key: "today", label: "Текущий день", bucketCount: 8, bucketSizeMs: 3 * 60 * 60 * 1000 },
  { key: "week", label: "7 дней", bucketCount: 7, bucketSizeMs: 24 * 60 * 60 * 1000 },
  { key: "sprint", label: "Ближайшие 14 дней", bucketCount: 14, bucketSizeMs: 24 * 60 * 60 * 1000 },
];

const hasStorage = (): boolean => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const nowIso = (): string => new Date().toISOString();

const safeJsonParse = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const createDemoActivities = (): MockPulseActivity[] => {
  const now = Date.now();
  return [
    { userId: DEMO_USER_ID, eventType: "site_visit", value: 1, createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString() },
    { userId: DEMO_USER_ID, eventType: "course_enroll", courseId: 2, value: 1, createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString() },
    { userId: DEMO_USER_ID, eventType: "course_progress", courseId: 2, value: 20, createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { userId: DEMO_USER_ID, eventType: "site_visit", value: 1, createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { userId: DEMO_USER_ID, eventType: "course_enroll", courseId: 4, value: 1, createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { userId: DEMO_USER_ID, eventType: "course_progress", courseId: 4, value: 55, createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString() },
  ];
};

const readActivities = (): MockPulseActivity[] => {
  if (!hasStorage()) {
    return [];
  }

  return safeJsonParse<MockPulseActivity[]>(window.localStorage.getItem(MOCK_PULSE_STORAGE_KEY)) ?? [];
};

const writeActivities = (activities: MockPulseActivity[]): void => {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.setItem(MOCK_PULSE_STORAGE_KEY, JSON.stringify(activities));
};

const ensureDemoSeed = (): void => {
  if (!hasStorage()) {
    return;
  }

  const activities = readActivities();
  if (activities.some((activity) => activity.userId === DEMO_USER_ID)) {
    return;
  }

  writeActivities([...activities, ...createDemoActivities()]);
};

const courseTitleById = (courses: Course[]): Record<number, string> =>
  courses.reduce<Record<number, string>>((accumulator, course) => {
    accumulator[course.id] = course.title;
    return accumulator;
  }, {});

const readNotesState = (): { state?: { notesByCourseId?: Record<string, CourseNote[]> } } | null =>
  safeJsonParse<{ state?: { notesByCourseId?: Record<string, CourseNote[]> } }>(
    hasStorage() ? window.localStorage.getItem(MOCK_NOTES_STORAGE_KEY) : null,
  );

export const readMockStoredNotes = (): CourseNote[] => {
  const notesByCourseId = readNotesState()?.state?.notesByCourseId;

  if (!notesByCourseId || typeof notesByCourseId !== "object") {
    return [];
  }

  return Object.values(notesByCourseId).flatMap((notes) => (Array.isArray(notes) ? notes : []));
};

export const recordMockPulseActivity = (
  activity: Omit<MockPulseActivity, "createdAt"> & { createdAt?: string },
  options?: { dedupeWindowMs?: number },
): void => {
  ensureDemoSeed();

  const activities = readActivities();
  const createdAt = activity.createdAt ?? nowIso();
  const nextCreatedAt = new Date(createdAt).getTime();

  if (options?.dedupeWindowMs) {
    const duplicate = [...activities]
      .reverse()
      .find(
        (item) =>
          item.userId === activity.userId &&
          item.eventType === activity.eventType &&
          item.courseId === activity.courseId,
      );

    if (duplicate) {
      const duplicateAt = new Date(duplicate.createdAt).getTime();
      if (Number.isFinite(duplicateAt) && nextCreatedAt - duplicateAt < options.dedupeWindowMs) {
        return;
      }
    }
  }

  writeActivities([
    ...activities,
    {
      ...activity,
      createdAt,
    },
  ]);
};

const computeReadiness = (enrollments: Enrollment[]): number => {
  if (enrollments.length === 0) {
    return 0;
  }

  const averageProgress = enrollments.reduce((sum, item) => sum + item.progressPercent, 0) / enrollments.length;
  const completedShare = enrollments.filter((item) => item.status === "completed").length / enrollments.length;
  const readiness = Math.round(averageProgress * 0.85 + completedShare * 15);
  return Math.max(0, Math.min(100, readiness));
};

const computeWeakestTopic = (enrollments: Enrollment[], titles: Record<number, string>): string => {
  if (enrollments.length === 0) {
    return "Пока не определена";
  }

  const candidates = enrollments.filter((item) => item.progressPercent < 100);
  const weakest = [...(candidates.length > 0 ? candidates : enrollments)].sort(
    (left, right) => left.progressPercent - right.progressPercent || left.courseId - right.courseId,
  )[0];

  return titles[weakest.courseId] ?? "Пока не определена";
};

const buildPlan = (input: {
  enrollments: Enrollment[];
  titles: Record<number, string>;
  weakestTopic: string;
  siteVisits: number;
  notesCount: number;
  aiQuestionsCount: number;
  progressEventsCount: number;
}): string[] => {
  const { enrollments, titles, weakestTopic, siteVisits, notesCount, aiQuestionsCount, progressEventsCount } = input;

  if (enrollments.length === 0) {
    return [
      "Выберите первый курс и откройте вводный блок, чтобы Pulse начал собирать вашу динамику.",
      "После первого входа возвращайтесь ежедневно: серия появится уже со второго дня.",
      "Фиксируйте заметки и задавайте вопросы в AI-чате, чтобы панель видела реальные учебные сигналы.",
    ];
  }

  const plan: string[] = [];
  const weakestEnrollment = [...enrollments]
    .filter((item) => item.progressPercent < 100)
    .sort((left, right) => left.progressPercent - right.progressPercent || left.courseId - right.courseId)[0];

  if (weakestEnrollment && weakestEnrollment.progressPercent < 75) {
    const nextTarget = Math.min(100, weakestEnrollment.progressPercent + 15);
    plan.push(
      `Вернитесь к курсу «${titles[weakestEnrollment.courseId] ?? weakestTopic}» и поднимите прогресс хотя бы до ${nextTarget}%.`,
    );
  }

  if (progressEventsCount === 0) {
    plan.push("Откройте следующий слайд в активном курсе: без движения по материалу Pulse не увидит прогресс.");
  }

  if (notesCount === 0) {
    plan.push("Добавьте хотя бы одну заметку по сложной теме: так слабые места начнут проявляться точнее.");
  }

  if (aiQuestionsCount === 0) {
    plan.push("Задайте один вопрос в AI-чате по последнему уроку, чтобы сразу закрыть непонятные моменты.");
  }

  if (siteVisits < 2) {
    plan.push("Зайдите на платформу ещё раз завтра, чтобы закрепить ритм и не обрывать серию.");
  }

  if (plan.length < 3 && weakestTopic !== "Пока не определена") {
    plan.push(`Сделайте короткое повторение по зоне риска: сейчас это «${weakestTopic}».`);
  }

  if (plan.length < 3) {
    const completedCourses = enrollments.filter((item) => item.status === "completed").length;
    if (completedCourses < enrollments.length) {
      plan.push("Доведите один из активных курсов до завершения: это сильнее всего поднимает готовность.");
    }
  }

  return plan.slice(0, 3);
};

const collectActiveDates = (values: Array<{ createdAt: string }>): Set<string> => {
  const threshold = Date.now() - THIRTY_DAYS_MS;
  return new Set(
    values
      .map((item) => new Date(item.createdAt).getTime())
      .filter((value) => Number.isFinite(value) && value >= threshold)
      .map((value) => new Date(value).toISOString().slice(0, 10)),
  );
};

const computeStreakDays = (activeDates: Set<string>): number => {
  if (activeDates.size === 0) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date();

  while (activeDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const buildChart = (input: {
  period: PulsePeriod;
  readiness: number;
  siteVisits: MockPulseActivity[];
  progressEvents: MockPulseActivity[];
  notes: CourseNote[];
  aiQuestions: MockPulseActivity[];
}): number[] => {
  const { period, readiness, siteVisits, progressEvents, notes, aiQuestions } = input;
  const now = Date.now();
  const periodStart = now - period.bucketCount * period.bucketSizeMs;
  const buckets = Array.from({ length: period.bucketCount }, () => 0);

  const incrementBucket = (createdAt: string, weight: number): void => {
    const createdAtMs = new Date(createdAt).getTime();
    if (!Number.isFinite(createdAtMs) || createdAtMs < periodStart || createdAtMs > now) {
      return;
    }

    const index = Math.min(
      period.bucketCount - 1,
      Math.max(0, Math.floor((createdAtMs - periodStart) / period.bucketSizeMs)),
    );
    buckets[index] += weight;
  };

  siteVisits.forEach((item) => incrementBucket(item.createdAt, 14));
  progressEvents.forEach((item) => incrementBucket(item.createdAt, item.eventType === "course_enroll" ? 18 : 8 + Math.min(24, Math.max(0, item.value))));
  notes.forEach((item) => incrementBucket(item.createdAt, 16));
  aiQuestions.forEach((item) => incrementBucket(item.createdAt, 12));

  const hasActivity = buckets.some((bucket) => bucket > 0);
  if (!hasActivity) {
    return Array.from({ length: period.bucketCount }, () => readiness);
  }

  const baseLine = readiness > 0 ? Math.max(8, Math.round(readiness * 0.22)) : 0;
  return buckets.map((value) => Math.max(0, Math.min(100, baseLine + value)));
};

export const getMockLearningPulse = (input: {
  userId: number;
  courses: Course[];
  enrollments: Enrollment[];
}): LearningPulse => {
  ensureDemoSeed();

  const { userId, courses, enrollments } = input;
  const titles = courseTitleById(courses);
  const readiness = computeReadiness(enrollments);
  const weakestTopic = computeWeakestTopic(enrollments, titles);
  const allActivities = readActivities().filter((item) => item.userId === userId);
  const allNotes = readMockStoredNotes();
  const siteVisits = allActivities.filter((item) => item.eventType === "site_visit");
  const progressEvents = allActivities.filter((item) => item.eventType === "course_enroll" || item.eventType === "course_progress");
  const aiQuestions = allActivities.filter((item) => item.eventType === "ai_question");
  const activeDates = collectActiveDates([...siteVisits, ...progressEvents, ...allNotes, ...aiQuestions]);
  const streakDays = computeStreakDays(activeDates);

  return PULSE_PERIODS.reduce<LearningPulse>(
    (accumulator, period) => {
      const periodStart = Date.now() - period.bucketCount * period.bucketSizeMs;
      const periodSiteVisits = siteVisits.filter((item) => new Date(item.createdAt).getTime() >= periodStart);
      const periodProgressEvents = progressEvents.filter((item) => new Date(item.createdAt).getTime() >= periodStart);
      const periodNotes = allNotes.filter((item) => new Date(item.createdAt).getTime() >= periodStart);
      const periodAiQuestions = aiQuestions.filter((item) => new Date(item.createdAt).getTime() >= periodStart);
      const progressEventsCount = periodProgressEvents.filter((item) => item.eventType === "course_progress" && item.value > 0).length;

      accumulator[period.key] = {
        label: period.label,
        readiness,
        activityCount: periodProgressEvents.length + periodNotes.length + periodAiQuestions.length,
        siteVisits: periodSiteVisits.length,
        streakDays,
        weakestTopic,
        chart: buildChart({
          period,
          readiness,
          siteVisits: periodSiteVisits,
          progressEvents: periodProgressEvents,
          notes: periodNotes,
          aiQuestions: periodAiQuestions,
        }),
        plan: buildPlan({
          enrollments,
          titles,
          weakestTopic,
          siteVisits: periodSiteVisits.length,
          notesCount: periodNotes.length,
          aiQuestionsCount: periodAiQuestions.length,
          progressEventsCount,
        }),
      };
      return accumulator;
    },
    {
      today: {
        label: "Текущий день",
        readiness: 0,
        activityCount: 0,
        siteVisits: 0,
        streakDays: 0,
        weakestTopic: "Пока не определена",
        chart: [],
        plan: [],
      },
      week: {
        label: "7 дней",
        readiness: 0,
        activityCount: 0,
        siteVisits: 0,
        streakDays: 0,
        weakestTopic: "Пока не определена",
        chart: [],
        plan: [],
      },
      sprint: {
        label: "Ближайшие 14 дней",
        readiness: 0,
        activityCount: 0,
        siteVisits: 0,
        streakDays: 0,
        weakestTopic: "Пока не определена",
        chart: [],
        plan: [],
      },
    },
  );
};

export const resetMockPulseState = (): void => {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.removeItem(MOCK_PULSE_STORAGE_KEY);
};

export const mockPulseDedupeWindowMs = THIRTY_MINUTES_MS;
