"use client";

import { useRouter } from "next/navigation";
import { LogOut, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ROUTES } from "@/constants";
import { authService } from "@/services/auth.service";
import { useAuthStore, useUIStore } from "@/store";
import { getInitials } from "@/utils";

interface DashboardHeaderProps {
  title?: string;
}

export function DashboardHeader({ title = "Dashboard" }: DashboardHeaderProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.logout);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const setMobileSidebarOpen = useUIStore((state) => state.setMobileSidebarOpen);
  const mobileSidebarOpen = useUIStore((state) => state.mobileSidebarOpen);

  async function handleLogout() {
    try {
      await authService.logout();
    } finally {
      clearUser();
      router.replace(ROUTES.auth.login);
    }
  }

  function handleToggle() {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileSidebarOpen(!mobileSidebarOpen);
      return;
    }
    toggleSidebar();
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Toggle sidebar"
        onClick={handleToggle}
        className="shrink-0"
      >
        <PanelLeft className="h-5 w-5" />
      </Button>
      <Separator orientation="vertical" className="hidden h-6 sm:block" />
      <h1 className="min-w-0 flex-1 truncate text-base font-bold text-foreground sm:text-lg">{title}</h1>
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
