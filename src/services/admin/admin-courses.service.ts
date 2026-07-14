import { env } from "@/config";
import { mockAdminCourses } from "@/data/mock/admin-dashboard.mock";
import type { AdminCourse, CourseStatus } from "@/types/admin-dashboard.types";
import { sleep } from "@/utils";
import { apiClient } from "../api-client";

export const adminCoursesService = {
  async getAll(): Promise<AdminCourse[]> {
    if (env.useMockApi) {
      await sleep(250);
      return mockAdminCourses;
    }

    const response = await apiClient.get<AdminCourse[]>("/courses/admin/all");
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
};
