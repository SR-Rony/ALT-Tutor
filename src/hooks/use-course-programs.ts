"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { adminCoursesService } from "@/services/admin/admin-courses.service";

export function useCourseProgramLinks(courseId: string) {
  return useQuery({
    queryKey: queryKeys.admin.coursePrograms(courseId),
    queryFn: () => adminCoursesService.getProgramLinks(courseId),
    enabled: Boolean(courseId),
  });
}

export function useSetCourseProgramLinks(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (programIds: string[]) => adminCoursesService.setProgramLinks(courseId, programIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.admin.coursePrograms(courseId) });
      void qc.invalidateQueries({ queryKey: queryKeys.admin.course(courseId) });
    },
  });
}
