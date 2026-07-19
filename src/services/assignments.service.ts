import type { StudentAssignment } from "@/types/student-dashboard.types";
import { apiClient } from "./api-client";

export type CreateAssignmentInput = {
  title: string;
  description: string;
  instructions?: string;
  type?: "FILE" | "WRITTEN" | "MCQ";
  status?: "DRAFT" | "PUBLISHED" | "CLOSED";
  courseId?: string;
  programId?: string;
  dueDate?: string;
  availableFrom?: string;
  availableUntil?: string;
  totalMarks?: number;
  resultReleaseMode?: "IMMEDIATE" | "AFTER_CLOSE" | "MANUAL";
  reviewAnswersAfter?: boolean;
  resultsReleased?: boolean;
};

export type UpdateAssignmentInput = Partial<
  Omit<CreateAssignmentInput, "courseId" | "programId" | "type">
> & {
  status?: "DRAFT" | "PUBLISHED" | "CLOSED";
};

export const assignmentsService = {
  listMine(): Promise<StudentAssignment[]> {
    return apiClient.get<StudentAssignment[]>("/assignments/mine").then((r) => r.data ?? []);
  },

  findByCourse(courseId: string): Promise<StudentAssignment[]> {
    return apiClient
      .get<StudentAssignment[]>(`/assignments?courseId=${encodeURIComponent(courseId)}`)
      .then((r) => r.data ?? []);
  },

  findByProgram(programId: string): Promise<StudentAssignment[]> {
    return apiClient
      .get<StudentAssignment[]>(`/assignments?programId=${encodeURIComponent(programId)}`)
      .then((r) => r.data ?? []);
  },

  getById(id: string): Promise<StudentAssignment> {
    return apiClient.get<StudentAssignment>(`/assignments/${id}`).then((r) => r.data);
  },

  create(payload: CreateAssignmentInput): Promise<StudentAssignment> {
    return apiClient.post<StudentAssignment>("/assignments", payload).then((r) => r.data);
  },

  update(id: string, payload: UpdateAssignmentInput): Promise<StudentAssignment> {
    return apiClient.patch<StudentAssignment>(`/assignments/${id}`, payload).then((r) => r.data);
  },

  remove(id: string): Promise<void> {
    return apiClient.delete(`/assignments/${id}`).then(() => undefined);
  },
};
