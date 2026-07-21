import { env } from "@/config";
import { apiClient } from "./api-client";
import { sleep } from "@/utils";

export type CreateReviewInput = {
  courseId: string;
  rating: number;
  comment?: string;
};

export const reviewService = {
  async create(payload: CreateReviewInput) {
    if (env.useMockApi) {
      await sleep(200);
      return { id: `mock-review-${Date.now()}`, ...payload, status: "PENDING" };
    }
    const response = await apiClient.post("/reviews", payload);
    return response.data;
  },
};
