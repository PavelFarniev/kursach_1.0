import type {
  ChatMessage,
  Course,
  Enrollment,
  EnrollmentStatus,
  LearningPulse,
  UserProfile,
} from "@/types/domain";
import type {
  AIAskPayload,
  AIAskResponse,
  AIHistoryResponse,
  CourseFilters,
  LoginPayload,
  RegisterPayload,
  TokenPair,
} from "@/types/api";
import {
  getMockLearningPulse,
  mockPulseDedupeWindowMs,
  recordMockPulseActivity,
  resetMockPulseState,
} from "@/shared/mocks/mockPulse";

interface MockUser extends UserProfile {
  password: string;
}

const NETWORK_DELAY_MS = 550;

const buildQuizTask = (payload: Record<string, unknown>): string => `QUIZ::${JSON.stringify(payload)}`;

const courses: Course[] = [
  {
    id: 1,
    title: "ЕГЭ Математика: профиль",
    description:
      "Курс по ключевым темам профильной математики: производные, параметры, стереометрия и задачи повышенной сложности.",
    category: "Математика",
    level: "Advanced",
    lessonsCount: 42,
    estimatedHours: 55,
    slides: [
      {
        id: "math-derivative",
        title: "Производная как инструмент анализа",
        summary: "Производная помогает увидеть, как функция ведет себя на всем промежутке, а не только в одной точке.",
        theoryBlocks: [
          "После вычисления производной задача только начинается: важно понять, где она положительна, отрицательна или равна нулю. Именно это превращает вычисление в вывод о поведении функции.",
          "Критические точки делят числовую прямую на интервалы. Дальше мы строим таблицу знаков и уже по ней определяем возрастание, убывание и наличие экстремумов.",
        ],
        bullets: [
          "Сначала фиксируйте область определения функции.",
          "Затем находите нули производной и точки, где она не существует.",
          "После этого переходите к таблице знаков и формулируйте вывод.",
        ],
        example:
          "Для функции y = x^3 - 3x^2 + 2 производная равна y' = 3x(x - 2), поэтому критические точки x = 0 и x = 2 делят ось на три рабочих интервала.",
        practiceTask: "Исследуйте функцию y = x^3 - 3x^2 + 2 и определите интервалы возрастания и убывания.",
      },
      {
        id: "math-parameters",
        title: "Параметры: где меняется число решений",
        summary: "В задачах с параметром важнее увидеть переломные значения, чем просто долго считать.",
        theoryBlocks: [
          "Полезно отделять переменную x от параметра a: x решается, а параметр управляет формой уравнения или графика. Из-за этого число решений меняется не случайно, а в особых конфигурациях.",
          "Чаще всего нужно искать касания, границы области допустимых значений и нулевой дискриминант. Именно в этих точках задача меняет характер.",
        ],
        bullets: [
          "Отдельно выписывайте ограничения на x и на параметр.",
          "Ищите критические значения параметра, где ситуация качественно меняется.",
          "Если алгебра перегружена, переходите к графической интерпретации.",
        ],
        example:
          "Для уравнения x^2 - 2ax + a = 0 удобно исследовать дискриминант D = 4a(a - 1), потому что по его знаку сразу видно число корней.",
        practiceTask: "Найдите, при каких значениях a уравнение x^2 - 2ax + a = 0 имеет ровно один корень.",
      },
      {
        id: "math-stereometry",
        title: "Стереометрия без перегруза",
        summary: "Правильное сечение и аккуратный чертеж резко упрощают пространственную задачу.",
        theoryBlocks: [
          "В стереометрии важно быстро найти рабочую плоскость, в которой появляются знакомые плоские фигуры. Тогда пространственная задача сводится к треугольникам, углам и длинам, которые мы уже умеем считать.",
          "Если сразу отметить прямые углы, параллельность и середины отрезков, решение перестает быть хаотичным и становится последовательным.",
        ],
        bullets: [
          "Сначала определите рабочее сечение.",
          "Подписывайте на рисунке все существенные связи между элементами.",
          "Перед вычислением проговорите, из какого треугольника берется формула.",
        ],
        example:
          "В правильной пирамиде высоту боковой грани часто ищут через сечение, проходящее через вершину и середину стороны основания.",
        practiceTask: "Сделайте чертеж правильной четырехугольной пирамиды и перечислите, какие плоские треугольники в ней удобны для расчета высоты.",
      },
      {
        id: "math-final-quiz",
        title: "Итоговое тестирование",
        summary: "Финальный тест завершает курс и проверяет, насколько уверенно усвоены ключевые идеи.",
        theoryBlocks: [
          "Перед выбором ответа полезно коротко проговорить правило: знак производной, переломное значение параметра или нужное сечение в пространственной фигуре.",
          "Для завершения курса недостаточно просто дойти до последнего слайда: нужно пройти итоговый тест и набрать проходной балл.",
        ],
        bullets: [
          "Проверьте понимание производной и таблицы знаков.",
          "Вспомните, где в задачах с параметром меняется число решений.",
          "Опирайтесь на рабочее сечение в стереометрии.",
        ],
        example: "Выберите один ответ в каждом вопросе и отправьте итоговый тест на проверку.",
        practiceTask: buildQuizTask({
          title: "Итоговый тест по курсу",
          description: "Для завершения курса нужно набрать не менее 70% правильных ответов.",
          questions: [
            {
              prompt: "Что показывает знак производной на промежутке?",
              options: [
                "Цвет графика функции",
                "Интервалы возрастания и убывания функции",
                "Только значение функции в одной точке",
                "Только область определения",
              ],
              correctIndex: 1,
              explanation: "По знаку производной мы определяем, где функция возрастает, а где убывает.",
            },
            {
              prompt: "Где обычно меняется число решений в задаче с параметром?",
              options: [
                "В любой случайной точке",
                "В точках касания и других критических конфигурациях",
                "Только при x = 0",
                "Только после подстановки случайных чисел",
              ],
              correctIndex: 1,
              explanation: "Число решений меняется в переломных конфигурациях: касание, граница ОДЗ, нулевой дискриминант.",
            },
            {
              prompt: "Что сильнее всего помогает в стереометрической задаче?",
              options: [
                "Отказ от чертежа",
                "Случайный выбор формулы",
                "Рабочее сечение и понятный плоский треугольник",
                "Подстановка чисел без анализа фигуры",
              ],
              correctIndex: 2,
              explanation: "Сечение превращает объемную задачу в знакомую плоскую геометрию.",
            },
          ],
        }),
      },
    ],
  },
  {
    id: 2,
    title: "ЕГЭ Русский язык",
    description:
      "Системная подготовка к тестовой части и сочинению: аргументация, структура, речевые нормы.",
    category: "Русский язык",
    level: "Intermediate",
    lessonsCount: 28,
    estimatedHours: 36,
  },
  {
    id: 3,
    title: "ОГЭ Физика",
    description:
      "Базовые разделы механики, термодинамики и электричества с практикой решения задач по шаблонам.",
    category: "Физика",
    level: "Beginner",
    lessonsCount: 30,
    estimatedHours: 32,
  },
  {
    id: 4,
    title: "ЕГЭ Обществознание",
    description:
      "Экономика, право и политика в формате экзамена: теоретические блоки, мини-тренажеры и практика эссе.",
    category: "Обществознание",
    level: "Intermediate",
    lessonsCount: 35,
    estimatedHours: 40,
  },
  {
    id: 5,
    title: "IELTS Writing Booster",
    description:
      "Интенсив по writing task 1/2: структура ответов, академическая лексика и работа с критериями проверки.",
    category: "Английский",
    level: "Advanced",
    lessonsCount: 20,
    estimatedHours: 24,
  },
];

