"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { mcqService } from "@/services/mcq.service";
import type { CreateMcqExamInput } from "@/types/mcq.types";

export function useMyMcqExams() {
  return useQuery({
    queryKey: queryKeys.mcq.mine,
    queryFn: () => mcqService.listMyExams(),
  });
}

export function useAdminMcqExams(courseId?: string) {
  return useQuery({
    queryKey: queryKeys.mcq.admin(courseId),
    queryFn: () => mcqService.adminList(courseId),
  });
}

export function useAdminMcqResults(examId?: string) {
  return useQuery({
    queryKey: queryKeys.mcq.results(examId ?? ""),
    queryFn: () => mcqService.adminResults(examId!),
    enabled: Boolean(examId),
  });
}

export function useMcqStatus(assignmentId: string) {
  return useQuery({
    queryKey: queryKeys.mcq.status(assignmentId),
    queryFn: () => mcqService.getStatus(assignmentId),
    enabled: Boolean(assignmentId),
  });
}

export function useCreateMcqExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMcqExamInput) => mcqService.create(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.mcq.all }),
  });
}

export function useUpdateMcqExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateMcqExamInput> }) =>
      mcqService.update(id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.mcq.all }),
  });
}

export function useDeleteMcqExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mcqService.remove(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.mcq.all }),
  });
}

export function useStartMcqExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => mcqService.start(assignmentId),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.mcq.status(id) });
    },
  });
}

export function useSubmitMcqExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      answers,
    }: {
      assignmentId: string;
      answers: Record<string, string>;
    }) => mcqService.submit(assignmentId, answers),
    onSuccess: (_, { assignmentId }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.mcq.status(assignmentId) });
    },
  });
}
