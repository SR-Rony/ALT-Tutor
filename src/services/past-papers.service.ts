import { apiClient } from "./api-client";
import type {
  AdminPastPaperList,
  CreatePastPaperInput,
  PastPaper,
  PastPaperAttemptPayload,
  PastPaperDetail,
  PastPaperProgramArchive,
  StartPastPaperInput,
  UpdatePastPaperInput,
} from "@/types/past-paper.types";

export const pastPapersService = {
  async listArchive(programSlug: string): Promise<PastPaperProgramArchive> {
    const response = await apiClient.get<PastPaperProgramArchive>(
      `/past-papers/programs/${encodeURIComponent(programSlug)}`
    );
    return response.data;
  },

  async getPaper(programSlug: string, paperSlug: string): Promise<PastPaperDetail> {
    const response = await apiClient.get<PastPaperDetail>(
      `/past-papers/programs/${encodeURIComponent(programSlug)}/papers/${encodeURIComponent(paperSlug)}`
    );
    return response.data;
  },

  async startAttempt(payload: StartPastPaperInput): Promise<PastPaperAttemptPayload> {
    const response = await apiClient.post<PastPaperAttemptPayload>(
      "/past-papers/attempts",
      payload
    );
    return response.data;
  },

  async getAttempt(attemptId: string): Promise<PastPaperAttemptPayload> {
    const response = await apiClient.get<PastPaperAttemptPayload>(
      `/past-papers/attempts/${encodeURIComponent(attemptId)}`
    );
    return response.data;
  },

  async saveAnswer(attemptId: string, questionId: string, answer: string) {
    const response = await apiClient.patch<{
      saved?: boolean;
      expired?: boolean;
      result?: PastPaperAttemptPayload;
    }>(`/past-papers/attempts/${encodeURIComponent(attemptId)}/answers`, {
      questionId,
      answer,
    });
    return response.data;
  },

  async submitAttempt(attemptId: string): Promise<PastPaperAttemptPayload> {
    const response = await apiClient.post<PastPaperAttemptPayload>(
      `/past-papers/attempts/${encodeURIComponent(attemptId)}/submit`
    );
    return response.data;
  },

  async listHistory(programSlug?: string) {
    const params = new URLSearchParams();
    if (programSlug) params.set("programSlug", programSlug);
    const response = await apiClient.get<
      Array<{
        id: string;
        status: string;
        score: number;
        paper: PastPaper;
      }>
    >(`/past-papers/history?${params.toString()}`);
    return response.data ?? [];
  },

  async adminList(programId: string): Promise<AdminPastPaperList> {
    const response = await apiClient.get<AdminPastPaperList>(
      `/past-papers/admin?programId=${encodeURIComponent(programId)}`
    );
    return response.data;
  },

  async createPaper(payload: CreatePastPaperInput): Promise<PastPaper> {
    const response = await apiClient.post<PastPaper>("/past-papers/admin/papers", payload);
    return response.data;
  },

  async updatePaper(id: string, payload: UpdatePastPaperInput): Promise<PastPaper> {
    const response = await apiClient.patch<PastPaper>(
      `/past-papers/admin/papers/${id}`,
      payload
    );
    return response.data;
  },

  async deletePaper(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/past-papers/admin/papers/${id}`
    );
    return response.data;
  },
};