const createInitialUsers = (): MockUser[] => [
  {
    id: 1,
    email: "demo@student.ai",
    fullName: "Demo Student",
    isAdmin: true,
    hasGigachatCredentials: false,
    password: "demo123",
  },
];

const createInitialEnrollments = (): Enrollment[] => [
  {
    id: 1,
    userId: 1,
    courseId: 2,
    progressPercent: 45,
    status: "active",
  },
  {
    id: 2,
    userId: 1,
    courseId: 4,
    progressPercent: 100,
    status: "completed",
  },
];

let users: MockUser[] = createInitialUsers();
let enrollments: Enrollment[] = createInitialEnrollments();
let nextUserId = 2;
let nextEnrollmentId = 3;
let nextChatSessionId = 100;

const chatMessagesBySession = new Map<string, ChatMessage[]>();
const sessionByUserCourse = new Map<string, number>();

const sleep = async (ms = NETWORK_DELAY_MS): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const sanitizeToken = (token?: string): string =>
  token?.replace("Bearer ", "").trim() ?? "";

const buildTokenPair = (userId: number): TokenPair => ({
  accessToken: `mock-access-token-${userId}`,
  refreshToken: `mock-refresh-token-${userId}`,
  tokenType: "bearer",
});

const parseUserIdFromToken = (token?: string): number => {
  const clean = sanitizeToken(token);
  const match = clean.match(/mock-access-token-(\d+)/);

  if (!match) {
    throw new Error("Unauthorized");
  }

  return Number(match[1]);
};

