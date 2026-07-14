"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/utils";

interface PageLoaderProps {
  label?: string;
  className?: string;
}

/** Inline loading state for dashboard pages while API data loads. */
export function PageLoader({ label = "Loading data...", className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-6 py-12 text-sm text-muted-foreground shadow-[0_8px_30px_rgba(15,23,42,0.04)]",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
      <p className="font-medium">{label}</p>
    </div>
  );
}
