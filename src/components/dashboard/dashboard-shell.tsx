"use client";

import type { NavItem } from "@/types";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";

interface DashboardShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  footerNavItems?: NavItem[];
  roleLabel: string;
  headerTitle?: string;
}

export function DashboardShell({
  children,
  navItems,
  footerNavItems,
  roleLabel,
  headerTitle,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-shell">
      <div className="flex min-h-screen">
        <DashboardSidebar items={navItems} footerItems={footerNavItems} roleLabel={roleLabel} />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader title={headerTitle} />
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
