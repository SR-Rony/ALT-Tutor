import { env } from "@/config";
import { mockAdminUsers } from "@/data/mock/admin-dashboard.mock";
import type { AdminUser, BackendRole } from "@/types/admin-dashboard.types";
import { sleep } from "@/utils";
import { apiClient } from "../api-client";

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
};
