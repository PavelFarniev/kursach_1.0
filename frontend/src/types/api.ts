import type {
  AdminCourse,
  AdminCourseSlide,
  AdminUser,
  ChatMessage,
  CourseNote,
  Course,
  EnrollmentWithCourse,
  LearningPulse,
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

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: "bearer";
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
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

export interface CreateNotePayload {
  courseId: number;
  content: string;
}

export interface AdminUsersFilters {
  search?: string;
}

export interface AdminCoursesFilters {
  search?: string;
}

export interface UpdateAdminUserPayload {
  email?: string;
  fullName?: string;
  isActive?: boolean;
  isAdmin?: boolean;
}

export interface AdminCourseWritePayload {
  title: string;
  description: string;
  category: string;
  level: string;
  lessonsCount: number;
  estimatedHours: number;
  slides: AdminCourseSlide[];
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
  refresh(payload: RefreshTokenPayload): Promise<TokenPair>;
  profile(): Promise<UserProfile>;
  changePassword(payload: ChangePasswordPayload): Promise<TokenPair>;
}

export interface CoursesApi {
  list(filters?: CourseFilters): Promise<Course[]>;
  getById(id: number): Promise<Course>;
}

export interface EnrollmentsApi {
  enroll(payload: EnrollPayload): Promise<EnrollmentWithCourse>;
  my(): Promise<EnrollmentWithCourse[]>;
  patchProgress(enrollmentId: number, payload: ProgressPayload): Promise<EnrollmentWithCourse>;
}

export interface AIApi {
  ask(payload: AIAskPayload): Promise<AIAskResponse>;
  history(courseId: number): Promise<AIHistoryResponse>;
}

export interface NotesApi {
  my(): Promise<CourseNote[]>;
  create(payload: CreateNotePayload): Promise<CourseNote>;
  remove(noteId: number): Promise<void>;
}

export interface PulseApi {
  overview(): Promise<LearningPulse>;
}

export interface AdminApi {
  listUsers(filters?: AdminUsersFilters): Promise<AdminUser[]>;
  updateUser(userId: number, payload: UpdateAdminUserPayload): Promise<AdminUser>;
  deleteUser(userId: number): Promise<void>;
  listCourses(filters?: AdminCoursesFilters): Promise<AdminCourse[]>;
  createCourse(payload: AdminCourseWritePayload): Promise<AdminCourse>;
  updateCourse(courseId: number, payload: AdminCourseWritePayload): Promise<AdminCourse>;
  deleteCourse(courseId: number): Promise<void>;
}
