"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { supportManagementService } from "@/services/admin/admin-support-management.service";

export function useAdminSupportContacts() {
  return useQuery({
    queryKey: queryKeys.admin.support,
    queryFn: () => supportManagementService.getContacts(),
    staleTime: 30_000,
  });
}