const getUserByToken = (token?: string): MockUser => {
  const userId = parseUserIdFromToken(token);
  const user = users.find((item) => item.id === userId);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const updateStatusByProgress = (progressPercent: number): EnrollmentStatus =>
  progressPercent >= 100 ? "completed" : "active";

const buildSessionKey = (userId: number, courseId: number): string =>
  `${userId}:${courseId}`;

const getOrCreateChatSessionId = (userId: number, courseId: number): number => {
  const key = buildSessionKey(userId, courseId);
  const existing = sessionByUserCourse.get(key);

  if (existing) {
    return existing;
  }

  const newSession = nextChatSessionId;
  nextChatSessionId += 1;
  sessionByUserCourse.set(key, newSession);
  chatMessagesBySession.set(String(newSession), []);
  return newSession;
};

const generateAIAnswer = (courseTitle: string, question: string): string => {
  const normalized = question.toLowerCase();

  if (normalized.includes("план") || normalized.includes("распис")) {
    return `Для курса «${courseTitle}» предлагаю план: 1) теория 30 минут, 2) 10 задач на закрепление, 3) мини-разбор ошибок с повтором через 24 часа.`;
  }

  if (normalized.includes("ошиб") || normalized.includes("не понимаю")) {
    return "Давай разложим задачу по шагам: сначала условие, затем формула/правило, потом подстановка и проверка результата. Пришли пример, и я разберу его подробно.";
  }

  if (normalized.includes("повтор") || normalized.includes("закреп")) {
    return "Совет по закреплению: короткие интервалы 25/5, потом мини-тест из 5 вопросов. Ошибки выпиши в список и повтори их вечером.";
  }

  return "Хороший вопрос. Сфокусируйся на ключевом правиле темы, реши 2 базовые задачи и 1 усложненную, после чего сверим логику решения вместе.";
};

export const mockAuthApi = {
  async register(payload: RegisterPayload): Promise<TokenPair> {
    await sleep();

    const exists = users.some(
      (user) => user.email.toLowerCase() === payload.email.toLowerCase(),
    );
    if (exists) {
      throw new Error("Пользователь с таким email уже существует");
    }

    const newUser: MockUser = {
      id: nextUserId,
      email: payload.email,
      fullName: payload.fullName,
      isAdmin: false,
      hasGigachatCredentials: false,
      password: payload.password,
    };

    users.push(newUser);
    nextUserId += 1;
    recordMockPulseActivity({ userId: newUser.id, eventType: "site_visit", value: 1 }, { dedupeWindowMs: mockPulseDedupeWindowMs });

    return buildTokenPair(newUser.id);
  },

  async login(payload: LoginPayload): Promise<TokenPair> {
    await sleep();

    const user = users.find(
      (item) =>
        item.email.toLowerCase() === payload.email.toLowerCase() &&
        item.password === payload.password,
    );

    if (!user) {
      throw new Error("Неверный email или пароль");
    }

    return buildTokenPair(user.id);
  },

  async profile(accessToken?: string): Promise<UserProfile> {
    await sleep(300);
    const user = getUserByToken(accessToken);
    recordMockPulseActivity({ userId: user.id, eventType: "site_visit", value: 1 }, { dedupeWindowMs: mockPulseDedupeWindowMs });
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isAdmin: user.isAdmin,
      hasGigachatCredentials: user.hasGigachatCredentials,
    };
  },
};

