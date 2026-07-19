/** Role home prefixes used by middleware soft-gate. */
export const ROLE_PREFIXES: Record<string, string> = {
  student: "/student",
  teacher: "/teacher",
  admin: "/admin",
};

/** True when pathname is allowed for the session role. */
export function isPathAllowedForRole(role: string | undefined, pathname: string): boolean {
  if (!role) return false;
  const allowedPrefix = ROLE_PREFIXES[role];
  if (!allowedPrefix) return true;
  return pathname === allowedPrefix || pathname.startsWith(`${allowedPrefix}/`);
}
