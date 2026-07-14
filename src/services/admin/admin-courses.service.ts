import { env } from "@/config";
import { mockAdminCourses } from "@/data/mock/admin-dashboard.mock";
import type { AdminCourse, CourseLevel, CourseStatus } from "@/types/admin-dashboard.types";
import { sleep } from "@/utils";
import { apiClient } from "../api-client";

export type CourseUpsertInput = {
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  price?: number;
  level?: CourseLevel;
  categoryId: string;
  teacherId?: string;
};

export const adminCoursesService = {
  async getAll(): Promise<AdminCourse[]> {
    if (env.useMockApi) {
      await sleep(250);
      return mockAdminCourses;
    }

    const response = await apiClient.get<AdminCourse[]>("/courses/admin/all");
    return response.data;
  },

  async create(payload: CourseUpsertInput): Promise<AdminCourse> {
    if (env.useMockApi) {
      await sleep(250);
      const created: AdminCourse = {
        id: `course-${Date.now()}`,
        title: payload.title,
        slug: payload.slug,
        description: payload.description,
        thumbnail: payload.thumbnail ?? null,
        price: payload.price ?? 0,
        level: payload.level ?? "BEGINNER",
        status: "DRAFT",
        teacherId: payload.teacherId ?? "teacher-1",
        categoryId: payload.categoryId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        teacher: { id: payload.teacherId ?? "teacher-1", name: "Mock Teacher" },
        category: { id: payload.categoryId, name: "Category", slug: "category" },
        _count: { enrollments: 0 },
      };
      mockAdminCourses.unshift(created);
      return created;
    }

    const response = await apiClient.post<AdminCourse>("/courses", payload);
    return response.data;
  },

  async update(id: string, payload: Partial<CourseUpsertInput>): Promise<AdminCourse> {
    if (env.useMockApi) {
      await sleep(250);
      const course = mockAdminCourses.find((c) => c.id === id);
      if (!course) throw { message: "Course not found", status: 404 };
      Object.assign(course, payload, { updatedAt: new Date().toISOString() });
      return { ...course };
    }

    const response = await apiClient.patch<AdminCourse>(`/courses/${id}`, payload);
    return response.data;
  },

  async updateStatus(id: string, status: CourseStatus): Promise<AdminCourse> {
    if (env.useMockApi) {
      await sleep(200);
      const course = mockAdminCourses.find((c) => c.id === id);
      if (!course) throw { message: "Course not found", status: 404 };
      course.status = status;
      return { ...course };
    }

    const response = await apiClient.patch<AdminCourse>(`/courses/${id}/status`, { status });
    return response.data;
  },

  async remove(id: string): Promise<{ message: string }> {
    if (env.useMockApi) {
      await sleep(200);
      const index = mockAdminCourses.findIndex((c) => c.id === id);
      if (index < 0) throw { message: "Course not found", status: 404 };
      mockAdminCourses.splice(index, 1);
      return { message: "Course deleted successfully" };
    }

    const response = await apiClient.delete<{ message: string }>(`/courses/${id}`);
    return response.data ?? { message: "Course deleted successfully" };
  },
};
