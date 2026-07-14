import { env } from "@/config";
import type { AdminCourse, CourseLevel } from "@/types/admin-dashboard.types";
import { sleep } from "@/utils";
import { apiClient } from "./api-client";
import type { CourseUpsertInput } from "./admin/admin-courses.service";

type MineResponse = {
  owned: AdminCourse[];
  delegated: AdminCourse[];
};

function normalizeCourse(raw: AdminCourse): AdminCourse {
  return {
    ...raw,
    category: raw.category ?? { id: raw.categoryId, name: "General", slug: "general" },
    teacher: raw.teacher ?? { id: raw.teacherId, name: "Instructor" },
    _count: raw._count ?? { enrollments: 0 },
  };
}

export const teacherCoursesService = {
  async getMine(): Promise<{ owned: AdminCourse[]; delegated: AdminCourse[]; all: AdminCourse[] }> {
    if (env.useMockApi) {
      await sleep(250);
      return { owned: [], delegated: [], all: [] };
    }
    const response = await apiClient.get<MineResponse>("/courses/mine");
    const owned = (response.data.owned ?? []).map(normalizeCourse);
    const delegated = (response.data.delegated ?? []).map(normalizeCourse);
    return { owned, delegated, all: [...owned, ...delegated] };
  },

  async create(payload: Omit<CourseUpsertInput, "teacherId">): Promise<AdminCourse> {
    if (env.useMockApi) {
      await sleep(250);
      throw { message: "Mock create not available", status: 501 };
    }
    const response = await apiClient.post<AdminCourse>("/courses", payload);
    return normalizeCourse(response.data);
  },

  async update(id: string, payload: Partial<Omit<CourseUpsertInput, "teacherId">>): Promise<AdminCourse> {
    if (env.useMockApi) {
      await sleep(250);
      throw { message: "Mock update not available", status: 501 };
    }
    const response = await apiClient.patch<AdminCourse>(`/courses/${id}`, payload);
    return normalizeCourse(response.data);
  },

  async remove(id: string): Promise<{ message: string }> {
    if (env.useMockApi) {
      await sleep(200);
      return { message: "Course deleted successfully" };
    }
    const response = await apiClient.delete<{ message: string }>(`/courses/${id}`);
    return response.data ?? { message: "Course deleted successfully" };
  },
};

export type { CourseLevel };
