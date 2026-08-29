"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { env } from "@/config";
import { roleHomeRoutes, ROUTES } from "@/constants";
import { hasUsableSession } from "@/lib/auth-tokens";
import { getSafeNextParam } from "@/lib/next-param";
import { useAuthSessionReady } from "@/providers/auth-session-provider";
import { useAppSelector } from "@/store";

/**
 * Only auto-leave the login page when a full session exists.
 * Never kick users off /register or /forgot-password — those must stay open
 * even if Redux still has a stale persisted user.
 */
export function GuestOnlyGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const ready = useAuthSessionReady();
  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    if (!ready) return;
    // Register / forgot-password must always be reachable for new accounts.
    if (pathname !== ROUTES.auth.login) return;
    if (!isAuthenticated || !user) return;
    if (!env.useMockApi && !hasUsableSession()) return;

    const next = getSafeNextParam(window.location.search);
    router.replace(next ?? roleHomeRoutes[user.role]);
  }, [ready, pathname, isAuthenticated, user, router]);

  return <>{children}</>;
}
