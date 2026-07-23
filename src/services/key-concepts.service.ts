import { apiClient } from "./api-client";
import type {
  AdminKeyConceptList,
  CreateKeyConceptLessonInput,
  KeyConceptLesson,
  KeyConceptLessonDetail,
  KeyConceptProgramList,
  UpdateKeyConceptLessonInput,
} from "@/types/key-concept.types";

export const keyConceptsService = {
  async listLessons(programSlug: string): Promise<KeyConceptProgramList> {
    const response = await apiClient.get<KeyConceptProgramList>(
      `/key-concepts/programs/${encodeURIComponent(programSlug)}`
    );
    return response.data;
  },

  async getLesson(
    programSlug: string,
    lessonSlug: string
  ): Promise<KeyConceptLessonDetail> {
    const response = await apiClient.get<KeyConceptLessonDetail>(
      `/key-concepts/programs/${encodeURIComponent(programSlug)}/lessons/${encodeURIComponent(lessonSlug)}`
    );
    return response.data;
  },

  async adminList(programId: string): Promise<AdminKeyConceptList> {
    const response = await apiClient.get<AdminKeyConceptList>(
      `/key-concepts/admin?programId=${encodeURIComponent(programId)}`
    );
    return response.data;
  },

  async teacherList(programId: string): Promise<AdminKeyConceptList> {
    const response = await apiClient.get<AdminKeyConceptList>(
      `/key-concepts/teacher?programId=${encodeURIComponent(programId)}`
    );
    return response.data;
  },

  async createLesson(payload: CreateKeyConceptLessonInput): Promise<KeyConceptLesson> {
    const response = await apiClient.post<KeyConceptLesson>(
      "/key-concepts/admin/lessons",
      payload
    );
    return response.data;
  },

  async updateLesson(
    id: string,
    payload: UpdateKeyConceptLessonInput
  ): Promise<KeyConceptLesson> {
    const response = await apiClient.patch<KeyConceptLesson>(
      `/key-concepts/admin/lessons/${id}`,
      payload
    );
    return response.data;
  },

  async deleteLesson(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/key-concepts/admin/lessons/${id}`
    );
    return response.data;
  },
};
