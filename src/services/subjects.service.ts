import { env } from "@/config";
import type {
  SubjectCategoryInput,
  SubjectInput,
  SubjectMenuCategory,
  SubjectProgramInput,
  SubjectResourceInput,
} from "@/types/subjects.types";
import { sleep } from "@/utils";
import { apiClient } from "../api-client";
import { mockSubjectMenu } from "@/data/mock/subjects.mock";

export const subjectsService = {
  async getMenu(): Promise<SubjectMenuCategory[]> {
    if (env.useMockApi) {
      await sleep(200);
      return mockSubjectMenu;
    }
    const response = await apiClient.get<SubjectMenuCategory[]>("/subjects/menu", { skipAuth: true });
    return response.data ?? [];
  },

  async getAdminTree(): Promise<SubjectMenuCategory[]> {
    if (env.useMockApi) {
      await sleep(200);
      return mockSubjectMenu;
    }
    const response = await apiClient.get<SubjectMenuCategory[]>("/subjects/admin/tree");
    return response.data ?? [];
  },

  async getMine(): Promise<SubjectMenuCategory[]> {
    if (env.useMockApi) {
      await sleep(200);
      return mockSubjectMenu;
    }
    const response = await apiClient.get<SubjectMenuCategory[]>("/subjects/mine");
    return response.data ?? [];
  },

  async createCategory(payload: SubjectCategoryInput) {
    const response = await apiClient.post("/subjects/categories", payload);
    return response.data;
  },

  async updateCategory(id: string, payload: Partial<SubjectCategoryInput>) {
    const response = await apiClient.patch(`/subjects/categories/${id}`, payload);
    return response.data;
  },

  async deleteCategory(id: string) {
    const response = await apiClient.delete(`/subjects/categories/${id}`);
    return response.data;
  },

  async createSubject(payload: SubjectInput) {
    const response = await apiClient.post("/subjects", payload);
    return response.data;
  },

  async updateSubject(id: string, payload: Partial<SubjectInput>) {
    const response = await apiClient.patch(`/subjects/${id}`, payload);
    return response.data;
  },

  async deleteSubject(id: string) {
    const response = await apiClient.delete(`/subjects/${id}`);
    return response.data;
  },

  async assignTeachers(subjectId: string, teacherIds: string[]) {
    const response = await apiClient.post(`/subjects/${subjectId}/teachers`, { teacherIds });
    return response.data;
  },

  async createProgram(subjectId: string, payload: SubjectProgramInput) {
    const response = await apiClient.post(`/subjects/${subjectId}/programs`, payload);
    return response.data;
  },

  async updateProgram(id: string, payload: Partial<SubjectProgramInput>) {
    const response = await apiClient.patch(`/subjects/programs/${id}`, payload);
    return response.data;
  },

  async deleteProgram(id: string) {
    const response = await apiClient.delete(`/subjects/programs/${id}`);
    return response.data;
  },

  async createResource(programId: string, payload: SubjectResourceInput) {
    const response = await apiClient.post(`/subjects/programs/${programId}/resources`, payload);
    return response.data;
  },

  async updateResource(id: string, payload: Partial<SubjectResourceInput>) {
    const response = await apiClient.patch(`/subjects/resources/${id}`, payload);
    return response.data;
  },

  async deleteResource(id: string) {
    const response = await apiClient.delete(`/subjects/resources/${id}`);
    return response.data;
  },
};
