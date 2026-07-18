"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { curriculumService } from "@/services/curriculum.service";
import type {
  ChapterInput,
  LessonAttachmentInput,
  LessonInput,
} from "@/types/curriculum.types";

function invalidateCourseQueries(queryClient: ReturnType<typeof useQueryClient>, courseId: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.byCourse(courseId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.admin.course(courseId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses });
  void queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
}

export function useCourseCurriculum(courseId: string) {
  return useQuery({
    queryKey: queryKeys.curriculum.byCourse(courseId),
    queryFn: () => curriculumService.getChaptersForManager(courseId),
    enabled: Boolean(courseId),
  });
}

export function useCreateChapter(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<ChapterInput, "courseId">) =>
      curriculumService.createChapter({ ...payload, courseId }),
    onSuccess: () => invalidateCourseQueries(queryClient, courseId),
  });
}

export function useUpdateChapter(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Pick<ChapterInput, "title" | "description" | "order" | "isPublished">>;
    }) => curriculumService.updateChapter(id, payload),
    onSuccess: () => invalidateCourseQueries(queryClient, courseId),
  });
}

export function useDeleteChapter(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => curriculumService.deleteChapter(id),
    onSuccess: () => invalidateCourseQueries(queryClient, courseId),
  });
}

export function useReorderChapters(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chapterIds: string[]) => curriculumService.reorderChapters(courseId, chapterIds),
    onSuccess: () => invalidateCourseQueries(queryClient, courseId),
  });
}

export function useCreateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LessonInput) => curriculumService.createLesson(payload),
    onSuccess: () => invalidateCourseQueries(queryClient, courseId),
  });
}

export function useUpdateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<LessonInput>;
    }) => curriculumService.updateLesson(id, payload),
    onSuccess: () => invalidateCourseQueries(queryClient, courseId),
  });
}

export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => curriculumService.deleteLesson(id),
    onSuccess: () => invalidateCourseQueries(queryClient, courseId),
  });
}

export function useReorderLessons(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chapterId, lessonIds }: { chapterId: string; lessonIds: string[] }) =>
      curriculumService.reorderLessons(chapterId, lessonIds),
    onSuccess: () => invalidateCourseQueries(queryClient, courseId),
  });
}

export function useAddLessonAttachment(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      payload,
    }: {
      lessonId: string;
      payload: LessonAttachmentInput;
    }) => curriculumService.addAttachment(lessonId, payload),
    onSuccess: () => invalidateCourseQueries(queryClient, courseId),
  });
}

export function useUpdateLessonAttachment(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      attachmentId,
      payload,
    }: {
      attachmentId: string;
      payload: { filename?: string; order?: number };
    }) => curriculumService.updateAttachment(attachmentId, payload),
    onSuccess: () => invalidateCourseQueries(queryClient, courseId),
  });
}

export function useDeleteLessonAttachment(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => curriculumService.deleteAttachment(attachmentId),
    onSuccess: () => invalidateCourseQueries(queryClient, courseId),
  });
}
