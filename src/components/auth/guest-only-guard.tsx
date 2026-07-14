"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { roleHomeRoutes, ROUTES } from "@/constants";
import { useAuthSessionReady } from "@/providers/auth-session-provider";
import { useAuthStore } from "@/store";

const guestOnlyPaths: string[] = [
  ROUTES.auth.login,
  ROUTES.auth.register,
  ROUTES.auth.forgotPassword,
];

/** Redirects authenticated users away from login/register. */
export function GuestOnlyGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const ready = useAuthSessionReady();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!ready) return;
    if (!guestOnlyPaths.includes(pathname)) return;
    if (isAuthenticated && user) {
      router.replace(roleHomeRoutes[user.role]);
    }
  }, [ready, pathname, isAuthenticated, user, router]);

  return <>{children}</>;
}
