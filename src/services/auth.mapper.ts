import { UserRole } from "@/enums";
import type { BackendUser, User } from "@/types";

const ROLE_MAP: Record<string, UserRole> = {
  STUDENT: UserRole.STUDENT,
  TEACHER: UserRole.TEACHER,
  ADMIN: UserRole.ADMIN,
  student: UserRole.STUDENT,
  teacher: UserRole.TEACHER,
  admin: UserRole.ADMIN,
};

export function mapBackendUser(user: BackendUser): User {
  const role = ROLE_MAP[user.role] ?? UserRole.STUDENT;

  return {
    id: user.id,
    name: user.name,
    email: user.email ?? undefined,
    phone: user.phone,
    avatar: user.avatar ?? undefined,
    role,
    createdAt:
      typeof user.createdAt === "string"
        ? user.createdAt
        : new Date(user.createdAt).toISOString(),
  };
}

export function normalizeApiMessage(message: unknown): string {
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.filter(Boolean).join(", ");
  return "Request failed";
}
