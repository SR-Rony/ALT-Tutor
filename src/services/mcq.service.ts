import type {
  CreateMcqExamInput,
  McqAttemptHistory,
  McqAttemptRow,
  McqExam,
  McqExamStatus,
  McqResult,
  McqSession,
} from "@/types/mcq.types";
import { apiClient } from "./api-client";

export const mcqService = {
  listMyExams(): Promise<McqExam[]> {
    return apiClient.get<McqExam[]>("/assignments/mcq/mine").then((r) => r.data ?? []);
  },

  adminList(courseId?: string, programId?: string): Promise<McqExam[]> {
    const params = new URLSearchParams();
    if (courseId) params.set("courseId", courseId);
    if (programId) params.set("programId", programId);
    const q = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<McqExam[]>(`/assignments/mcq/admin${q}`).then((r) => r.data ?? []);
  },

  adminGet(id: string): Promise<McqExam> {
    return apiClient.get<McqExam>(`/assignments/${id}/mcq/manage`).then((r) => r.data);
  },

  adminResults(id: string): Promise<McqAttemptRow[]> {
    return apiClient.get<McqAttemptRow[]>(`/assignments/${id}/mcq/results`).then((r) => r.data ?? []);
  },

  create(payload: CreateMcqExamInput): Promise<McqExam> {
    return apiClient.post<McqExam>("/assignments/mcq", payload).then((r) => r.data);
  },

  update(id: string, payload: Partial<CreateMcqExamInput>): Promise<McqExam> {
    return apiClient.patch<McqExam>(`/assignments/${id}/mcq`, payload).then((r) => r.data);
  },

  remove(id: string): Promise<void> {
    return apiClient.delete(`/assignments/${id}/mcq`).then(() => undefined);
  },

  getStatus(assignmentId: string): Promise<McqExamStatus> {
    return apiClient.get<McqExamStatus>(`/assignments/${assignmentId}/mcq/status`).then((r) => r.data);
  },

  start(assignmentId: string): Promise<McqSession> {
    return apiClient.post<McqSession>(`/assignments/${assignmentId}/mcq/start`).then((r) => r.data);
  },

  getSession(assignmentId: string): Promise<McqSession | McqResult> {
    return apiClient.get<McqSession | McqResult>(`/assignments/${assignmentId}/mcq/session`).then((r) => r.data);
  },

  saveAnswers(assignmentId: string, answers: Record<string, string>): Promise<McqSession> {
    return apiClient
      .patch<McqSession>(`/assignments/${assignmentId}/mcq/answers`, { answers })
      .then((r) => r.data);
  },

  submit(assignmentId: string, answers: Record<string, string>): Promise<McqResult> {
    return apiClient
      .post<McqResult>(`/assignments/${assignmentId}/mcq/submit`, { answers })
      .then((r) => r.data);
  },

  myResult(assignmentId: string): Promise<McqAttemptHistory> {
    return apiClient
      .get<McqAttemptHistory>(`/assignments/${assignmentId}/mcq/my-result`)
      .then((r) => r.data);
  },
};
