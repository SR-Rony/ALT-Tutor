"use client";

import type { ReactNode } from "react";
import { ReduxProvider } from "@/store";
import { AuthSessionProvider } from "./auth-session-provider";
import { QueryProvider } from "./query-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider>
      <QueryProvider>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </QueryProvider>
    </ReduxProvider>
  );
}
