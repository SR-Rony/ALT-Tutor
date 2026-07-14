import { mockCourses } from "@/data/mock/courses.mock";
import { env } from "@/config";
import { apiClient } from "./api-client";
import type { Course } from "@/types";
import { sleep } from "@/utils";

export const courseService = {
  async getAll(): Promise<Course[]> {
    if (env.useMockApi) {
      await sleep(300);
      return mockCourses;
    }

    const response = await apiClient.get<Course[]>("/courses");
    return response.data;
  },

  async getBySlug(slug: string): Promise<Course | null> {
    if (env.useMockApi) {
      await sleep(300);
      return mockCourses.find((course) => course.slug === slug) ?? null;
    }

    const response = await apiClient.get<Course>(`/courses/${slug}`);
    return response.data;
  },
};
