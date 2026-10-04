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
  expiresAt?: string | null;
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
  receiptId?: string;
  fileUrl?: string | null;
  fileUrls?: string[];
  answerText?: string | null;
  grade?: number | null;
  feedback?: string | null;
  status?: string;
  statusLabel?: string;
  canResubmit?: boolean;
  resultsReleased?: boolean;
  assignmentId: string;
  studentId?: string;
  submittedAt: string;
  updatedAt?: string;
  gradedAt?: string | null;
  gradedBy?: { id: string; name: string } | null;
  assignment?: {
    id: string;
    title: string;
    type: AssignmentType | string;
    courseId?: string | null;
    description?: string;
    dueDate?: string | null;
    availableFrom?: string | null;
    availableUntil?: string | null;
    status?: string;
    instructions?: string | null;
    totalMarks?: number | null;
    resultReleaseMode?: string;
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
  maxAttempts?: number | null;
  passingScore?: number | null;
  totalMarks?: number | null;
  resultReleaseMode?: string;
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
  provider?: string | null;
  fulfilledAt?: string | null;
  paidAt?: string | null;
  courseId?: string | null;
  accessProductId?: string | null;
  programId?: string | null;
  /** When the access bought by this payment ends (null = lifetime or not fulfilled yet). */
  accessExpiresAt?: string | null;
  checkoutUrl?: string | null;
  createdAt: string;
  course?: { id: string; title: string; thumbnail?: string | null; slug?: string };
  accessProduct?: { id: string; title: string; slug: string; durationDays?: number | null };
  program?: PaymentProgram | null;
  subtopicId?: string | null;
  subtopic?: PaymentStudySet | null;
}

/** Questionbank study set bought on its own. */
export interface PaymentStudySet {
  id: string;
  title: string;
  slug: string;
  topic?: { id: string; title: string; program?: { id: string; slug: string } | null } | null;
}

export interface PaymentProgram {
  id: string;
  name: string;
  slug: string;
  subject?: { id: string; name: string } | null;
}

export type ProgramAccessSource = "GOLD_PASS" | "ADMIN_GRANT" | "COURSE";

/** One unlock the student holds (study set, admin grant, linked course, or a legacy Gold Pass). */
export interface StudentAccessGrant {
  id: string;
  source: "PRACTICE_PASS" | "ADMIN_GRANT" | "COURSE" | "STUDY_SET" | string;
  accessTier?: string | null;
  program: PaymentProgram | null;
  product: { id: string; title: string; durationDays?: number | null } | null;
  course?: { id: string; title: string; slug: string } | null;
  /** Set for single study set unlocks (source STUDY_SET). */
  subtopic?: { id: string; title: string; slug: string; programSlug: string } | null;
  purchasedAt: string;
  expiresAt: string | null;
  isActive: boolean;
}

/** The student's current access to one subject. */
export interface ProgramAccessInfo {
  program?: { id: string; name: string; slug: string };
  tier: string;
  source: ProgramAccessSource | null;
  purchasedAt: string | null;
  expiresAt: string | null;
}

export interface AccessProduct {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  price: number | string;
  regularPrice?: number | string | null;
  durationDays?: number | null;
  isActive?: boolean;
  tier?: "SILVER" | "GOLD" | "DIAMOND" | string;
  programId?: string | null;
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
