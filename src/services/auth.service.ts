import { UserRole } from "@/enums";
import { mockUsers } from "@/data/mock/users.mock";
import { env } from "@/config";
import { apiClient } from "./api-client";
import type { User } from "@/types";
import { sleep } from "@/utils";

export const authService = {
  async login(email: string, _password: string): Promise<User> {
    if (env.useMockApi) {
      await sleep(400);
      const user = mockUsers.find((item) => item.email === email) ?? mockUsers[0];
      return user;
    }

    const response = await apiClient.post<User>("/auth/login", { email, password: _password });
    return response.data;
  },

  async logout(): Promise<void> {
    if (env.useMockApi) {
      await sleep(200);
      return;
    }

    await apiClient.post("/auth/logout");
  },

  async getSession(): Promise<User | null> {
    if (env.useMockApi) {
      await sleep(200);
      return null;
    }

    const response = await apiClient.get<User>("/auth/session");
    return response.data;
  },
};

export const roleHomeRoutes: Record<UserRole, string> = {
  [UserRole.STUDENT]: "/student",
  [UserRole.TEACHER]: "/teacher",
  [UserRole.ADMIN]: "/admin",
};
