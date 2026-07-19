"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import {
  submissionsService,
  type SubmitAssignmentInput,
} from "@/services/submissions.service";

export function useUngradedSubmissions() {
  return useQuery({
    queryKey: queryKeys.submissions.ungraded,
    queryFn: () => submissionsService.listUngraded(),
  });
}

export function useSubmitAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitAssignmentInput) => submissionsService.submit(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.student.submissions });
      void qc.invalidateQueries({ queryKey: queryKeys.student.myAssignments });
      void qc.invalidateQueries({ queryKey: queryKeys.submissions.ungraded });
    },
  });
}

export function useGradeSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      grade,
      feedback,
    }: {
      id: string;
      grade: number;
      feedback?: string;
    }) => submissionsService.grade(id, { grade, feedback }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.submissions.ungraded });
      void qc.invalidateQueries({ queryKey: queryKeys.student.submissions });
    },
  });
}
