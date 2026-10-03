import type {
  AccessProduct,
  CheckoutResult,
  ProgramAccessInfo,
  StudentAccessGrant,
  StudentPayment,
} from "@/types/student-dashboard.types";
import type { GrantStudySetAccessInput, StudySetAccessRow } from "@/types/qb.types";
import { apiClient } from "./api-client";

export type CheckoutInput = {
  courseId?: string;
  accessProductId?: string;
  programId?: string;
  /** Buy one questionbank study set (unlocks only that set). */
  subtopicId?: string;
};

export type AccessProductInput = {
  title: string;
  slug: string;
  description?: string;
  price?: number;
  regularPrice?: number;
  programId?: string | null;
  durationDays?: number | null;
  tier?: "GOLD";
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

  adminGrantPracticeAccess(payload: {
    studentId: string;
    programId?: string | null;
    accessTier: "GOLD";
    durationDays?: number | null;
  }) {
    return apiClient.post("/payments/admin/grant-access", payload).then((r) => r.data);
  },

  adminListStudySetAccess(subtopicId: string): Promise<StudySetAccessRow[]> {
    return apiClient
      .get<StudySetAccessRow[]>(`/payments/admin/study-sets/${subtopicId}/access`)
      .then((r) => r.data ?? []);
  },

  adminGrantStudySetAccess(subtopicId: string, payload: GrantStudySetAccessInput) {
    return apiClient
      .post(`/payments/admin/study-sets/${subtopicId}/access`, payload)
      .then((r) => r.data);
  },

  adminRevokeStudySetAccess(accessId: string) {
    return apiClient.delete(`/payments/admin/study-set-access/${accessId}`).then((r) => r.data);
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

  myAccess(): Promise<StudentAccessGrant[]> {
    return apiClient
      .get<StudentAccessGrant[]>("/payments/access/mine")
      .then((r) => r.data ?? []);
  },

  myProgramAccess(programSlug: string): Promise<ProgramAccessInfo> {
    return apiClient
      .get<ProgramAccessInfo>(`/payments/access/program/${encodeURIComponent(programSlug)}`)
      .then((r) => r.data);
  },

  getByTransaction(transactionId: string): Promise<StudentPayment> {
    return apiClient
      .get<StudentPayment>(`/payments/by-transaction/${encodeURIComponent(transactionId)}`)
      .then((r) => r.data);
  },
};
