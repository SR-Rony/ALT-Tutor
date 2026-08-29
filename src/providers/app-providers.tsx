"use client";

import type { ReactNode } from "react";
import { ChunkLoadRecovery } from "@/components/shared/chunk-load-recovery";
import { ReduxProvider } from "@/store";
import { AuthSessionProvider } from "./auth-session-provider";
import { QueryProvider } from "./query-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider>
      <QueryProvider>
        <AuthSessionProvider>
          <ChunkLoadRecovery />
          {children}
        </AuthSessionProvider>
      </QueryProvider>
    </ReduxProvider>
  );
}
