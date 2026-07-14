"use client";

import { useAuthStore } from "@/store";
import { getInitials } from "@/utils";

interface DashboardHeaderProps {
  title?: string;
}

export function DashboardHeader({ title = "Dashboard" }: DashboardHeaderProps) {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <h1 className="text-base font-bold text-foreground sm:text-lg">{title}</h1>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
        {user ? getInitials(user.name) : "?"}
      </div>
    </header>
  );
}
