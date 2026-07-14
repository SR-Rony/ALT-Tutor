export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type AssignmentType = "FILE" | "MCQ";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

export interface StudentCourseSummary {
  id: string;
  title: string;
  slug: string;
  thumbnail?: string | null;
  price?: number | string;
  level?: string;
  teacher?: { id: string; name: string };
  category?: { id: string; name: string; slug: string };
  _count?: { chapters?: number; assignments?: number };
}

export interface StudentEnrollment {
  id: string;
  progress: number;
  status: EnrollmentStatus | string;
  enrolledAt?: string;
  studentId?: string;
  courseId: string;
  course: StudentCourseSummary;
}

export interface StudentNotification {
  id: string;
  message: string;
  isRead: boolean;
  userId?: string;
  createdAt: string;
}

export interface StudentSubmission {
  id: string;
  fileUrl: string;
  grade?: number | null;
  feedback?: string | null;
  assignmentId: string;
  studentId?: string;
  submittedAt: string;
  updatedAt?: string;
  assignment?: {
    id: string;
    title: string;
    type: AssignmentType | string;
    courseId: string;
    description?: string;
    dueDate?: string | null;
  };
}

export interface StudentAssignment {
  id: string;
  title: string;
  description: string;
  type: AssignmentType | string;
  dueDate?: string | null;
  durationMinutes?: number | null;
  courseId: string;
  createdAt?: string;
  _count?: { questions?: number; mcqAttempts?: number; submissions?: number };
}

export interface StudentPayment {
  id: string;
  amount: number | string;
  status: PaymentStatus | string;
  transactionId?: string | null;
  courseId: string;
  createdAt: string;
  course?: { id: string; title: string; thumbnail?: string | null };
}

export interface StudentDashboardStats {
  totalEnrolled: number;
  activeCourses: number;
  completedCourses: number;
  averageProgress: number;
  unreadNotifications: number;
  totalAssignments: number;
  totalSubmissions: number;
  totalSpent: number;
  enrollments: StudentEnrollment[];
  recentNotifications: StudentNotification[];
  recentSubmissions: StudentSubmission[];
}

export interface StudentProfile {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  role: string;
  avatar?: string | null;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
}
