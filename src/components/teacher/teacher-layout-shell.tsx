"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard";
import { teacherFooterNav, teacherNav } from "@/config";
import { queryKeys, ROUTES } from "@/constants";
import { useTeacherNavBadges } from "@/hooks";
import { getNavSeenSnapshot, markNavSeen } from "@/lib/admin-nav-seen";
import type { NavItem } from "@/types";

const titles: Record<string, string> = {
  [ROUTES.teacher.root]: "Overview",
  [ROUTES.teacher.courses]: "My Courses",
  [ROUTES.teacher.subjects]: "My Subjects",
  [ROUTES.teacher.practiceExams]: "Practice Exams",
  [ROUTES.teacher.keyConcepts]: "Key Concepts",
  [ROUTES.teacher.pastPapers]: "Past Papers",
  [ROUTES.teacher.settings]: "Settings",
};

function resolveTitle(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith(`${ROUTES.teacher.courses}/`)) return "Curriculum";
  return "Teacher";
}

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

export function TeacherLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const headerTitle = resolveTitle(pathname);
  const [seen, setSeen] = useState(() => getNavSeenSnapshot("teacher"));

  const { data: badgeCounts } = useTeacherNavBadges({
    enrollmentsSince: seen.enrollments,
  });

  useEffect(() => {
    if (
      pathname === ROUTES.teacher.courses ||
      pathname.startsWith(`${ROUTES.teacher.courses}/`)
    ) {
      markNavSeen("teacher", "enrollments");
      setSeen(getNavSeenSnapshot("teacher"));
      void queryClient.invalidateQueries({ queryKey: queryKeys.teacher.navBadges });
    }
  }, [pathname, queryClient]);

  const navItems = useMemo(
    () =>
      withBadges(teacherNav, {
        [ROUTES.teacher.courses]: badgeCounts?.enrollments ?? 0,
      }),
    [badgeCounts]
  );

  return (
    <DashboardShell
      navItems={navItems}
      footerNavItems={teacherFooterNav}
      roleLabel="Teacher"
      headerTitle={headerTitle}
    >
      {children}
    </DashboardShell>
  );
}
