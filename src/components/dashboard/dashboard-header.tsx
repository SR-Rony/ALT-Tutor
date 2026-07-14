"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store";
import { getInitials } from "@/utils";

interface DashboardHeaderProps {
  title?: string;
}

export function DashboardHeader({ title = "Dashboard" }: DashboardHeaderProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.logout);

  async function handleLogout() {
    try {
      await authService.logout();
    } finally {
      clearUser();
      router.replace(ROUTES.auth.login);
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <h1 className="text-base font-bold text-foreground sm:text-lg">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-foreground">{user?.name ?? "Guest"}</p>
          <p className="text-xs text-muted-foreground">{user?.phone ?? user?.email}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {user ? getInitials(user.name) : "?"}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Log out"
          onClick={() => void handleLogout()}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
