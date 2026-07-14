"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { roleHomeRoutes, ROUTES } from "@/constants";
import { useAuthSessionReady } from "@/providers/auth-session-provider";
import { useAppSelector } from "@/store";

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
  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    if (!ready) return;
    if (!guestOnlyPaths.includes(pathname)) return;
    if (isAuthenticated && user) {
      router.replace(roleHomeRoutes[user.role]);
    }
  }, [ready, pathname, isAuthenticated, user, router]);

  return <>{children}</>;
}
