import { env } from "@/config";
import { mockAdminUsers } from "@/data/mock/admin-dashboard.mock";
import type { AdminUser, BackendRole } from "@/types/admin-dashboard.types";
import { sleep } from "@/utils";
import { apiClient } from "../api-client";

export type TeacherInput = {
  name?: string;
  phone?: string;
  address?: string;
  email?: string | null;
  password?: string;
  avatar?: string | null;
  isActive?: boolean;
};

export const adminUsersService = {
  async getUsers(role?: BackendRole): Promise<AdminUser[]> {
    if (env.useMockApi) {
      await sleep(250);
      return role ? mockAdminUsers.filter((u) => u.role === role) : mockAdminUsers;
    }

    const query = role ? `?role=${role}` : "";
    const response = await apiClient.get<AdminUser[]>(`/users${query}`);
    return response.data;
  },

  async getUser(id: string): Promise<AdminUser> {
    if (env.useMockApi) {
      await sleep(200);
      const user = mockAdminUsers.find((u) => u.id === id);
      if (!user) throw { message: "User not found", status: 404 };
      return { ...user };
    }

    const response = await apiClient.get<AdminUser>(`/users/${id}`);
    return response.data;
  },

  async createTeacher(
    payload: TeacherInput & { name: string; phone: string; address: string; password: string }
  ): Promise<AdminUser> {
    const response = await apiClient.post<AdminUser>("/users/teachers", payload);
    return response.data;
  },

  async updateTeacher(id: string, payload: TeacherInput): Promise<AdminUser> {
    const response = await apiClient.patch<AdminUser>(`/users/teachers/${id}`, payload);
    return response.data;
  },

  async updateStatus(id: string, isActive: boolean): Promise<AdminUser> {
    if (env.useMockApi) {
      await sleep(200);
      const user = mockAdminUsers.find((u) => u.id === id);
      if (!user) throw { message: "User not found", status: 404 };
      user.isActive = isActive;
      return { ...user };
    }

    const response = await apiClient.patch<AdminUser>(`/users/${id}/status`, { isActive });
    return response.data;
  },

  async updateRole(id: string, role: BackendRole): Promise<AdminUser> {
    if (env.useMockApi) {
      await sleep(200);
      const user = mockAdminUsers.find((u) => u.id === id);
      if (!user) throw { message: "User not found", status: 404 };
      user.role = role;
      return { ...user };
    }

    const response = await apiClient.patch<AdminUser>(`/users/${id}/role`, { role });
    return response.data;
  },

  async remove(id: string): Promise<{ message: string }> {
    if (env.useMockApi) {
      await sleep(200);
      const index = mockAdminUsers.findIndex((u) => u.id === id);
      if (index < 0) throw { message: "User not found", status: 404 };
      mockAdminUsers.splice(index, 1);
      return { message: "User deleted successfully" };
    }

    const response = await apiClient.delete<{ message: string }>(`/users/${id}`);
    return response.data ?? { message: "User deleted successfully" };
  },
};
