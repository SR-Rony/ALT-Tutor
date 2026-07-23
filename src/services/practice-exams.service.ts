import { apiClient } from "./api-client";
import type {
  AdminPracticeExamList,
  CreatePracticeExamTemplateInput,
  PracticeExamHistoryItem,
  PracticeExamProgramList,
  PracticeExamTemplate,
  PracticeExamTemplateDetail,
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
