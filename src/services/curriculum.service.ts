import { env } from "@/config";
import type {
  ChapterInput,
  CurriculumChapter,
  CurriculumLesson,
  LessonInput,
} from "@/types/curriculum.types";
import { sleep } from "@/utils";
import { apiClient } from "./api-client";

export const curriculumService = {
  async getChaptersForManager(courseId: string): Promise<CurriculumChapter[]> {
    if (env.useMockApi) {
      await sleep(200);
      return [];
    }
    const response = await apiClient.get<CurriculumChapter[]>(
      `/chapters/manage?courseId=${encodeURIComponent(courseId)}`
    );
    return response.data ?? [];
  },

  async createChapter(payload: ChapterInput): Promise<CurriculumChapter> {
    if (env.useMockApi) {
      await sleep(200);
      return {
        id: `ch-${Date.now()}`,
        title: payload.title,
        description: payload.description ?? null,
        order: payload.order ?? 0,
        isPublished: payload.isPublished ?? true,
        courseId: payload.courseId,
        lessons: [],
      };
    }
    const response = await apiClient.post<CurriculumChapter>("/chapters", payload);
    return {
      ...response.data,
      lessons: response.data.lessons ?? [],
    };
  },

  async updateChapter(
    id: string,
    payload: Partial<Pick<ChapterInput, "title" | "description" | "order" | "isPublished">>
  ): Promise<CurriculumChapter> {
    if (env.useMockApi) {
      await sleep(200);
      return {
        id,
        title: payload.title ?? "Chapter",
        description: payload.description ?? null,
        order: payload.order ?? 0,
        isPublished: payload.isPublished ?? true,
        courseId: "",
        lessons: [],
      };
    }
    const response = await apiClient.patch<CurriculumChapter>(`/chapters/${id}`, payload);
    return {
      ...response.data,
      lessons: response.data.lessons ?? [],
    };
  },

  async deleteChapter(id: string): Promise<{ message: string }> {
    if (env.useMockApi) {
      await sleep(200);
      return { message: "Chapter deleted successfully" };
    }
    const response = await apiClient.delete<{ message: string }>(`/chapters/${id}`);
    return response.data ?? { message: "Chapter deleted successfully" };
  },

  async createLesson(payload: LessonInput): Promise<CurriculumLesson> {
    if (env.useMockApi) {
      await sleep(200);
      return {
        id: `ls-${Date.now()}`,
        title: payload.title,
        type: payload.type,
        contentUrl: payload.contentUrl ?? null,
        duration: payload.duration ?? null,
        order: payload.order ?? 0,
        chapterId: payload.chapterId,
      };
    }
    const response = await apiClient.post<CurriculumLesson>("/lessons", payload);
    return response.data;
  },

  async updateLesson(
    id: string,
    payload: Partial<Omit<LessonInput, "chapterId">>
  ): Promise<CurriculumLesson> {
    if (env.useMockApi) {
      await sleep(200);
      return {
        id,
        title: payload.title ?? "Lesson",
        type: payload.type ?? "VIDEO",
        contentUrl: payload.contentUrl ?? null,
        duration: payload.duration ?? null,
        order: payload.order ?? 0,
        chapterId: "",
      };
    }
    const response = await apiClient.patch<CurriculumLesson>(`/lessons/${id}`, payload);
    return response.data;
  },

  async deleteLesson(id: string): Promise<{ message: string }> {
    if (env.useMockApi) {
      await sleep(200);
      return { message: "Lesson deleted successfully" };
    }
    const response = await apiClient.delete<{ message: string }>(`/lessons/${id}`);
    return response.data ?? { message: "Lesson deleted successfully" };
  },
};
