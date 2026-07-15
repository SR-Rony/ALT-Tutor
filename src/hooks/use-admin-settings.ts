"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { adminSettingsService } from "@/services";
import type { PlatformSettingsInput } from "@/types/settings.types";

export function useAdminSettings() {
  return useQuery({
    queryKey: queryKeys.admin.settings,
    queryFn: () => adminSettingsService.get(),
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PlatformSettingsInput) => adminSettingsService.update(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.admin.settings, data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.settings });
    },
  });
}
