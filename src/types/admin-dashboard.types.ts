export interface AdminDashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
}

export type BackendRole = "ADMIN" | "TEACHER" | "STUDENT";

export interface AdminUser {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  role: BackendRole | string;
  avatar?: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string | null;
  price: number | string;
  level: CourseLevel | string;
  status: CourseStatus | string;
  teacherId: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  teacher: { id: string; name: string };
  category: { id: string; name: string; slug: string };
  _count: { enrollments: number };
}

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

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
