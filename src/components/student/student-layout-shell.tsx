"use client";

import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard";
import { studentFooterNav, studentNav } from "@/config";
import { queryKeys, ROUTES } from "@/constants";
import { useStudentNavBadges } from "@/hooks";
import type { NavItem } from "@/types";

const titles: Record<string, string> = {
  [ROUTES.student.root]: "Overview",
  [ROUTES.student.courses]: "My Courses",
  [ROUTES.student.notifications]: "Notifications",
  [ROUTES.student.payments]: "Payments",
  [ROUTES.student.settings]: "Settings",
};

function withBadges(items: NavItem[], badges: Partial<Record<string, number>>): NavItem[] {
  return items.map((item) => {
    const href = item.href ?? "";
    const badge = badges[href];
    return {
      ...item,
      ...(typeof badge === "number" && badge > 0 ? { badge } : { badge: undefined }),
    };
  });
}

export function StudentLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const headerTitle = titles[pathname] ?? "Student";
  const { data: badgeCounts } = useStudentNavBadges();

  useEffect(() => {
    if (pathname === ROUTES.student.notifications) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.student.navBadges });
    }
  }, [pathname, queryClient]);

  const navItems = useMemo(
    () =>
      withBadges(studentNav, {
        [ROUTES.student.notifications]: badgeCounts?.notifications ?? 0,
      }),
    [badgeCounts]
  );

  return (
    <DashboardShell
      navItems={navItems}
      footerNavItems={studentFooterNav}
      roleLabel="Student"
      headerTitle={headerTitle}
    >
      {children}
    </DashboardShell>
  );
}
