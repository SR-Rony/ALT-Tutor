import { env } from "@/config";
import type {
  AdminReview,
  AdminReviewsQuery,
  AdminReviewsResponse,
  ReviewStatus,
  UpdateAdminReviewInput,
} from "@/types/admin-dashboard.types";
import { sleep } from "@/utils";
import { apiClient } from "../api-client";

const emptyCounts = { all: 0, pending: 0, approved: 0, hidden: 0 };

export const adminReviewsService = {
  async list(query: AdminReviewsQuery = {}): Promise<AdminReviewsResponse> {
    if (env.useMockApi) {
      await sleep(250);
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
        counts: emptyCounts,
      };
    }

    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.rating) params.set("rating", String(query.rating));
    if (query.courseId) params.set("courseId", query.courseId);
    if (query.search?.trim()) params.set("search", query.search.trim());
    if (query.page) params.set("page", String(query.page));
    if (query.limit) params.set("limit", String(query.limit));

    const qs = params.toString();
    const response = await apiClient.get<AdminReviewsResponse>(
      `/reviews/admin${qs ? `?${qs}` : ""}`
    );
    return (
      response.data ?? {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
        counts: emptyCounts,
      }
    );
  },

  async update(id: string, payload: UpdateAdminReviewInput): Promise<AdminReview> {
    if (env.useMockApi) {
      await sleep(200);
      throw { message: "Mock API cannot update reviews" };
    }
    const response = await apiClient.patch<AdminReview>(`/reviews/admin/${id}`, payload);
    return response.data;
  },

  async setStatus(id: string, status: ReviewStatus): Promise<AdminReview> {
    return this.update(id, { status });
  },

  async remove(id: string): Promise<void> {
    if (env.useMockApi) {
      await sleep(200);
      return;
    }
    await apiClient.delete(`/reviews/admin/${id}`);
  },
};
