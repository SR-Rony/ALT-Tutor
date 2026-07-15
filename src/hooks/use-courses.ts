import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { courseService } from "@/services";
import type { CoursesQuery } from "@/types/course.types";

export function useCourses() {
  return useQuery({
    queryKey: queryKeys.courses.all,
    queryFn: () => courseService.getAll(),
  });
}

export function useCoursesCatalog(query: CoursesQuery = {}) {
  return useQuery({
    queryKey: queryKeys.courses.catalog(query),
    queryFn: () => courseService.getCatalog(query),
    placeholderData: (previous) => previous,
  });
}

export function useCourseDetail(slug: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.courses.detail(slug),
    queryFn: () => courseService.getBySlug(slug),
    enabled: Boolean(slug) && enabled,
  });
}
