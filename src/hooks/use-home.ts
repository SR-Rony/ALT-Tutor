"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { categoryService, homeService } from "@/services/home.service";

export function useHomeData() {
  return useQuery({
    queryKey: queryKeys.home.all,
    queryFn: () => homeService.getHomeData(),
    staleTime: 60_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.home.categories,
    queryFn: () => categoryService.getAll(),
    staleTime: 60_000,
  });
}
