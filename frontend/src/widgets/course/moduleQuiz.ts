export const QUIZ_PREFIX = "QUIZ::";
export const FINAL_QUIZ_PASS_PERCENT = 70;

interface ModuleQuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface ModuleQuiz {
  title: string;
  description?: string;
  questions: ModuleQuizQuestion[];
}

export interface ModuleQuizResult {
  correctCount: number;
  totalQuestions: number;
  scorePercent: number;
  passed: boolean;
  passingScore: number;
}

const isQuestion = (value: unknown): value is ModuleQuizQuestion => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<ModuleQuizQuestion>;
  return (
    typeof candidate.prompt === "string" &&
    Array.isArray(candidate.options) &&
    candidate.options.length >= 2 &&
    candidate.options.every((item) => typeof item === "string") &&
    typeof candidate.correctIndex === "number" &&
    candidate.correctIndex >= 0 &&
    candidate.correctIndex < candidate.options.length &&
    (candidate.explanation === undefined || typeof candidate.explanation === "string")
  );
};

export const parseModuleQuiz = (practiceTask: string): ModuleQuiz | null => {
  const normalizedTask = practiceTask.trim();
  const rawPayload = normalizedTask.startsWith(QUIZ_PREFIX)
    ? normalizedTask.slice(QUIZ_PREFIX.length)
    : normalizedTask.startsWith("{")
      ? normalizedTask
      : null;

  if (!rawPayload) {
    return null;
  }

  try {
    const payload = JSON.parse(rawPayload) as Partial<ModuleQuiz>;
    if (
      typeof payload.title !== "string" ||
      !Array.isArray(payload.questions) ||
      payload.questions.length === 0 ||
      !payload.questions.every(isQuestion)
    ) {
      return null;
    }

    if (payload.description !== undefined && typeof payload.description !== "string") {
      return null;
    }

    return {
      title: payload.title,
      description: payload.description,
      questions: payload.questions,
    };
  } catch {
    return null;
  }
};

export const buildModuleQuizResult = (
  quiz: ModuleQuiz,
  answers: Array<number | null>,
  passingScore = FINAL_QUIZ_PASS_PERCENT,
): ModuleQuizResult => {
  const correctCount = answers.reduce<number>(
    (sum, answer, index) => sum + (answer === quiz.questions[index].correctIndex ? 1 : 0),
    0,
  );
  const totalQuestions = quiz.questions.length;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  return {
    correctCount,
    totalQuestions,
    scorePercent,
    passed: scorePercent >= passingScore,
    passingScore,
  };
};
