"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { studentService } from "@/services";

export function useStudentDashboard() {
  return useQuery({
    queryKey: queryKeys.student.dashboard,
    queryFn: () => studentService.getDashboard(),
  });
}

export function useStudentCourses(enabled = true) {
  return useQuery({
    queryKey: queryKeys.student.courses,
    queryFn: () => studentService.getMyCourses(),
    enabled,
  });
}

export function useStudentSubmissions() {
  return useQuery({
    queryKey: queryKeys.student.submissions,
    queryFn: () => studentService.getMySubmissions(),
  });
}

export function useStudentNotifications() {
  return useQuery({
    queryKey: queryKeys.student.notifications,
    queryFn: () => studentService.getNotifications(),
  });
}

export function useStudentPayments() {
  return useQuery({
    queryKey: queryKeys.student.payments,
    queryFn: () => studentService.getMyPayments(),
  });
}

export function useStudentProfile() {
  return useQuery({
    queryKey: queryKeys.student.profile,
    queryFn: () => studentService.getProfile(),
  });
}

export function useEnrollCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => studentService.enrollCourse(courseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.student.courses });
      void queryClient.invalidateQueries({ queryKey: queryKeys.student.dashboard });
    },
  });
}

export function useCancelEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => studentService.cancelEnrollment(courseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.student.courses });
      void queryClient.invalidateQueries({ queryKey: queryKeys.student.dashboard });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentService.markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.student.notifications });
      void queryClient.invalidateQueries({ queryKey: queryKeys.student.dashboard });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => studentService.markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.student.notifications });
      void queryClient.invalidateQueries({ queryKey: queryKeys.student.dashboard });
    },
  });
}

export function useUpdateStudentProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name?: string; email?: string; phone?: string; avatar?: string }) =>
      studentService.updateProfile(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.student.profile });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
    },
  });
}
