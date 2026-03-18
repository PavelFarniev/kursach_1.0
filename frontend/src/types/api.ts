import type {
  ChatMessage,
  Course,
  Enrollment,
  EnrollmentWithCourse,
  UserProfile,
} from "@/types/domain";

export interface RegisterPayload {
  email: string;
  fullName: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: "bearer";
}

export interface CourseFilters {
  search?: string;
  category?: string;
  level?: string;
}

export interface EnrollPayload {
  courseId: number;
}

export interface ProgressPayload {
  progressPercent: number;
}

export interface AIAskPayload {
  courseId: number;
  message: string;
}

export interface AIAskResponse {
  sessionId: number;
  answer: string;
}

export interface AIHistoryResponse {
  sessionId: number;
  messages: ChatMessage[];
}

export interface AuthApi {
  register(payload: RegisterPayload): Promise<TokenPair>;
  login(payload: LoginPayload): Promise<TokenPair>;
  getProfile(): Promise<UserProfile>;
}

export interface CoursesApi {
  list(filters?: CourseFilters): Promise<Course[]>;
  getById(id: number): Promise<Course>;
}

export interface EnrollmentsApi {
  enroll(payload: EnrollPayload): Promise<Enrollment>;
  my(): Promise<EnrollmentWithCourse[]>;
  patchProgress(enrollmentId: number, payload: ProgressPayload): Promise<EnrollmentWithCourse>;
}

export interface AIApi {
  ask(payload: AIAskPayload): Promise<AIAskResponse>;
  history(courseId: number): Promise<AIHistoryResponse>;
}
