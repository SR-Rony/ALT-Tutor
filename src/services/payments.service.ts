import type {
  CheckoutResult,
  ProgramAccessInfo,
  StudentAccessGrant,
  StudentPayment,
} from "@/types/student-dashboard.types";
import type { GrantStudySetAccessInput, StudySetAccessRow } from "@/types/qb.types";
import { apiClient } from "./api-client";

export type CheckoutInput =
  | { courseId: string; subtopicId?: never }
  /** Buy one questionbank study set (unlocks only that set). */
  | { subtopicId: string; courseId?: never };

export const paymentsService = {
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
