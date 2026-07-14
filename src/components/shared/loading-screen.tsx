"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/utils";

interface LoadingScreenProps {
  label?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({
  label = "Loading...",
  className,
  fullScreen = true,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground",
        fullScreen ? "min-h-screen bg-shell" : "min-h-[40vh] w-full py-16",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="font-medium">{label}</p>
    </div>
  );
}
