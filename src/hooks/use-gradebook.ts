"use client";

import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gradebookService } from "@/services/gradebook.service";

export function useGradebook(filters: { courseId?: string; programId?: string }) {
  return useQuery({
    queryKey: ["gradebook", filters.courseId ?? "", filters.programId ?? ""],
    queryFn: () => gradebookService.get(filters),
    enabled: Boolean(filters.courseId || filters.programId),
  });
}

export function useGradeOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: gradebookService.override,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["gradebook"] }),
  });
}
