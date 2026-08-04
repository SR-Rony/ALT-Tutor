"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard";
import { adminFooterNav, adminNav } from "@/config";
import { queryKeys, ROUTES } from "@/constants";
import { useAdminNavBadges } from "@/hooks";
import {
  getAdminNavSeenSnapshot,
  markAdminNavSeen,
  type AdminNavSeenKey,
} from "@/lib/admin-nav-seen";
import { useAppSelector } from "@/store";
import type { NavItem } from "@/types";

const adminPageTitles: Record<string, string> = {
  [ROUTES.admin.root]: "Dashboard",
  [ROUTES.admin.users]: "Users",
  [ROUTES.admin.teachers]: "Teachers",
  [ROUTES.admin.courses]: "Courses",
  [ROUTES.admin.enrollments]: "Enrollments",
  [ROUTES.admin.reviews]: "Reviews",
  [ROUTES.admin.questionbank]: "Questionbank",
  [ROUTES.admin.categories]: "Categories",
  [ROUTES.admin.qbSubjects]: "Subjects",
  [ROUTES.admin.qbPrograms]: "QB Programs",
  [ROUTES.admin.practiceExams]: "Practice Exams",
  [ROUTES.admin.keyConcepts]: "Key Concepts",
  [ROUTES.admin.pastPapers]: "Past Papers",
  [ROUTES.admin.subjects]: "Subjects",
  [ROUTES.admin.examsMcq]: "MCQ Exams",
  [ROUTES.admin.examsWritten]: "Written Exams",
  [ROUTES.admin.mcqExams]: "MCQ Exams",
  [ROUTES.admin.accessProducts]: "Pass Pricing",
  [ROUTES.admin.gradebook]: "Gradebook",
  [ROUTES.admin.gradingQueue]: "Grading",
  [ROUTES.admin.practiceExamMarking]: "Written Marking",
  [ROUTES.admin.support]: "Support",
  [ROUTES.admin.settings]: "Settings",
};

function getAdminPageTitle(pathname: string) {
  if (adminPageTitles[pathname]) return adminPageTitles[pathname];
  if (/^\/admin\/support\/[^/]+$/.test(pathname)) return "Support Ticket";
  return "Dashboard";
}

function withBadges(
  items: NavItem[],
  badges: Partial<Record<string, number>>
): NavItem[] {
  return items.map((item) => {
    const href = item.href ?? "";
    const badge = badges[href];
    const children = item.children ? withBadges(item.children, badges) : undefined;
    return {
      ...item,
      ...(typeof badge === "number" && badge > 0 ? { badge } : { badge: undefined }),
      ...(children ? { children } : {}),
    };
  });
}

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const headerTitleOverride = useAppSelector((state) => state.ui.headerTitleOverride);
  const [seen, setSeen] = useState(() => getAdminNavSeenSnapshot());

  const { data: badgeCounts } = useAdminNavBadges({
    usersSince: seen.users,
    enrollmentsSince: seen.enrollments,
  });

  useEffect(() => {
    const markIfNeeded = (key: AdminNavSeenKey, match: (path: string) => boolean) => {
      if (!match(pathname)) return;
      markAdminNavSeen(key);
      setSeen(getAdminNavSeenSnapshot());
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.navBadges });
    };

    markIfNeeded("users", (path) => path === ROUTES.admin.users || path.startsWith(`${ROUTES.admin.users}/`));
    markIfNeeded(
      "enrollments",
      (path) => path === ROUTES.admin.enrollments || path.startsWith(`${ROUTES.admin.enrollments}/`)
    );
  }, [pathname, queryClient]);

  const navItems = useMemo(() => {
    const badges: Partial<Record<string, number>> = {
      [ROUTES.admin.users]: badgeCounts?.users ?? 0,
      [ROUTES.admin.enrollments]: badgeCounts?.enrollments ?? 0,
      [ROUTES.admin.reviews]: badgeCounts?.reviews ?? 0,
      [ROUTES.admin.practiceExamMarking]: badgeCounts?.writtenMarking ?? 0,
    };
    return withBadges(adminNav, badges);
  }, [badgeCounts]);

  return (
    <DashboardShell
      navItems={navItems}
      footerNavItems={adminFooterNav}
      roleLabel="Admin"
      headerTitle={headerTitleOverride ?? getAdminPageTitle(pathname)}
    >
      {children}
    </DashboardShell>
  );
}
