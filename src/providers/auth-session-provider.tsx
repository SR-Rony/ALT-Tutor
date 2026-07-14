"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { env } from "@/config";
import { getAccessToken } from "@/lib/auth-tokens";
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

      if (session) dispatch(setUser(session));
      else dispatch(logout());

      setReady(true);
    }

    void syncSession();
    return () => {
      cancelled = true;
    };
  }, [dispatch, store]);

  // Mark ready once PersistGate has restored (user may already be set)
  useEffect(() => {
    if (user && !ready) {
      // Don't block forever if token sync still running — handled above
    }
  }, [user, ready]);

  const value = useMemo(() => ({ ready }), [ready]);

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}
