"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { questionbankService } from "@/services/questionbank.service";
import type {
  CreateQbQuestionInput,
  CreateQbSubtopicInput,
  CreateQbTopicInput,
} from "@/services/questionbank-admin.types";
import type { QbFilters } from "@/types/qb.types";

export function useQbProgram(programSlug: string) {
  return useQuery({
    queryKey: queryKeys.questionbank.program(programSlug),
    queryFn: () => questionbankService.getProgram(programSlug),
    enabled: Boolean(programSlug),
  });
}

export function useQbQuestions(programSlug: string, subtopicSlug: string, filters: QbFilters) {
  return useQuery({
    queryKey: queryKeys.questionbank.questions(programSlug, subtopicSlug, filters),
    queryFn: () => questionbankService.getQuestions(programSlug, subtopicSlug, filters),
    enabled: Boolean(programSlug && subtopicSlug),
  });
}

export function useAdminQuestionbank(programId?: string) {
  return useQuery({
    queryKey: queryKeys.questionbank.admin(programId),
    queryFn: () => questionbankService.adminList(programId),
  });
}

function useInvalidateQb() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: queryKeys.questionbank.all });
}

export function useCreateQbTopic() {
  const invalidate = useInvalidateQb();
  return useMutation({
    mutationFn: (payload: CreateQbTopicInput) => questionbankService.createTopic(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateQbTopic() {
  const invalidate = useInvalidateQb();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateQbTopicInput> }) =>
      questionbankService.updateTopic(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteQbTopic() {
  const invalidate = useInvalidateQb();
  return useMutation({
    mutationFn: (id: string) => questionbankService.deleteTopic(id),
    onSuccess: invalidate,
  });
}

export function useCreateQbSubtopic() {
  const invalidate = useInvalidateQb();
  return useMutation({
    mutationFn: (payload: CreateQbSubtopicInput) => questionbankService.createSubtopic(payload),
    onSuccess: invalidate,
  });
}

export function useDeleteQbSubtopic() {
  const invalidate = useInvalidateQb();
  return useMutation({
    mutationFn: (id: string) => questionbankService.deleteSubtopic(id),
    onSuccess: invalidate,
  });
}

export function useCreateQbQuestion() {
  const invalidate = useInvalidateQb();
  return useMutation({
    mutationFn: (payload: CreateQbQuestionInput) => questionbankService.createQuestion(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateQbQuestion() {
  const invalidate = useInvalidateQb();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateQbQuestionInput> }) =>
      questionbankService.updateQuestion(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteQbQuestion() {
  const invalidate = useInvalidateQb();
  return useMutation({
    mutationFn: (id: string) => questionbankService.deleteQuestion(id),
    onSuccess: invalidate,
  });
}
