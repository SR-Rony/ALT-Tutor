"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/shared";
import { env } from "@/config";
import { ROUTES, roleHomeRoutes } from "@/constants";
import { getAccessToken } from "@/lib/auth-tokens";
import { canAccessRoute } from "@/permissions/role.permissions";
import { authService } from "@/services/auth.service";
import { logout, setUser, useAppDispatch, useAppStore } from "@/store";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      setReady(false);

      if (env.useMockApi) {
        const current = store.getState().auth.user;
        if (!current) {
          router.replace(ROUTES.auth.login);
          return;
        }
        if (!canAccessRoute(current.role, pathname)) {
          router.replace(roleHomeRoutes[current.role]);
          return;
        }
        if (!cancelled) setReady(true);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        dispatch(logout());
        router.replace(ROUTES.auth.login);
        return;
      }

      const session = await authService.getSession();
      if (cancelled) return;

      if (!session) {
        dispatch(logout());
        router.replace(ROUTES.auth.login);
        return;
      }

      dispatch(setUser(session));

      if (!canAccessRoute(session.role, pathname)) {
        router.replace(roleHomeRoutes[session.role]);
        return;
      }

      setReady(true);
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [pathname, router, dispatch, store]);

  if (!ready) {
    return <LoadingScreen label="Loading your account..." />;
  }

  return <>{children}</>;
}
