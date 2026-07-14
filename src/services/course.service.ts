import { mockCourses } from "@/data/mock/courses.mock";
import { env } from "@/config";
import { apiClient } from "./api-client";
import type { Course } from "@/types";
import { sleep } from "@/utils";

type CoursesListResponse = Course[] | { items: Course[] };

function unwrapCourses(data: CoursesListResponse): Course[] {
  return Array.isArray(data) ? data : (data.items ?? []);
}

export const courseService = {
  async getAll(): Promise<Course[]> {
    if (env.useMockApi) {
      await sleep(300);
      return mockCourses;
    }

    const response = await apiClient.get<CoursesListResponse>("/courses");
    return unwrapCourses(response.data);
  },

  async getBySlug(slug: string): Promise<Course | null> {
    if (env.useMockApi) {
      await sleep(300);
      return mockCourses.find((course) => course.slug === slug) ?? null;
    }

    const response = await apiClient.get<Course>(`/courses/slug/${slug}`);
    return response.data;
  },
};
