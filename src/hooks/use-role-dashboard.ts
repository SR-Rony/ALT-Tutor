"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { dashboardService } from "@/services";

export function useTeacherDashboard() {
  return useQuery({
    queryKey: queryKeys.teacher.dashboard,
    queryFn: () => dashboardService.getTeacherStats(),
  });
}
