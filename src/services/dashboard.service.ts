import { env } from "@/config";
import { mockAdminStats } from "@/data/mock/admin-dashboard.mock";
import type {
  AdminDashboardStats,
  AdminLearningAnalytics,
} from "@/types/admin-dashboard.types";
import type { TeacherDashboardStats } from "@/types/teacher-dashboard.types";
import { sleep } from "@/utils";
import { apiClient } from "./api-client";

export type { TeacherDashboardStats } from "@/types/teacher-dashboard.types";

export interface StudentDashboardStats {
  totalEnrolled: number;
  completedCourses: number;
  enrollments: Array<{
    id: string;
    progress: number;
    status: string;
    course: { id: string; title: string; thumbnail?: string | null };
  }>;
}

const mockTeacherStats: TeacherDashboardStats = {
  totalCourses: 2,
  publishedCourses: 1,
  totalStudents: 3,
  totalEnrollments: 4,
  pendingGrading: 2,
  totalAssessments: 5,
  courses: [
    {
      id: "c1",
      title: "Complete Node.js Bootcamp",
      slug: "complete-nodejs-bootcamp",
      status: "PUBLISHED",
      ownership: "owned",
      category: { id: "cat1", name: "Programming" },
      _count: { enrollments: 2, reviews: 1, assignments: 3, chapters: 4 },
    },
    {
      id: "c2",
      title: "Python for Beginners",
      slug: "python-for-beginners",
      status: "DRAFT",
      ownership: "owned",
      category: { id: "cat1", name: "Programming" },
      _count: { enrollments: 1, reviews: 0, assignments: 2, chapters: 2 },
    },
  ],
  pendingSubmissions: [
    {
      id: "s1",
      submittedAt: new Date().toISOString(),
      student: { id: "st1", name: "Jane Student" },
      assignment: {
        id: "a1",
        title: "Week 1 Written Task",
        type: "WRITTEN",
        course: { id: "c1", title: "Complete Node.js Bootcamp" },
      },
    },
  ],
};

const mockStudentStats: StudentDashboardStats = {
  totalEnrolled: 2,
  completedCourses: 0,
  enrollments: [
    {
      id: "e1",
      progress: 25,
      status: "ACTIVE",
      course: { id: "c1", title: "Complete Node.js Bootcamp", thumbnail: null },
    },
  ],
};

function normalizeStats(
  raw: AdminDashboardStats & { assessmentAnalytics?: AdminLearningAnalytics }
): AdminDashboardStats {
  return {
    totalUsers: Number(raw.totalUsers) || 0,
    totalStudents: Number(raw.totalStudents) || 0,
    totalTeachers: Number(raw.totalTeachers) || 0,
    totalCourses: Number(raw.totalCourses) || 0,
    totalEnrollments: Number(raw.totalEnrollments) || 0,
    totalRevenue: Number(raw.totalRevenue) || 0,
    assessmentAnalytics: raw.assessmentAnalytics,
  };
}

export const dashboardService = {
  async getAdminStats(): Promise<AdminDashboardStats> {
    if (env.useMockApi) {
      await sleep(250);
      return mockAdminStats;
    }

    const response = await apiClient.get<AdminDashboardStats>("/dashboard/admin");
    return normalizeStats(response.data);
  },

  async getAdminAnalytics(filters?: {
    courseId?: string;
    programId?: string;
  }): Promise<AdminLearningAnalytics> {
    const params = new URLSearchParams();
    if (filters?.courseId) params.set("courseId", filters.courseId);
    if (filters?.programId) params.set("programId", filters.programId);
    const q = params.toString() ? `?${params.toString()}` : "";
    const response = await apiClient.get<AdminLearningAnalytics>(
      `/dashboard/admin/analytics${q}`
    );
    return response.data;
  },

  async getTeacherStats(): Promise<TeacherDashboardStats> {
    if (env.useMockApi) {
      await sleep(250);
      return mockTeacherStats;
    }

    const response = await apiClient.get<TeacherDashboardStats>("/dashboard/teacher");
    return response.data;
  },

  async getStudentStats(): Promise<StudentDashboardStats> {
    if (env.useMockApi) {
      await sleep(250);
      return mockStudentStats;
    }

    const response = await apiClient.get<StudentDashboardStats>("/dashboard/student");
    return response.data;
  },
};
