import { mockCourses } from "@/data/mock/courses.mock";
import { env } from "@/config";
import { apiClient } from "./api-client";
import type { Course } from "@/types";
import { sleep } from "@/utils";

type BackendCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  price: number | string;
  teacher?: { name?: string } | null;
  category?: { name?: string } | null;
  _count?: { enrollments?: number; reviews?: number };
  rating?: number;
};

type CoursesListResponse = BackendCourse[] | { items: BackendCourse[] };

function mapCourse(raw: BackendCourse): Course {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    description: raw.description,
    thumbnail: raw.thumbnail ?? "",
    instructorName: raw.teacher?.name ?? "Instructor",
    price: Number(raw.price) || 0,
    rating: Number(raw.rating) || 0,
    studentsCount: Number(raw._count?.enrollments) || 0,
    category: raw.category?.name ?? "General",
  };
}

function unwrapCourses(data: CoursesListResponse): Course[] {
  const items = Array.isArray(data) ? data : (data.items ?? []);
  return items.map(mapCourse);
}

export const courseService = {
  async getAll(): Promise<Course[]> {
    if (env.useMockApi) {
      await sleep(300);
      return mockCourses;
    }

    const response = await apiClient.get<CoursesListResponse>("/courses", { skipAuth: true });
    return unwrapCourses(response.data);
  },

  async getBySlug(slug: string): Promise<Course | null> {
    if (env.useMockApi) {
      await sleep(300);
      return mockCourses.find((course) => course.slug === slug) ?? null;
    }

    try {
      const response = await apiClient.get<BackendCourse>(`/courses/slug/${slug}`, { skipAuth: true });
      return mapCourse(response.data);
    } catch {
      return null;
    }
  },
};
