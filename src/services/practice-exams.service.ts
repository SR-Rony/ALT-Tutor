import { apiClient } from "./api-client";
import type {
  AdminPracticeExamList,
  CreatePracticeExamTemplateInput,
  PracticeExamTemplate,
  UpdatePracticeExamTemplateInput,
} from "@/types/practice-exam.types";

export const practiceExamsService = {
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
