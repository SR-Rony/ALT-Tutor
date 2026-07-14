"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { env } from "@/config";
import { getAccessToken } from "@/lib/auth-tokens";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store";

type AuthSessionContextValue = {
  ready: boolean;
};

const AuthSessionContext = createContext<AuthSessionContextValue>({ ready: false });

export function useAuthSessionReady() {
  return useContext(AuthSessionContext).ready;
}

/**
 * Keeps auth store in sync with JWT across public + dashboard pages.
 * Logged-in users stay recognized on home/navbar until logout.
 */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function syncSession() {
      try {
        await useAuthStore.persist.rehydrate();
      } catch {
        // ignore rehydrate errors
      }
      if (cancelled) return;

      if (env.useMockApi) {
        setReady(true);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        if (useAuthStore.getState().user) logout();
        if (!cancelled) setReady(true);
        return;
      }

      const session = await authService.getSession();
      if (cancelled) return;

      if (session) setUser(session);
      else logout();

      setReady(true);
    }

    void syncSession();
    return () => {
      cancelled = true;
    };
  }, [setUser, logout]);

  const value = useMemo(() => ({ ready }), [ready]);

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}
