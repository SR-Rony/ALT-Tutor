import { UserRole } from "@/enums";
import { ROUTES } from "@/constants";

export const roleRoutePrefixes: Record<UserRole, string> = {
  [UserRole.STUDENT]: ROUTES.student.root,
  [UserRole.TEACHER]: ROUTES.teacher.root,
  [UserRole.ADMIN]: ROUTES.admin.root,
};

export function canAccessRoute(role: UserRole, pathname: string) {
  const prefix = roleRoutePrefixes[role];
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
