"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { curriculumService } from "@/services/curriculum.service";
import type { ChapterInput, LessonInput } from "@/types/curriculum.types";

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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.byCourse(courseId) });
    },
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.byCourse(courseId) });
    },
  });
}

export function useDeleteChapter(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => curriculumService.deleteChapter(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.byCourse(courseId) });
    },
  });
}

export function useCreateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LessonInput) => curriculumService.createLesson(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.byCourse(courseId) });
    },
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
      payload: Partial<Omit<LessonInput, "chapterId">>;
    }) => curriculumService.updateLesson(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.byCourse(courseId) });
    },
  });
}

export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => curriculumService.deleteLesson(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.byCourse(courseId) });
    },
  });
}
