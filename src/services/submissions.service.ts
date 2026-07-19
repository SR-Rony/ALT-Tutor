import type { UngradedSubmission, StudentSubmission } from "@/types/student-dashboard.types";
import { apiClient } from "./api-client";

export type SubmitAssignmentInput = {
  assignmentId: string;
  answerText?: string;
  fileUrl?: string;
  fileUrls?: string[];
};

export const submissionsService = {
  submit(payload: SubmitAssignmentInput): Promise<StudentSubmission> {
    return apiClient.post<StudentSubmission>("/submissions", payload).then((r) => r.data);
  },

  listUngraded(): Promise<UngradedSubmission[]> {
    return apiClient.get<UngradedSubmission[]>("/submissions/ungraded").then((r) => r.data ?? []);
  },

  grade(
    id: string,
    payload: { grade: number; feedback?: string; publish?: boolean }
  ): Promise<StudentSubmission> {
    return apiClient.patch<StudentSubmission>(`/submissions/${id}/grade`, payload).then((r) => r.data);
  },

  getById(id: string): Promise<StudentSubmission> {
    return apiClient.get<StudentSubmission>(`/submissions/${id}`).then((r) => r.data);
  },
};
