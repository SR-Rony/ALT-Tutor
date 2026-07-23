"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { practiceExamsService } from "@/services/practice-exams.service";
import type {
  CreatePracticeExamTemplateInput,
  UpdatePracticeExamTemplateInput,
} from "@/types/practice-exam.types";

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
