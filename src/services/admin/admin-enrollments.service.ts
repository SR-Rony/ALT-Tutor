import { env } from "@/config";
import type {
  AdminEnrollment,
  AdminEnrollmentsResponse,
  EnrollmentStatus,
} from "@/types/admin-dashboard.types";
import { sleep } from "@/utils";
import { apiClient } from "../api-client";

export type AdminEnrollmentsQuery = {
  status?: EnrollmentStatus;
  search?: string;
  courseId?: string;
  page?: number;
  limit?: number;
};

const emptyCounts = { all: 0, active: 0, completed: 0, cancelled: 0 };

export const adminEnrollmentsService = {
  async list(query: AdminEnrollmentsQuery = {}): Promise<AdminEnrollmentsResponse> {
    if (env.useMockApi) {
      await sleep(250);
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 1,
        counts: emptyCounts,
      };
    }

    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.search?.trim()) params.set("search", query.search.trim());
    if (query.courseId) params.set("courseId", query.courseId);
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));

    const qs = params.toString();
    const response = await apiClient.get<AdminEnrollmentsResponse>(
      `/enrollments/admin${qs ? `?${qs}` : ""}`
    );
    return (
      response.data ?? {
        items: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 1,
        counts: emptyCounts,
      }
    );
  },

  async cancel(id: string): Promise<AdminEnrollment> {
    const response = await apiClient.patch<AdminEnrollment>(`/enrollments/admin/${id}/cancel`);
    return response.data;
  },
};