export const mockCoursesApi = {
  async list(filters?: CourseFilters): Promise<Course[]> {
    await sleep(400);

    return courses.filter((course) => {
      const byCategory =
        !filters?.category ||
        filters.category === "all" ||
        course.category === filters.category;
      const byLevel =
        !filters?.level ||
        filters.level === "all" ||
        course.level === filters.level;
      const bySearch =
        !filters?.search ||
        course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        course.description.toLowerCase().includes(filters.search.toLowerCase());

      return byCategory && byLevel && bySearch;
    });
  },

  async byId(id: number): Promise<Course> {
    await sleep(320);

    const course = courses.find((item) => item.id === id);

    if (!course) {
      throw new Error("Курс не найден");
    }

    return course;
  },

  categories(): string[] {
    return Array.from(new Set(courses.map((course) => course.category)));
  },

  levels(): string[] {
    return Array.from(new Set(courses.map((course) => course.level)));
  },
};

export const mockEnrollmentsApi = {
  async enroll(courseId: number, accessToken?: string): Promise<Enrollment> {
    await sleep(350);

    const user = getUserByToken(accessToken);

    const existing = enrollments.find(
      (item) => item.userId === user.id && item.courseId === courseId,
    );
    if (existing) {
      return existing;
    }

    const enrollment: Enrollment = {
      id: nextEnrollmentId,
      userId: user.id,
      courseId,
      progressPercent: 5,
      status: "active",
    };

    enrollments = [...enrollments, enrollment];
    nextEnrollmentId += 1;
    recordMockPulseActivity({ userId: user.id, eventType: "course_enroll", courseId, value: 1 });

    return enrollment;
  },

  async my(accessToken?: string): Promise<Enrollment[]> {
    await sleep(350);

    const user = getUserByToken(accessToken);
    return enrollments.filter((item) => item.userId === user.id);
  },

  async updateProgress(
    enrollmentId: number,
    progressPercent: number,
    accessToken?: string,
  ): Promise<Enrollment> {
    await sleep(250);

    const user = getUserByToken(accessToken);
    const enrollment = enrollments.find(
      (item) => item.id === enrollmentId && item.userId === user.id,
    );

    if (!enrollment) {
      throw new Error("Запись на курс не найдена");
    }

    const nextProgress = Math.max(0, Math.min(100, progressPercent));
    const delta = nextProgress - enrollment.progressPercent;
    enrollment.progressPercent = nextProgress;
    enrollment.status = updateStatusByProgress(enrollment.progressPercent);

    if (delta > 0) {
      recordMockPulseActivity({
        userId: user.id,
        eventType: "course_progress",
        courseId: enrollment.courseId,
        value: delta,
      });
    }

    return enrollment;
  },
};

export const mockAIApi = {
  async ask(
    payload: AIAskPayload,
    accessToken?: string,
  ): Promise<AIAskResponse> {
    await sleep(700);

    const user = getUserByToken(accessToken);
    const course = courses.find((item) => item.id === payload.courseId);

    if (!course) {
      throw new Error("Курс не найден");
    }

    const sessionId = getOrCreateChatSessionId(user.id, payload.courseId);
    const messages = chatMessagesBySession.get(String(sessionId)) ?? [];

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: "user",
      content: payload.message,
      createdAt: new Date().toISOString(),
    };

    const answer = generateAIAnswer(course.title, payload.message);
    recordMockPulseActivity({
      userId: user.id,
      eventType: "ai_question",
      courseId: payload.courseId,
      value: 1,
    });

    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      role: "assistant",
      content: answer,
      createdAt: new Date().toISOString(),
    };

    chatMessagesBySession.set(String(sessionId), [
      ...messages,
      userMessage,
      assistantMessage,
    ]);

    return {
      sessionId,
      answer,
    };
  },

  async history(
    courseId: number,
    accessToken?: string,
  ): Promise<AIHistoryResponse> {
    await sleep(350);

    const user = getUserByToken(accessToken);
    const sessionId = getOrCreateChatSessionId(user.id, courseId);
    const messages = chatMessagesBySession.get(String(sessionId)) ?? [];

    return {
      sessionId,
      messages,
    };
  },
};

export const mockPulseApi = {
  async overview(accessToken?: string): Promise<LearningPulse> {
    await sleep(220);

    const user = getUserByToken(accessToken);
    return getMockLearningPulse({
      userId: user.id,
      courses,
      enrollments: enrollments.filter((item) => item.userId === user.id),
    });
  },
};

export const resetMockApiState = (): void => {
  users = createInitialUsers();
  enrollments = createInitialEnrollments();
  nextUserId = 2;
  nextEnrollmentId = 3;
  nextChatSessionId = 100;
  chatMessagesBySession.clear();
  sessionByUserCourse.clear();
  resetMockPulseState();
};
