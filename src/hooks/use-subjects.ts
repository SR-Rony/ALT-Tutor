"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { subjectsService } from "@/services/subjects.service";
import type {
  SubjectCategoryInput,
  SubjectInput,
  SubjectProgramInput,
  SubjectResourceInput,
} from "@/types/subjects.types";

export function useSubjectsMenu() {
  return useQuery({
    queryKey: queryKeys.subjects.menu,
    queryFn: () => subjectsService.getMenu(),
    staleTime: 60_000,
  });
}

export function useAdminSubjectsTree() {
  return useQuery({
    queryKey: queryKeys.subjects.adminTree,
    queryFn: () => subjectsService.getAdminTree(),
  });
}

export function useTeacherSubjectsTree() {
  return useQuery({
    queryKey: queryKeys.subjects.mine,
    queryFn: () => subjectsService.getMine(),
  });
}

function useInvalidateSubjects() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.subjects.all });
  };
}

export function useCreateSubjectCategory() {
  const invalidate = useInvalidateSubjects();
  return useMutation({
    mutationFn: (payload: SubjectCategoryInput) => subjectsService.createCategory(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateSubjectCategory() {
  const invalidate = useInvalidateSubjects();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SubjectCategoryInput> }) =>
      subjectsService.updateCategory(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteSubjectCategory() {
  const invalidate = useInvalidateSubjects();
  return useMutation({
    mutationFn: (id: string) => subjectsService.deleteCategory(id),
    onSuccess: invalidate,
  });
}

export function useCreateSubject() {
  const invalidate = useInvalidateSubjects();
  return useMutation({
    mutationFn: (payload: SubjectInput) => subjectsService.createSubject(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateSubject() {
  const invalidate = useInvalidateSubjects();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SubjectInput> }) =>
      subjectsService.updateSubject(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteSubject() {
  const invalidate = useInvalidateSubjects();
  return useMutation({
    mutationFn: (id: string) => subjectsService.deleteSubject(id),
    onSuccess: invalidate,
  });
}

export function useAssignSubjectTeachers() {
  const invalidate = useInvalidateSubjects();
  return useMutation({
    mutationFn: ({ subjectId, teacherIds }: { subjectId: string; teacherIds: string[] }) =>
      subjectsService.assignTeachers(subjectId, teacherIds),
    onSuccess: invalidate,
  });
}

export function useCreateSubjectProgram() {
  const invalidate = useInvalidateSubjects();
  return useMutation({
    mutationFn: ({ subjectId, payload }: { subjectId: string; payload: SubjectProgramInput }) =>
      subjectsService.createProgram(subjectId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateSubjectProgram() {
  const invalidate = useInvalidateSubjects();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SubjectProgramInput> }) =>
      subjectsService.updateProgram(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteSubjectProgram() {
  const invalidate = useInvalidateSubjects();
  return useMutation({
    mutationFn: (id: string) => subjectsService.deleteProgram(id),
    onSuccess: invalidate,
  });
}

export function useCreateSubjectResource() {
  const invalidate = useInvalidateSubjects();
  return useMutation({
    mutationFn: ({ programId, payload }: { programId: string; payload: SubjectResourceInput }) =>
      subjectsService.createResource(programId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateSubjectResource() {
  const invalidate = useInvalidateSubjects();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<SubjectResourceInput> }) =>
      subjectsService.updateResource(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteSubjectResource() {
  const invalidate = useInvalidateSubjects();
  return useMutation({
    mutationFn: (id: string) => subjectsService.deleteResource(id),
    onSuccess: invalidate,
  });
}
