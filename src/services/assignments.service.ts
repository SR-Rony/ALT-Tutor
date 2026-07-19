import type { StudentAssignment } from "@/types/student-dashboard.types";
import { apiClient } from "./api-client";

export const assignmentsService = {
  listMine(): Promise<StudentAssignment[]> {
    return apiClient.get<StudentAssignment[]>("/assignments/mine").then((r) => r.data ?? []);
  },

  findByCourse(courseId: string): Promise<StudentAssignment[]> {
    return apiClient
      .get<StudentAssignment[]>(`/assignments?courseId=${encodeURIComponent(courseId)}`)
      .then((r) => r.data ?? []);
  },

  getById(id: string): Promise<StudentAssignment> {
    return apiClient.get<StudentAssignment>(`/assignments/${id}`).then((r) => r.data);
  },
};
