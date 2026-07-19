"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import {
  adminCategoriesService,
  adminCoursesService,
  adminPaymentsService,
  adminUsersService,
  dashboardService,
} from "@/services";
import type { CategoryInput } from "@/services/admin/admin-categories.service";
import type { CourseUpsertInput } from "@/services/admin/admin-courses.service";
import type { TeacherInput } from "@/services/admin/admin-users.service";
import type { BackendRole, CourseStatus } from "@/types/admin-dashboard.types";

export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: () => dashboardService.getAdminStats(),
  });
}

export function useAdminAnalytics(filters?: { courseId?: string; programId?: string }) {
  return useQuery({
    queryKey: [...queryKeys.admin.dashboard, "analytics", filters?.courseId ?? "", filters?.programId ?? ""] as const,
    queryFn: () => dashboardService.getAdminAnalytics(filters),
  });
}

export function useAdminUsers(role?: BackendRole) {
  return useQuery({
    queryKey: [...queryKeys.admin.users, role ?? "ALL"] as const,
    queryFn: () => adminUsersService.getUsers(role),
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.user(id),
    queryFn: () => adminUsersService.getUser(id),
    enabled: Boolean(id),
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      payload: TeacherInput & {
        name: string;
        phone: string;
        address: string;
        password: string;
      }
    ) =>
      adminUsersService.createTeacher(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TeacherInput }) =>
      adminUsersService.updateTeacher(id, payload),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.user(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}

export function useAdminCourses() {
  return useQuery({
    queryKey: queryKeys.admin.courses,
    queryFn: () => adminCoursesService.getAll(),
  });
}

export function useAdminCourse(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.course(id),
    queryFn: () => adminCoursesService.getById(id),
    enabled: Boolean(id),
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: queryKeys.admin.categories,
    queryFn: () => adminCategoriesService.getAll(),
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
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.user(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: BackendRole }) =>
      adminUsersService.updateRole(id, role),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.user(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminUsersService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CourseUpsertInput) => adminCoursesService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CourseUpsertInput> }) =>
      adminCoursesService.update(id, payload),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.course(vars.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.curriculum.byCourse(vars.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    },
  });
}

export function useUpdateCourseStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CourseStatus }) =>
      adminCoursesService.updateStatus(id, status),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.course(vars.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminCoursesService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CategoryInput) => adminCategoriesService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.categories });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CategoryInput> }) =>
      adminCategoriesService.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.categories });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminCategoriesService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.categories });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.courses });
    },
  });
}
