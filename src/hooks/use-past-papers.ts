"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { pastPapersService } from "@/services/past-papers.service";
import { useAppSelector } from "@/store";
import type {
  CreatePastPaperInput,
  StartPastPaperInput,
  UpdatePastPaperInput,
} from "@/types/past-paper.types";

function usePastPaperAuthKey() {
  const userId = useAppSelector((s) => s.auth.user?.id);
  return userId ?? "anon";
}

export function usePastPaperArchive(programSlug: string) {
  const authKey = usePastPaperAuthKey();
  return useQuery({
    queryKey: queryKeys.pastPapers.program(programSlug, authKey),
    queryFn: () => pastPapersService.listArchive(programSlug),
    enabled: Boolean(programSlug),
  });
}

export function usePastPaperDetail(programSlug: string, paperSlug: string) {
  const authKey = usePastPaperAuthKey();
  return useQuery({
    queryKey: queryKeys.pastPapers.paper(programSlug, paperSlug, authKey),
    queryFn: () => pastPapersService.getPaper(programSlug, paperSlug),
    enabled: Boolean(programSlug && paperSlug),
  });
}

export function usePastPaperHistory(programSlug: string) {
  const authKey = usePastPaperAuthKey();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.pastPapers.history(programSlug, authKey),
    queryFn: () => pastPapersService.listHistory(programSlug),
    enabled: Boolean(programSlug && isAuthenticated && authKey !== "anon"),
  });
}

export function usePastPaperAttempt(attemptId?: string) {
  return useQuery({
    queryKey: queryKeys.pastPapers.attempt(attemptId ?? ""),
    queryFn: () => pastPapersService.getAttempt(attemptId!),
    enabled: Boolean(attemptId),
  });
}

export function useAdminPastPapers(programId?: string) {
  return useQuery({
    queryKey: queryKeys.pastPapers.admin(programId),
    queryFn: () => pastPapersService.adminList(programId!),
    enabled: Boolean(programId),
  });
}

export function useTeacherPastPapers(programId?: string) {
  return useQuery({
    queryKey: queryKeys.pastPapers.teacher(programId),
    queryFn: () => pastPapersService.teacherList(programId!),
    enabled: Boolean(programId),
  });
}

function useInvalidatePastPapers() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: queryKeys.pastPapers.all });
}

export function useCreatePastPaper() {
  const invalidate = useInvalidatePastPapers();
  return useMutation({
    mutationFn: (payload: CreatePastPaperInput) => pastPapersService.createPaper(payload),
    onSuccess: invalidate,
  });
}

export function useUpdatePastPaper() {
  const invalidate = useInvalidatePastPapers();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePastPaperInput }) =>
      pastPapersService.updatePaper(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeletePastPaper() {
  const invalidate = useInvalidatePastPapers();
  return useMutation({
    mutationFn: (id: string) => pastPapersService.deletePaper(id),
    onSuccess: invalidate,
  });
}

export function useStartPastPaperAttempt() {
  const invalidate = useInvalidatePastPapers();
  return useMutation({
    mutationFn: (payload: StartPastPaperInput) => pastPapersService.startAttempt(payload),
    onSuccess: invalidate,
  });
}

export function useSavePastPaperAnswer() {
  return useMutation({
    mutationFn: ({
      attemptId,
      questionId,
      answer,
    }: {
      attemptId: string;
      questionId: string;
      answer: string;
    }) => pastPapersService.saveAnswer(attemptId, questionId, answer),
  });
}

export function useSubmitPastPaperAttempt() {
  const invalidate = useInvalidatePastPapers();
  return useMutation({
    mutationFn: (attemptId: string) => pastPapersService.submitAttempt(attemptId),
    onSuccess: invalidate,
  });
}
