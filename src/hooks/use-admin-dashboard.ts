"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import {
  adminCoursesService,
  adminPaymentsService,
  adminUsersService,
  dashboardService,
} from "@/services";
import type { CourseStatus } from "@/types/admin-dashboard.types";

export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: () => dashboardService.getAdminStats(),
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: () => adminUsersService.getUsers(),
  });
}

export function useAdminCourses() {
  return useQuery({
    queryKey: queryKeys.admin.courses,
    queryFn: () => adminCoursesService.getAll(),
  });
}

export function useAdminPayments() {
  return useQuery({
    queryKey: queryKeys.admin.payments,
    queryFn: () => adminPaymentsService.getAll(),
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminUsersService.updateStatus(id, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}

export function useUpdateCourseStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CourseStatus }) =>
      adminCoursesService.updateStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}
