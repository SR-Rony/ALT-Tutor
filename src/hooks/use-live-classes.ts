"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { liveClassesService } from "@/services/live-classes.service";
import type {
  CreateLiveClassInput,
  StaffLiveClassQuery,
  UpdateLiveClassInput,
} from "@/types/live-class.types";

function useInvalidateLiveClasses() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: queryKeys.liveClasses.all });
}

export function useStudentLiveClasses() {
  return useQuery({
    queryKey: queryKeys.liveClasses.mine,
    queryFn: () => liveClassesService.listMine(),
  });
}

export function useStaffLiveClasses(query?: StaffLiveClassQuery) {
  return useQuery({
    queryKey: queryKeys.liveClasses.staff(query),
    queryFn: () => liveClassesService.staffList(query),
  });
}

export function useCourseLiveClasses(courseId?: string) {
  return useQuery({
    queryKey: queryKeys.liveClasses.course(courseId ?? "none"),
    queryFn: () => liveClassesService.listForCourse(courseId!),
    enabled: Boolean(courseId),
  });
}

export function useLiveClassAttendance(id?: string, open = false) {
  return useQuery({
    queryKey: queryKeys.liveClasses.attendance(id ?? "none"),
    queryFn: () => liveClassesService.attendance(id!),
    enabled: Boolean(id) && open,
    refetchInterval: (query) => {
      if (!open) return false;
      return query.state.data?.liveClass.status === "LIVE" ? 15_000 : false;
    },
  });
}

export function useCreateLiveClass() {
  const invalidate = useInvalidateLiveClasses();
  return useMutation({
    mutationFn: (payload: CreateLiveClassInput) => liveClassesService.create(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateLiveClass() {
  const invalidate = useInvalidateLiveClasses();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLiveClassInput }) =>
      liveClassesService.update(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteLiveClass() {
  const invalidate = useInvalidateLiveClasses();
  return useMutation({
    mutationFn: (id: string) => liveClassesService.remove(id),
    onSuccess: invalidate,
  });
}

export function useGoLiveLiveClass() {
  const invalidate = useInvalidateLiveClasses();
  return useMutation({
    mutationFn: (id: string) => liveClassesService.goLive(id),
    onSuccess: invalidate,
  });
}

export function useEndLiveClass() {
  const invalidate = useInvalidateLiveClasses();
  return useMutation({
    mutationFn: (id: string) => liveClassesService.end(id),
    onSuccess: invalidate,
  });
}

export function useJoinLiveClass() {
  const invalidate = useInvalidateLiveClasses();
  return useMutation({
    mutationFn: (id: string) => liveClassesService.join(id),
    onSuccess: invalidate,
  });
}
