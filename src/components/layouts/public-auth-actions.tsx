"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LayoutDashboard, LogOut, Settings, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { roleHomeRoutes, ROUTES } from "@/constants";
import { useAuthSessionReady } from "@/providers/auth-session-provider";
import { authService } from "@/services/auth.service";
import { logout, useAppDispatch, useAppSelector } from "@/store";
import { cn, getInitials } from "@/utils";

function settingsRouteForRole(role: string) {
  if (role === "admin") return ROUTES.admin.settings;
  if (role === "teacher") return ROUTES.teacher.settings;
  return ROUTES.student.settings;
}

interface PublicAuthActionsProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export function PublicAuthActions({ mobile = false, onNavigate }: PublicAuthActionsProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const ready = useAuthSessionReady();
  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  async function handleLogout() {
    onNavigate?.();
    setOpen(false);
    try {
      await authService.logout();
    } finally {
      dispatch(logout());
      router.replace(ROUTES.home);
      router.refresh();
    }
  }

  if (!ready) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-full bg-muted",
          mobile ? "h-11 w-full" : "hidden h-10 w-28 sm:block"
        )}
        aria-hidden
      />
    );
  }

  if (!isAuthenticated || !user) {
    if (mobile) {
      return (
        <div className="flex flex-col gap-2 pt-1">
          <Link
            href={ROUTES.auth.login}
            onClick={onNavigate}
            className="flex items-center justify-center rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#1D4ED8]"
          >
            Log in
          </Link>
          <Link
            href={ROUTES.auth.register}
            onClick={onNavigate}
            className="flex items-center justify-center rounded-xl bg-[#1D4ED8] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E40AF]"
          >
            Get Started
          </Link>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <Link
          href={ROUTES.auth.login}
          className="text-sm font-semibold text-slate-700 transition-colors hover:text-[#1D4ED8]"
        >
          Log in
        </Link>
        <Link
          href={ROUTES.auth.register}
          className="inline-flex items-center justify-center rounded-xl bg-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1E40AF]"
        >
          Get Started
        </Link>
      </div>
    );
  }

  const dashboardHref = roleHomeRoutes[user.role];
  const settingsHref = settingsRouteForRole(user.role);
  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);

  if (mobile) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {roleLabel} · {user.phone}
            </p>
          </div>
        </div>
        <Button asChild variant="default" size="pill" className="w-full">
          <Link href={dashboardHref} onClick={onNavigate}>
            Go to Dashboard
          </Link>
        </Button>
        <Button asChild variant="outline" size="pill" className="w-full">
          <Link href={settingsHref} onClick={onNavigate}>
            Settings
          </Link>
        </Button>
        <Button type="button" variant="outline" size="pill" className="w-full" onClick={() => void handleLogout()}>
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center">
      <div ref={ref} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 text-sm font-semibold text-slate-800 transition-colors",
            "hover:border-[#1D4ED8] hover:text-[#1D4ED8]",
            open && "border-[#1D4ED8] text-[#1D4ED8]"
          )}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-[#1D4ED8]">
            {getInitials(user.name)}
          </span>
          <span className="hidden max-w-[7rem] truncate md:inline">{user.name.split(" ")[0]}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        </button>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full z-[60] mt-2 w-56"
              role="menu"
            >
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-lg shadow-slate-200/50">
                <div className="border-b border-slate-100 px-3 pb-2.5 pt-1.5">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {roleLabel} · {user.phone}
                  </p>
                </div>
                <Link
                  href={dashboardHref}
                  role="menuitem"
                  className="mx-1.5 mt-1.5 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#1D4ED8]"
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4 text-[#1D4ED8]" />
                  Dashboard
                </Link>
                <Link
                  href={settingsHref}
                  role="menuitem"
                  className="mx-1.5 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#1D4ED8]"
                  onClick={() => setOpen(false)}
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  Settings
                </Link>
                <Link
                  href={ROUTES.courses}
                  role="menuitem"
                  className="mx-1.5 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-blue-50 hover:text-[#1D4ED8] sm:hidden"
                  onClick={() => setOpen(false)}
                >
                  <UserRound className="h-4 w-4 text-slate-500" />
                  Browse courses
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="mx-1.5 mb-1 flex w-[calc(100%-0.75rem)] items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600"
                  onClick={() => void handleLogout()}
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  Logout
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
