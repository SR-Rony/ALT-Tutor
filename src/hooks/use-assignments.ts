"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { assignmentsService } from "@/services/assignments.service";

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

export function useAssignmentDetail(id: string) {
  return useQuery({
    queryKey: ["assignments", "detail", id],
    queryFn: () => assignmentsService.getById(id),
    enabled: Boolean(id),
  });
}
