import type { AccessProduct, CheckoutResult } from "@/types/student-dashboard.types";
import { apiClient } from "./api-client";

export type CheckoutInput = { courseId?: string; accessProductId?: string };

export const paymentsService = {
  listProducts(): Promise<AccessProduct[]> {
    return apiClient
      .get<AccessProduct[]>("/payments/products", { skipAuth: true })
      .then((r) => r.data ?? []);
  },

  checkout(payload: CheckoutInput): Promise<CheckoutResult> {
    return apiClient.post<CheckoutResult>("/payments/checkout", payload).then((r) => r.data);
  },
};
