import { env } from "@/config";
import type {
  CreateQbQuestionInput,
  CreateQbSubtopicInput,
  CreateQbTopicInput,
  QbImportResult,
} from "./questionbank-admin.types";
import type {
  PracticeAnswerFeedback,
  PracticeHistoryItem,
  PracticeSessionResult,
  PracticeSessionStart,
  QbFilters,
  QbProgramOverview,
  QbStudyPayload,
  QbTopic,
  StartPracticeSessionInput,
} from "@/types/qb.types";
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
    // Send JWT when present so GOLD locks resolve for entitled students.
    // Endpoint stays public via OptionalJwtAuthGuard.
    const response = await apiClient.get<QbProgramOverview>(
      `/questionbank/programs/${programSlug}`
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
      `/questionbank/programs/${programSlug}/subtopics/${subtopicSlug}/questions${buildQuery(filters)}`
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

  startPracticeSession(payload: StartPracticeSessionInput): Promise<PracticeSessionStart> {
    return apiClient
      .post<PracticeSessionStart>(`/questionbank/practice/sessions`, payload)
      .then((r) => r.data);
  },

  savePracticeAnswer(
    sessionId: string,
    questionId: string,
    answer: string,
    reveal = true
  ): Promise<{
    answer: { isCorrect: boolean } | null;
    feedback: PracticeAnswerFeedback | null;
    expired?: boolean;
    result?: PracticeSessionResult;
  }> {
    return apiClient
      .patch<{
        answer: { isCorrect: boolean } | null;
        feedback: PracticeAnswerFeedback | null;
        expired?: boolean;
        result?: PracticeSessionResult;
      }>(
        `/questionbank/practice/sessions/${sessionId}/answers`,
        {
          questionId,
          answer,
          reveal,
        }
      )
      .then((r) => r.data);
  },

  submitPracticeSession(sessionId: string): Promise<PracticeSessionResult> {
    return apiClient
      .post<PracticeSessionResult>(`/questionbank/practice/sessions/${sessionId}/submit`)
      .then((r) => r.data);
  },

  getPracticeSession(sessionId: string): Promise<PracticeSessionResult> {
    return apiClient
      .get<PracticeSessionResult>(`/questionbank/practice/sessions/${sessionId}`)
      .then((r) => r.data);
  },

  getPracticeHistory(mode?: "STUDY" | "EXAM"): Promise<PracticeHistoryItem[]> {
    const query = mode ? `?mode=${mode}` : "";
    return apiClient
      .get<PracticeHistoryItem[]>(`/questionbank/practice/history${query}`)
      .then((r) => r.data ?? []);
  },
};
