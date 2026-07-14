import type {
  AdminCourse,
  AdminDashboardStats,
  AdminPayment,
  AdminUser,
} from "@/types/admin-dashboard.types";

export const mockAdminStats: AdminDashboardStats = {
  totalUsers: 5,
  totalStudents: 2,
  totalTeachers: 2,
  totalCourses: 3,
  totalEnrollments: 3,
  totalRevenue: 49.99,
};

export const mockAdminUsers: AdminUser[] = [
  {
    id: "u-admin",
    name: "Site Admin",
    email: "admin@lms.com",
    phone: "01700000001",
    role: "ADMIN",
    isVerified: true,
    isActive: true,
    createdAt: "2026-07-01T10:00:00.000Z",
  },
  {
    id: "u-teacher",
    name: "John Teacher",
    email: "teacher@lms.com",
    phone: "01700000002",
    role: "TEACHER",
    isVerified: true,
    isActive: true,
    createdAt: "2026-07-02T10:00:00.000Z",
  },
  {
    id: "u-student",
    name: "Jane Student",
    email: "student@lms.com",
    phone: "01700000003",
    role: "STUDENT",
    isVerified: true,
    isActive: true,
    createdAt: "2026-07-03T10:00:00.000Z",
  },
];

export const mockAdminCourses: AdminCourse[] = [
  {
    id: "c-node",
    title: "Complete Node.js Bootcamp",
    slug: "complete-nodejs-bootcamp",
    description: "Learn Node.js, Express, and NestJS from scratch.",
    thumbnail: null,
    price: 0,
    level: "BEGINNER",
    status: "PUBLISHED",
    teacherId: "u-teacher",
    categoryId: "cat-web",
    createdAt: "2026-07-04T10:00:00.000Z",
    updatedAt: "2026-07-04T10:00:00.000Z",
    teacher: { id: "u-teacher", name: "John Teacher" },
    category: { id: "cat-web", name: "Web Development", slug: "web-development" },
    _count: { enrollments: 2 },
  },
  {
    id: "c-react",
    title: "React Fundamentals",
    slug: "react-fundamentals",
    description: "Build modern UIs with React.",
    thumbnail: null,
    price: 49.99,
    level: "INTERMEDIATE",
    status: "PUBLISHED",
    teacherId: "u-teacher",
    categoryId: "cat-web",
    createdAt: "2026-07-05T10:00:00.000Z",
    updatedAt: "2026-07-05T10:00:00.000Z",
    teacher: { id: "u-teacher", name: "John Teacher" },
    category: { id: "cat-web", name: "Web Development", slug: "web-development" },
    _count: { enrollments: 1 },
  },
];

export const mockAdminPayments: AdminPayment[] = [
  {
    id: "p-1",
    amount: 49.99,
    status: "SUCCESS",
    transactionId: "demo-txn-react-001",
    studentId: "u-student",
    courseId: "c-react",
    createdAt: "2026-07-06T10:00:00.000Z",
    student: { id: "u-student", name: "Jane Student" },
    course: { id: "c-react", title: "React Fundamentals" },
  },
];
