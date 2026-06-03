export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";
export type EnrollmentStatus = "active" | "completed";
export type ChatRole = "user" | "assistant";

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  isAdmin: boolean;
  hasGigachatCredentials: boolean;
}

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCourseSlide {
  id?: number;
  orderIndex: number;
  title: string;
  summary: string;
  theoryBlocks: string[];
  bullets: string[];
  example: string;
  practiceTask: string;
}

export interface AdminCourse {
  id: number;
  title: string;
  description: string;
  category: string;
  level: string;
  lessonsCount: number;
  estimatedHours: number;
  slides: AdminCourseSlide[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseSlide {
  id: string;
  title: string;
  summary: string;
  theoryBlocks: string[];
  bullets: string[];
  example: string;
  practiceTask: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
  lessonsCount: number;
  estimatedHours: number;
  slides?: CourseSlide[];
}

export interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  progressPercent: number;
  status: EnrollmentStatus;
}

export interface EnrollmentWithCourse extends Enrollment {
  course: Course;
}

export interface CourseNote {
  id: number;
  courseId: number;
  content: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface PulseSnapshot {
  label: string;
  readiness: number;
  activityCount: number;
  siteVisits: number;
  streakDays: number;
  weakestTopic: string;
  chart: number[];
  plan: string[];
}

export interface LearningPulse {
  today: PulseSnapshot;
  week: PulseSnapshot;
  sprint: PulseSnapshot;
}
