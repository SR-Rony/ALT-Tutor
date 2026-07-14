import { UserRole } from "@/enums";
import type { User } from "@/types";

export const mockUsers: User[] = [
  {
    id: "user-student-1",
    email: "student@example.com",
    name: "Alex Student",
    role: UserRole.STUDENT,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex%20Student",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "user-teacher-1",
    email: "teacher@example.com",
    name: "Taylor Teacher",
    role: UserRole.TEACHER,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Taylor%20Teacher",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "user-admin-1",
    email: "admin@example.com",
    name: "Admin User",
    role: UserRole.ADMIN,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Admin%20User",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];
