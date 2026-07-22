import { UserRole } from "@/enums";
import { mockUsers } from "@/data/mock/users.mock";
import { env } from "@/config";
import { clearAuthTokens, setAuthTokens } from "@/lib/auth-tokens";
import { roleHomeRoutes } from "@/constants";
import type { AuthPayload, BackendUser, User } from "@/types";
import { sleep } from "@/utils";
import { normalizeBdPhoneClient } from "@/validations";
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
  otp: string;
  role?: "STUDENT" | "TEACHER";
};

export type OtpPurpose = "REGISTER" | "FORGOT_PASSWORD";

export type SendOtpInput = {
  phone: string;
  purpose: OtpPurpose;
};

export type ResetPasswordInput = {
  phone: string;
  otp: string;
  newPassword: string;
};

function persistSession(user: User, accessToken: string, refreshToken: string) {
  setAuthTokens({ accessToken, refreshToken }, user.role);
}

export const authService = {
  async sendOtp({ phone, purpose }: SendOtpInput): Promise<{ message: string; expiresInSeconds: number }> {
    const normalized = normalizeBdPhoneClient(phone);

    if (env.useMockApi) {
      await sleep(300);
      const code = "123456";
      // eslint-disable-next-line no-console
      console.log(`\n>>> MOCK DEV OTP for ${normalized} (${purpose}): ${code}\n`);
      return {
        message: "OTP generated (mock). Check the browser console.",
        expiresInSeconds: 600,
      };
    }

    const response = await apiClient.post<{ message: string; expiresInSeconds: number }>(
      "/auth/otp/send",
      { phone: normalized, purpose },
      { skipAuth: true }
    );
    return response.data;
  },

  async forgotPassword(phone: string): Promise<{ message: string; expiresInSeconds: number }> {
    const normalized = normalizeBdPhoneClient(phone);

    if (env.useMockApi) {
      return this.sendOtp({ phone: normalized, purpose: "FORGOT_PASSWORD" });
    }

    const response = await apiClient.post<{ message: string; expiresInSeconds: number }>(
      "/auth/forgot-password",
      { phone: normalized },
      { skipAuth: true }
    );
    return response.data;
  },

  async resetPassword(data: ResetPasswordInput): Promise<{ message: string }> {
    const phone = normalizeBdPhoneClient(data.phone);

    if (env.useMockApi) {
      await sleep(400);
      if (data.otp !== "123456") {
        throw { message: "Invalid OTP. Please check the code and try again.", status: 400 };
      }
      return { message: "Password updated successfully. You can sign in with your new password." };
    }

    const response = await apiClient.post<{ message: string }>(
      "/auth/reset-password",
      {
        phone,
        otp: data.otp,
        newPassword: data.newPassword,
      },
      { skipAuth: true }
    );
    return response.data;
  },

  async login({ phone, password }: LoginInput): Promise<User> {
    const normalized = normalizeBdPhoneClient(phone);

    if (env.useMockApi) {
      await sleep(400);
      const user = mockUsers.find((item) => item.phone === normalized) ?? mockUsers[0];
      persistSession(user, "mock-access-token", "mock-refresh-token");
      return user;
    }

    const response = await apiClient.post<AuthPayload>(
      "/auth/login",
      { phone: normalized, password },
      { skipAuth: true }
    );

    const user = mapBackendUser(response.data.user);
    persistSession(user, response.data.accessToken, response.data.refreshToken);
    return user;
  },

  async register(data: RegisterInput): Promise<User> {
    const phone = normalizeBdPhoneClient(data.phone);

    if (env.useMockApi) {
      await sleep(500);
      if (data.otp !== "123456") {
        throw { message: "Invalid OTP. Please check the code and try again.", status: 400 };
      }
      const existing = mockUsers.find((item) => item.phone === phone);
      if (existing) {
        throw { message: "An account with this phone number already exists.", status: 409 };
      }

      const user: User = {
        id: `user-${Date.now()}`,
        phone,
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
        phone,
        password: data.password,
        otp: data.otp,
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
