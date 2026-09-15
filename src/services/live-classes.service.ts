import { apiClient } from "./api-client";
import type {
  CreateLiveClassInput,
  LiveClass,
  LiveClassAttendanceResponse,
  LiveClassJoinResult,
  StaffLiveClassQuery,
  StudentLiveClass,
  UpdateLiveClassInput,
} from "@/types/live-class.types";

function staffQueryString(query?: StaffLiveClassQuery) {
  if (!query) return "";
  const params = new URLSearchParams();
  if (query.courseId) params.set("courseId", query.courseId);
  if (query.status) params.set("status", query.status);
  if (query.q?.trim()) params.set("q", query.q.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const liveClassesService = {
  async listMine(): Promise<StudentLiveClass[]> {
    const response = await apiClient.get<StudentLiveClass[]>("/live-classes/mine");
    return response.data;
  },

  async staffList(query?: StaffLiveClassQuery): Promise<LiveClass[]> {
    const response = await apiClient.get<LiveClass[]>(
      `/live-classes/staff${staffQueryString(query)}`
    );
    return response.data;
  },

  async listForCourse(courseId: string): Promise<LiveClass[]> {
    const response = await apiClient.get<LiveClass[]>(
      `/live-classes/course/${encodeURIComponent(courseId)}`
    );
    return response.data;
  },

  async create(payload: CreateLiveClassInput): Promise<LiveClass> {
    const response = await apiClient.post<LiveClass>("/live-classes", payload);
    return response.data;
  },

  async update(id: string, payload: UpdateLiveClassInput): Promise<LiveClass> {
    const response = await apiClient.patch<LiveClass>(`/live-classes/${id}`, payload);
    return response.data;
  },

  async remove(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/live-classes/${id}`);
    return response.data;
  },

  async goLive(id: string): Promise<LiveClass> {
    const response = await apiClient.post<LiveClass>(`/live-classes/${id}/go-live`);
    return response.data;
  },

  async end(id: string): Promise<LiveClass> {
    const response = await apiClient.post<LiveClass>(`/live-classes/${id}/end`);
    return response.data;
  },

  async join(id: string): Promise<LiveClassJoinResult> {
    const response = await apiClient.post<LiveClassJoinResult>(`/live-classes/${id}/join`);
    return response.data;
  },

  async attendance(id: string): Promise<LiveClassAttendanceResponse> {
    const response = await apiClient.get<LiveClassAttendanceResponse>(
      `/live-classes/${id}/attendance`
    );
    return response.data;
  },
};
