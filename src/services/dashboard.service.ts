import { env } from "@/config";
import { mockAdminStats } from "@/data/mock/admin-dashboard.mock";
import type { AdminDashboardStats } from "@/types/admin-dashboard.types";
import { sleep } from "@/utils";
import { apiClient } from "./api-client";

function normalizeStats(raw: AdminDashboardStats): AdminDashboardStats {
  return {
    totalUsers: Number(raw.totalUsers) || 0,
    totalStudents: Number(raw.totalStudents) || 0,
    totalTeachers: Number(raw.totalTeachers) || 0,
    totalCourses: Number(raw.totalCourses) || 0,
    totalEnrollments: Number(raw.totalEnrollments) || 0,
    totalRevenue: Number(raw.totalRevenue) || 0,
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
};
