"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { env } from "@/config";
import {
  ensureSessionCookie,
  getAccessToken,
  getRefreshToken,
  hasSessionCookie,
} from "@/lib/auth-tokens";
import { authService } from "@/services/auth.service";
import { logout, setUser, useAppDispatch, useAppSelector, useAppStore } from "@/store";

type AuthSessionContextValue = {
  ready: boolean;
};

const AuthSessionContext = createContext<AuthSessionContextValue>({ ready: false });

export function useAuthSessionReady() {
  return useContext(AuthSessionContext).ready;
}

/**
 * Keeps Redux auth slice in sync with JWT across public + dashboard pages.
 * Clears stale persisted users and restores the middleware session cookie when needed.
 */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const user = useAppSelector((s) => s.auth.user);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function syncSession() {
      if (env.useMockApi) {
        // Mock mode still needs a cookie for /admin middleware, or a clean guest state.
        const token = getAccessToken();
        const current = store.getState().auth.user;
        if (token && current) {
          ensureSessionCookie(current.role);
        } else if (current && !token) {
          dispatch(logout());
        }
        if (!cancelled) setReady(true);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        if (store.getState().auth.user) dispatch(logout());
        if (!cancelled) setReady(true);
        return;
      }

      const session = await authService.getSession();
      if (cancelled) return;

      if (session) {
        dispatch(setUser(session));
        // Token can outlive the cookie after hard refresh / partial clears.
        if (!hasSessionCookie() || getRefreshToken()) {
          ensureSessionCookie(session.role);
        }
      } else {
        dispatch(logout());
      }

      setReady(true);
    }

    void syncSession();
    return () => {
      cancelled = true;
    };
  }, [dispatch, store]);

  // PersistGate may restore a user AFTER the first sync ran with empty state.
  useEffect(() => {
    if (!user) return;
    if (getAccessToken()) {
      if (!hasSessionCookie()) ensureSessionCookie(user.role);
      return;
    }
    dispatch(logout());
  }, [user, dispatch]);

  const value = useMemo(() => ({ ready }), [ready]);

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}
