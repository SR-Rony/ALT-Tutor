import { apiClient } from "./api-client";
import type {
  AdminPracticeExamList,
  CreatePracticeExamTemplateInput,
  PracticeExamAttemptPayload,
  PracticeExamHistoryItem,
  PracticeExamProgramList,
  PracticeExamTemplate,
  PracticeExamTemplateDetail,
  SavePracticeExamAnswerResult,
  StartPracticeExamInput,
  UpdatePracticeExamTemplateInput,
} from "@/types/practice-exam.types";

export const practiceExamsService = {
  async listTemplates(programSlug: string): Promise<PracticeExamProgramList> {
    const response = await apiClient.get<PracticeExamProgramList>(
      `/practice-exams/programs/${encodeURIComponent(programSlug)}`
    );
    return response.data;
  },

  async getTemplate(
    programSlug: string,
    templateSlug: string
  ): Promise<PracticeExamTemplateDetail> {
    const response = await apiClient.get<PracticeExamTemplateDetail>(
      `/practice-exams/programs/${encodeURIComponent(programSlug)}/templates/${encodeURIComponent(templateSlug)}`
    );
    return response.data;
  },

  async listHistory(programSlug: string, limit = 20): Promise<PracticeExamHistoryItem[]> {
    const params = new URLSearchParams({
      programSlug,
      limit: String(limit),
    });
    const response = await apiClient.get<PracticeExamHistoryItem[]>(
      `/practice-exams/history?${params.toString()}`
    );
    return response.data ?? [];
  },

  async teacherList(programId: string): Promise<AdminPracticeExamList> {
    const response = await apiClient.get<AdminPracticeExamList>(
      `/practice-exams/teacher?programId=${encodeURIComponent(programId)}`
    );
    return response.data;
  },

  async startAttempt(payload: StartPracticeExamInput): Promise<PracticeExamAttemptPayload> {
    const response = await apiClient.post<PracticeExamAttemptPayload>(
      "/practice-exams/attempts",
      payload
    );
    return response.data;
  },

  async getAttempt(attemptId: string): Promise<PracticeExamAttemptPayload> {
    const response = await apiClient.get<PracticeExamAttemptPayload>(
      `/practice-exams/attempts/${encodeURIComponent(attemptId)}`
    );
    return response.data;
  },

  async saveAnswer(
    attemptId: string,
    questionId: string,
    answer: string
  ): Promise<SavePracticeExamAnswerResult> {
    const response = await apiClient.patch<SavePracticeExamAnswerResult>(
      `/practice-exams/attempts/${encodeURIComponent(attemptId)}/answers`,
      { questionId, answer }
    );
    return response.data;
  },

  async submitAttempt(attemptId: string): Promise<PracticeExamAttemptPayload> {
    const response = await apiClient.post<PracticeExamAttemptPayload>(
      `/practice-exams/attempts/${encodeURIComponent(attemptId)}/submit`
    );
    return response.data;
  },

  async adminList(programId: string): Promise<AdminPracticeExamList> {
    const response = await apiClient.get<AdminPracticeExamList>(
      `/practice-exams/admin?programId=${encodeURIComponent(programId)}`
    );
    return response.data;
  },
  async createTemplate(
    payload: CreatePracticeExamTemplateInput
  ): Promise<PracticeExamTemplate> {
    const response = await apiClient.post<PracticeExamTemplate>(
      "/practice-exams/admin/templates",
      payload
    );
    return response.data;
  },
  async updateTemplate(
    id: string,
    payload: UpdatePracticeExamTemplateInput
  ): Promise<PracticeExamTemplate> {
    const response = await apiClient.patch<PracticeExamTemplate>(
      `/practice-exams/admin/templates/${id}`,
      payload
    );
    return response.data;
  },
  async deleteTemplate(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/practice-exams/admin/templates/${id}`
    );
    return response.data;
  },
};
