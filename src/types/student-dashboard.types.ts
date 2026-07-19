export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type AssignmentType = "FILE" | "MCQ" | "WRITTEN";
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
  fileUrl?: string | null;
  fileUrls?: string[];
  answerText?: string | null;
  grade?: number | null;
  feedback?: string | null;
  status?: string;
  assignmentId: string;
  studentId?: string;
  submittedAt: string;
  updatedAt?: string;
  assignment?: {
    id: string;
    title: string;
    type: AssignmentType | string;
    courseId?: string | null;
    description?: string;
    dueDate?: string | null;
    instructions?: string | null;
    totalMarks?: number | null;
    course?: { id: string; title: string; slug: string };
    program?: { id: string; name: string; slug: string };
  };
}

export interface StudentAssignment {
  id: string;
  title: string;
  description: string;
  instructions?: string | null;
  type: AssignmentType | string;
  status?: string;
  dueDate?: string | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
  durationMinutes?: number | null;
  totalMarks?: number | null;
  courseId?: string | null;
  programId?: string | null;
  createdAt?: string;
  course?: { id: string; title: string; slug: string };
  program?: { id: string; name: string; slug: string };
  _count?: { questions?: number; mcqAttempts?: number; submissions?: number };
}

export interface StudentPayment {
  id: string;
  amount: number | string;
  status: PaymentStatus | string;
  transactionId?: string | null;
  courseId?: string | null;
  accessProductId?: string | null;
  createdAt: string;
  course?: { id: string; title: string; thumbnail?: string | null };
  accessProduct?: { id: string; title: string; slug: string };
}

export interface AccessProduct {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  price: number | string;
  regularPrice?: number | string | null;
  durationDays?: number | null;
  program?: { id: string; name: string; slug: string } | null;
}

export interface CheckoutResult {
  payment: StudentPayment | null;
  checkoutUrl: string | null;
  granted?: boolean;
}

export interface UngradedSubmission extends StudentSubmission {
  student?: { id: string; name: string; avatar?: string | null };
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
