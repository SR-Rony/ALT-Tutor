"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard";
import { adminFooterNav, adminNav } from "@/config";
import { ROUTES } from "@/constants";
import { useAppSelector } from "@/store";

const adminPageTitles: Record<string, string> = {
  [ROUTES.admin.root]: "Dashboard",
  [ROUTES.admin.users]: "Users",
  [ROUTES.admin.courses]: "Courses",
  [ROUTES.admin.subjects]: "Subjects",
  [ROUTES.admin.categories]: "Categories",
  [ROUTES.admin.support]: "Support",
  [ROUTES.admin.example]: "Example Module",
  [ROUTES.admin.settings]: "Settings",
};

function getAdminPageTitle(pathname: string) {
  if (adminPageTitles[pathname]) return adminPageTitles[pathname];
  if (/^\/admin\/support\/[^/]+$/.test(pathname)) return "Support Ticket";
  return "Dashboard";
}

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const headerTitleOverride = useAppSelector((state) => state.ui.headerTitleOverride);

  return (
    <DashboardShell
      navItems={adminNav}
      footerNavItems={adminFooterNav}
      roleLabel="Admin"
      headerTitle={headerTitleOverride ?? getAdminPageTitle(pathname)}
    >
      {children}
    </DashboardShell>
  );
}
