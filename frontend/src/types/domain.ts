export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";
export type EnrollmentStatus = "active" | "completed";
export type ChatRole = "user" | "assistant";

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
  lessonsCount: number;
  estimatedHours: number;
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

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}
