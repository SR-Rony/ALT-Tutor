import { env } from "@/config";
import type {
  CreateQbQuestionInput,
  CreateQbSubtopicInput,
  CreateQbTopicInput,
  QbImportResult,
} from "./questionbank-admin.types";
import type { QbFilters, QbProgramOverview, QbStudyPayload, QbTopic } from "@/types/qb.types";
import { sleep } from "@/utils";
import { apiClient } from "./api-client";

function buildQuery(filters: QbFilters = {}) {
  const params = new URLSearchParams();
  if (filters.difficulty?.length) params.set("difficulty", filters.difficulty.join(","));
  if (filters.paper?.length) params.set("paper", filters.paper.join(","));
  if (filters.type?.length) params.set("type", filters.type.join(","));
  const q = params.toString();
  return q ? `?${q}` : "";
}

export const questionbankService = {
  async getProgram(programSlug: string): Promise<QbProgramOverview> {
    if (env.useMockApi) {
      await sleep(200);
      throw { message: "Mock questionbank overview unavailable", status: 404 };
    }
    const response = await apiClient.get<QbProgramOverview>(
      `/questionbank/programs/${programSlug}`,
      { skipAuth: true }
    );
    return response.data;
  },

  async getQuestions(
    programSlug: string,
    subtopicSlug: string,
    filters: QbFilters = {}
  ): Promise<QbStudyPayload> {
    if (env.useMockApi) {
      await sleep(200);
      throw { message: "Mock study set unavailable", status: 404 };
    }
    const response = await apiClient.get<QbStudyPayload>(
      `/questionbank/programs/${programSlug}/subtopics/${subtopicSlug}/questions${buildQuery(filters)}`,
      { skipAuth: true }
    );
    return response.data;
  },

  async adminList(programId?: string): Promise<QbTopic[]> {
    const q = programId ? `?programId=${encodeURIComponent(programId)}` : "";
    const response = await apiClient.get<QbTopic[]>(`/questionbank/admin${q}`);
    return response.data ?? [];
  },

  createTopic(payload: CreateQbTopicInput) {
    return apiClient.post(`/questionbank/topics`, payload).then((r) => r.data);
  },
  updateTopic(id: string, payload: Partial<CreateQbTopicInput>) {
    return apiClient.patch(`/questionbank/topics/${id}`, payload).then((r) => r.data);
  },
  deleteTopic(id: string) {
    return apiClient.delete(`/questionbank/topics/${id}`).then((r) => r.data);
  },
  createSubtopic(payload: CreateQbSubtopicInput) {
    return apiClient.post(`/questionbank/subtopics`, payload).then((r) => r.data);
  },
  updateSubtopic(id: string, payload: Partial<CreateQbSubtopicInput>) {
    return apiClient.patch(`/questionbank/subtopics/${id}`, payload).then((r) => r.data);
  },
  deleteSubtopic(id: string) {
    return apiClient.delete(`/questionbank/subtopics/${id}`).then((r) => r.data);
  },
  createQuestion(payload: CreateQbQuestionInput) {
    return apiClient.post(`/questionbank/questions`, payload).then((r) => r.data);
  },
  updateQuestion(id: string, payload: Partial<CreateQbQuestionInput>) {
    return apiClient.patch(`/questionbank/questions/${id}`, payload).then((r) => r.data);
  },
  deleteQuestion(id: string) {
    return apiClient.delete(`/questionbank/questions/${id}`).then((r) => r.data);
  },

  importQuestions(subtopicId: string, file: File): Promise<QbImportResult> {
    const form = new FormData();
    form.append("file", file);
    return apiClient
      .post<QbImportResult>(`/questionbank/subtopics/${subtopicId}/import`, form)
      .then((r) => r.data);
  },
};
