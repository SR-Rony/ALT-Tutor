"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { env } from "@/config";
import { ROUTES } from "@/constants";
import { getAccessToken } from "@/lib/auth-tokens";
import { canAccessRoute } from "@/permissions/role.permissions";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.logout);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      setReady(false);

      if (env.useMockApi) {
        const current = useAuthStore.getState().user;
        if (!current) {
          router.replace(ROUTES.auth.login);
          return;
        }
        if (!canAccessRoute(current.role, pathname)) {
          router.replace(ROUTES.auth.login);
          return;
        }
        if (!cancelled) setReady(true);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        clearSession();
        router.replace(ROUTES.auth.login);
        return;
      }

      const session = await authService.getSession();
      if (cancelled) return;

      if (!session) {
        clearSession();
        router.replace(ROUTES.auth.login);
        return;
      }

      setUser(session);

      if (!canAccessRoute(session.role, pathname)) {
        router.replace(ROUTES.auth.login);
        return;
      }

      setReady(true);
    }

    void verify();
    return () => {
      cancelled = true;
    };
    // Intentionally omit `user` — session is loaded from API / store getState
  }, [pathname, router, setUser, clearSession]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-shell text-sm text-muted-foreground">
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}
