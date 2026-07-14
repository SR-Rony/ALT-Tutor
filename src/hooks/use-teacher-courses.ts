"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { teacherCoursesService } from "@/services/teacher-courses.service";
import type { CourseUpsertInput } from "@/services/admin/admin-courses.service";

export function useTeacherCourses() {
  return useQuery({
    queryKey: queryKeys.teacher.courses,
    queryFn: () => teacherCoursesService.getMine(),
  });
}

export function useTeacherCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<CourseUpsertInput, "teacherId">) =>
      teacherCoursesService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.teacher.courses });
      void queryClient.invalidateQueries({ queryKey: queryKeys.teacher.dashboard });
    },
  });
}

export function useTeacherUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Omit<CourseUpsertInput, "teacherId">>;
    }) => teacherCoursesService.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.teacher.courses });
      void queryClient.invalidateQueries({ queryKey: queryKeys.teacher.dashboard });
    },
  });
}

export function useTeacherDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teacherCoursesService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.teacher.courses });
      void queryClient.invalidateQueries({ queryKey: queryKeys.teacher.dashboard });
    },
  });
}
