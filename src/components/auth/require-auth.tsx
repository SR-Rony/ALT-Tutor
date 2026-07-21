"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/shared";
import { env } from "@/config";
import { ROUTES, roleHomeRoutes } from "@/constants";
import { getAccessToken } from "@/lib/auth-tokens";
import { canAccessRoute } from "@/permissions/role.permissions";
import { authService } from "@/services/auth.service";
import { logout, setUser, useAppDispatch, useAppStore } from "@/store";
import type { UserRole } from "@/enums";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const [ready, setReady] = useState(false);
  // Full session verification happens once per mount; later route changes
  // only re-check role access against the cached user (no API call, no
  // full-screen loader), so switching dashboard tabs doesn't flash/reload.
  const verifiedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    function checkRoleAccess(role: UserRole) {
      if (!canAccessRoute(role, pathname)) {
        router.replace(roleHomeRoutes[role]);
        return false;
      }
      return true;
    }

    async function verify() {
      if (env.useMockApi) {
        const current = store.getState().auth.user;
        if (!current) {
          router.replace(ROUTES.auth.login);
          return;
        }
        if (!checkRoleAccess(current.role)) return;
        if (!cancelled) setReady(true);
        return;
      }

      if (verifiedRef.current) {
        const current = store.getState().auth.user;
        if (!current || !getAccessToken()) {
          dispatch(logout());
          router.replace(ROUTES.auth.login);
          return;
        }
        checkRoleAccess(current.role);
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
      verifiedRef.current = true;

      if (!checkRoleAccess(session.role)) return;

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
