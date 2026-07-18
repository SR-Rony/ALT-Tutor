import { env } from "@/config";
import type {
  ChapterInput,
  CurriculumChapter,
  CurriculumLesson,
  LessonAttachment,
  LessonAttachmentInput,
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
    return (response.data ?? []).map((chapter) => ({
      ...chapter,
      lessons: (chapter.lessons ?? []).map((lesson) => ({
        ...lesson,
        attachments: lesson.attachments ?? [],
      })),
    }));
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

  async reorderChapters(courseId: string, chapterIds: string[]): Promise<CurriculumChapter[]> {
    const response = await apiClient.post<CurriculumChapter[]>(
      `/chapters/reorder?courseId=${encodeURIComponent(courseId)}`,
      { chapterIds }
    );
    return response.data ?? [];
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
        isPublished: payload.isPublished ?? true,
        isPreview: payload.isPreview ?? false,
        chapterId: payload.chapterId,
        attachments: [],
      };
    }
    const response = await apiClient.post<CurriculumLesson>("/lessons", payload);
    return { ...response.data, attachments: response.data.attachments ?? [] };
  },

  async updateLesson(
    id: string,
    payload: Partial<LessonInput>
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
        chapterId: payload.chapterId ?? "",
        attachments: [],
      };
    }
    const response = await apiClient.patch<CurriculumLesson>(`/lessons/${id}`, payload);
    return { ...response.data, attachments: response.data.attachments ?? [] };
  },

  async deleteLesson(id: string): Promise<{ message: string }> {
    if (env.useMockApi) {
      await sleep(200);
      return { message: "Lesson deleted successfully" };
    }
    const response = await apiClient.delete<{ message: string }>(`/lessons/${id}`);
    return response.data ?? { message: "Lesson deleted successfully" };
  },

  async reorderLessons(chapterId: string, lessonIds: string[]): Promise<CurriculumLesson[]> {
    const response = await apiClient.post<CurriculumLesson[]>(
      `/lessons/reorder?chapterId=${encodeURIComponent(chapterId)}`,
      { lessonIds }
    );
    return response.data ?? [];
  },

  async addAttachment(lessonId: string, payload: LessonAttachmentInput): Promise<LessonAttachment> {
    const response = await apiClient.post<LessonAttachment>(
      `/lessons/${lessonId}/attachments`,
      payload
    );
    return response.data;
  },

  async updateAttachment(
    attachmentId: string,
    payload: { filename?: string; order?: number }
  ): Promise<LessonAttachment> {
    const response = await apiClient.patch<LessonAttachment>(
      `/lessons/attachments/${attachmentId}`,
      payload
    );
    return response.data;
  },

  async deleteAttachment(attachmentId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/lessons/attachments/${attachmentId}`
    );
    return response.data ?? { message: "Attachment deleted successfully" };
  },
};
