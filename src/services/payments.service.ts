import type { AccessProduct, CheckoutResult, StudentPayment } from "@/types/student-dashboard.types";
import { apiClient } from "./api-client";

export type CheckoutInput = { courseId?: string; accessProductId?: string };

export type AccessProductInput = {
  title: string;
  slug: string;
  description?: string;
  price?: number;
  regularPrice?: number;
  programId?: string | null;
  durationDays?: number | null;
  tier?: "SILVER" | "GOLD" | "DIAMOND";
  isActive?: boolean;
};

export const paymentsService = {
  listProducts(): Promise<AccessProduct[]> {
    return apiClient
      .get<AccessProduct[]>("/payments/products", { skipAuth: true })
      .then((r) => r.data ?? []);
  },

  adminListProducts(): Promise<AccessProduct[]> {
    return apiClient.get<AccessProduct[]>("/payments/products/admin").then((r) => r.data ?? []);
  },

  createProduct(payload: AccessProductInput): Promise<AccessProduct> {
    return apiClient.post<AccessProduct>("/payments/products", payload).then((r) => r.data);
  },

  updateProduct(id: string, payload: Partial<AccessProductInput>): Promise<AccessProduct> {
    return apiClient
      .patch<AccessProduct>(`/payments/products/${id}`, payload)
      .then((r) => r.data);
  },

  deactivateProduct(id: string): Promise<AccessProduct> {
    return apiClient.delete<AccessProduct>(`/payments/products/${id}`).then((r) => r.data);
  },

  checkout(payload: CheckoutInput): Promise<CheckoutResult> {
    return apiClient.post<CheckoutResult>("/payments/checkout", payload).then((r) => r.data);
  },

  confirmStub(
    transactionId: string,
    status: "SUCCESS" | "FAILED" | "CANCELLED"
  ): Promise<StudentPayment> {
    return apiClient
      .post<StudentPayment>("/payments/checkout/confirm-stub", { transactionId, status })
      .then((r) => r.data);
  },

  getByTransaction(transactionId: string): Promise<StudentPayment> {
    return apiClient
      .get<StudentPayment>(`/payments/by-transaction/${encodeURIComponent(transactionId)}`)
      .then((r) => r.data);
  },
};
