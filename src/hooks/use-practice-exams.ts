"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { practiceExamsService } from "@/services/practice-exams.service";
import { useAppSelector } from "@/store";
import type {
  CreatePracticeExamTemplateInput,
  UpdatePracticeExamTemplateInput,
} from "@/types/practice-exam.types";

function usePracticeExamAuthKey() {
  const userId = useAppSelector((s) => s.auth.user?.id);
  return userId ?? "anon";
}

export function usePracticeExamTemplates(programSlug: string) {
  const authKey = usePracticeExamAuthKey();
  return useQuery({
    queryKey: queryKeys.practiceExams.program(programSlug, authKey),
    queryFn: () => practiceExamsService.listTemplates(programSlug),
    enabled: Boolean(programSlug),
  });
}

export function usePracticeExamTemplate(programSlug: string, templateSlug: string) {
  const authKey = usePracticeExamAuthKey();
  return useQuery({
    queryKey: queryKeys.practiceExams.template(programSlug, templateSlug, authKey),
    queryFn: () => practiceExamsService.getTemplate(programSlug, templateSlug),
    enabled: Boolean(programSlug && templateSlug),
  });
}

export function usePracticeExamHistory(programSlug: string) {
  const authKey = usePracticeExamAuthKey();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.practiceExams.history(programSlug, authKey),
    queryFn: () => practiceExamsService.listHistory(programSlug),
    enabled: Boolean(programSlug && isAuthenticated && authKey !== "anon"),
  });
}

export function useAdminPracticeExams(programId?: string) {
  return useQuery({
    queryKey: queryKeys.practiceExams.admin(programId),
    queryFn: () => practiceExamsService.adminList(programId!),
    enabled: Boolean(programId),
  });
}

function useInvalidatePracticeExams() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: queryKeys.practiceExams.all });
}

export function useCreatePracticeExamTemplate() {
  const invalidate = useInvalidatePracticeExams();
  return useMutation({
    mutationFn: (payload: CreatePracticeExamTemplateInput) =>
      practiceExamsService.createTemplate(payload),
    onSuccess: invalidate,
  });
}

export function useUpdatePracticeExamTemplate() {
  const invalidate = useInvalidatePracticeExams();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePracticeExamTemplateInput;
    }) => practiceExamsService.updateTemplate(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeletePracticeExamTemplate() {
  const invalidate = useInvalidatePracticeExams();
  return useMutation({
    mutationFn: (id: string) => practiceExamsService.deleteTemplate(id),
    onSuccess: invalidate,
  });
}
