export interface AdminDashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  assessmentAnalytics?: AdminLearningAnalytics;
}

export interface AdminWeakTopic {
  subtopicId: string;
  title: string;
  topicTitle: string;
  correct: number;
  total: number;
  accuracy: number;
}

export interface AdminLearningAnalytics {
  submittedPracticeSessions: number;
  averagePracticeScore: number;
  ungradedWrittenSubmissions: number;
  averageMcqScore: number;
  averageMcqAccuracy?: number;
  mcqPassRate?: number;
  finishedMcqAttempts?: number;
  averageGradingTurnaroundHours?: number | null;
  weakTopics?: AdminWeakTopic[];
  filters?: { courseId?: string | null; programId?: string | null };
}

export type BackendRole = "ADMIN" | "TEACHER" | "STUDENT";

export interface AdminUser {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  role: BackendRole | string;
  avatar?: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  _count?: { coursesTaught?: number };
}

export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type PublishCheck = { id: string; label: string; ok: boolean };
export type PublishReadiness = { ready: boolean; checks: PublishCheck[] };

export interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  summary?: string | null;
  thumbnail?: string | null;
  thumbnailPublicId?: string | null;
  regularPrice?: number | string | null;
  promoVideoUrl?: string | null;
  promoVideoPublicId?: string | null;
  price: number | string;
  level: CourseLevel | string;
  status: CourseStatus | string;
  language?: string;
  outcomes?: string[];
  requirements?: string[];
  targetAudience?: string | null;
  hasCertificate?: boolean;
  lifetimeAccess?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  teacherId: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  teacher: { id: string; name: string; avatar?: string | null; phone?: string | null };
  category: { id: string; name: string; slug: string };
  chapters?: import("./curriculum.types").CurriculumChapter[];
  readiness?: PublishReadiness;
  _count: { enrollments: number; chapters?: number; reviews?: number };
}

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface AdminEnrollmentStudent {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  avatar?: string | null;
}

export interface AdminEnrollmentCourse {
  id: string;
  title: string;
  slug: string;
  price: number | string;
  thumbnail?: string | null;
  teacher: { id: string; name: string };
}

export interface AdminEnrollment {
  id: string;
  progress: number;
  status: EnrollmentStatus | string;
  enrolledAt: string;
  studentId: string;
  courseId: string;
  student: AdminEnrollmentStudent;
  course: AdminEnrollmentCourse;
}

export interface AdminEnrollmentCounts {
  all: number;
  active: number;
  completed: number;
  cancelled: number;
}

export interface AdminEnrollmentsResponse {
  items: AdminEnrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  counts: AdminEnrollmentCounts;
}

export interface AdminPayment {
  id: string;
  amount: number | string;
  status: PaymentStatus | string;
  transactionId?: string | null;
  studentId: string;
  courseId: string;
  createdAt: string;
  student: { id: string; name: string };
  course: { id: string; title: string };
}
