"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { keyConceptsService } from "@/services/key-concepts.service";
import { useAppSelector } from "@/store";
import type {
  CreateKeyConceptLessonInput,
  UpdateKeyConceptLessonInput,
} from "@/types/key-concept.types";

function useKeyConceptAuthKey() {
  const userId = useAppSelector((s) => s.auth.user?.id);
  return userId ?? "anon";
}

export function useKeyConceptLessons(programSlug: string) {
  const authKey = useKeyConceptAuthKey();
  return useQuery({
    queryKey: queryKeys.keyConcepts.program(programSlug, authKey),
    queryFn: () => keyConceptsService.listLessons(programSlug),
    enabled: Boolean(programSlug),
  });
}

export function useKeyConceptLesson(programSlug: string, lessonSlug: string) {
  const authKey = useKeyConceptAuthKey();
  return useQuery({
    queryKey: queryKeys.keyConcepts.lesson(programSlug, lessonSlug, authKey),
    queryFn: () => keyConceptsService.getLesson(programSlug, lessonSlug),
    enabled: Boolean(programSlug && lessonSlug),
  });
}

export function useAdminKeyConcepts(programId?: string) {
  return useQuery({
    queryKey: queryKeys.keyConcepts.admin(programId),
    queryFn: () => keyConceptsService.adminList(programId!),
    enabled: Boolean(programId),
  });
}

function useInvalidateKeyConcepts() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: queryKeys.keyConcepts.all });
}

export function useCreateKeyConceptLesson() {
  const invalidate = useInvalidateKeyConcepts();
  return useMutation({
    mutationFn: (payload: CreateKeyConceptLessonInput) =>
      keyConceptsService.createLesson(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateKeyConceptLesson() {
  const invalidate = useInvalidateKeyConcepts();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateKeyConceptLessonInput;
    }) => keyConceptsService.updateLesson(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteKeyConceptLesson() {
  const invalidate = useInvalidateKeyConcepts();
  return useMutation({
    mutationFn: (id: string) => keyConceptsService.deleteLesson(id),
    onSuccess: invalidate,
  });
}
