"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard";
import { studentFooterNav, studentNav } from "@/config";
import { ROUTES } from "@/constants";

const titles: Record<string, string> = {
  [ROUTES.student.root]: "Overview",
  [ROUTES.student.courses]: "My Courses",
  [ROUTES.student.assignments]: "Assignments",
  [ROUTES.student.notifications]: "Notifications",
  [ROUTES.student.payments]: "Payments",
  [ROUTES.student.settings]: "Settings",
};

export function StudentLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const headerTitle = titles[pathname] ?? "Student";

  return (
    <DashboardShell
      navItems={studentNav}
      footerNavItems={studentFooterNav}
      roleLabel="Student"
      headerTitle={headerTitle}
    >
      {children}
    </DashboardShell>
  );
}
