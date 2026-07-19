"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import {
  assignmentsService,
  type CreateAssignmentInput,
  type UpdateAssignmentInput,
} from "@/services/assignments.service";

export function useMyAssignments() {
  return useQuery({
    queryKey: queryKeys.student.myAssignments,
    queryFn: () => assignmentsService.listMine(),
  });
}

export function useCourseAssignments(courseId?: string) {
  return useQuery({
    queryKey: queryKeys.assignments.byCourse(courseId ?? ""),
    queryFn: () => assignmentsService.findByCourse(courseId!),
    enabled: Boolean(courseId),
  });
}

export function useProgramAssignments(programId?: string) {
  return useQuery({
    queryKey: queryKeys.assignments.byProgram(programId ?? ""),
    queryFn: () => assignmentsService.findByProgram(programId!),
    enabled: Boolean(programId),
  });
}

export function useAssignmentDetail(id: string) {
  return useQuery({
    queryKey: ["assignments", "detail", id],
    queryFn: () => assignmentsService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAssignmentInput) => assignmentsService.create(payload),
    onSuccess: (data) => {
      if (data.courseId) {
        void qc.invalidateQueries({ queryKey: queryKeys.assignments.byCourse(data.courseId) });
      }
      if (data.programId) {
        void qc.invalidateQueries({ queryKey: queryKeys.assignments.byProgram(data.programId) });
      }
      void qc.invalidateQueries({ queryKey: queryKeys.student.myAssignments });
      void qc.invalidateQueries({ queryKey: queryKeys.mcq.all });
    },
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAssignmentInput }) =>
      assignmentsService.update(id, payload),
    onSuccess: (data) => {
      if (data.courseId) {
        void qc.invalidateQueries({ queryKey: queryKeys.assignments.byCourse(data.courseId) });
      }
      if (data.programId) {
        void qc.invalidateQueries({ queryKey: queryKeys.assignments.byProgram(data.programId) });
      }
      void qc.invalidateQueries({ queryKey: queryKeys.mcq.all });
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assignmentsService.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
}
