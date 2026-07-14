import { UserRole } from "@/enums";
import { mockUsers } from "@/data/mock/users.mock";
import { env } from "@/config";
import { clearAuthTokens, setAuthTokens } from "@/lib/auth-tokens";
import { roleHomeRoutes } from "@/constants";
import type { AuthPayload, BackendUser, User } from "@/types";
import { sleep } from "@/utils";
import { apiClient } from "./api-client";
import { mapBackendUser } from "./auth.mapper";

export type LoginInput = {
  phone: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  phone: string;
  password: string;
  role?: "STUDENT" | "TEACHER";
};

function persistSession(user: User, accessToken: string, refreshToken: string) {
  setAuthTokens({ accessToken, refreshToken }, user.role);
}

export const authService = {
  async login({ phone, password }: LoginInput): Promise<User> {
    if (env.useMockApi) {
      await sleep(400);
      const user = mockUsers.find((item) => item.phone === phone) ?? mockUsers[0];
      persistSession(user, "mock-access-token", "mock-refresh-token");
      return user;
    }

    const response = await apiClient.post<AuthPayload>(
      "/auth/login",
      { phone, password },
      { skipAuth: true }
    );

    const user = mapBackendUser(response.data.user);
    persistSession(user, response.data.accessToken, response.data.refreshToken);
    return user;
  },

  async register(data: RegisterInput): Promise<User> {
    if (env.useMockApi) {
      await sleep(500);
      const existing = mockUsers.find((item) => item.phone === data.phone);
      if (existing) {
        throw new Error("An account with this phone number already exists.");
      }

      const user: User = {
        id: `user-${Date.now()}`,
        phone: data.phone,
        name: data.name,
        role: UserRole.STUDENT,
        createdAt: new Date().toISOString(),
      };
      persistSession(user, "mock-access-token", "mock-refresh-token");
      return user;
    }

    const response = await apiClient.post<AuthPayload>(
      "/auth/register",
      {
        name: data.name,
        phone: data.phone,
        password: data.password,
        ...(data.role ? { role: data.role } : {}),
      },
      { skipAuth: true }
    );

    const user = mapBackendUser(response.data.user);
    persistSession(user, response.data.accessToken, response.data.refreshToken);
    return user;
  },

  async logout(): Promise<void> {
    try {
      if (!env.useMockApi) {
        await apiClient.post("/auth/logout");
      }
    } finally {
      clearAuthTokens();
    }
  },

  async getSession(): Promise<User | null> {
    if (env.useMockApi) {
      await sleep(200);
      return null;
    }

    try {
      const response = await apiClient.get<BackendUser>("/users/me");
      return mapBackendUser(response.data);
    } catch {
      clearAuthTokens();
      return null;
    }
  },
};

export { roleHomeRoutes };
