import { env } from "@/config";
import { mockAdminStats } from "@/data/mock/admin-dashboard.mock";
import type {
  AdminDashboardStats,
  AdminLearningAnalytics,
} from "@/types/admin-dashboard.types";
import { sleep } from "@/utils";
import { apiClient } from "./api-client";

export interface TeacherDashboardStats {
  totalCourses: number;
  totalStudents: number;
  courses: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    _count: { enrollments: number; reviews: number };
  }>;
}

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
  totalStudents: 3,
  courses: [
    {
      id: "c1",
      title: "Complete Node.js Bootcamp",
      slug: "complete-nodejs-bootcamp",
      status: "PUBLISHED",
      _count: { enrollments: 2, reviews: 1 },
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
