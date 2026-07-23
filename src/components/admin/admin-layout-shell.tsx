"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard";
import { adminFooterNav, adminNav } from "@/config";
import { ROUTES } from "@/constants";
import { useAppSelector } from "@/store";

const adminPageTitles: Record<string, string> = {
  [ROUTES.admin.root]: "Dashboard",
  [ROUTES.admin.users]: "Users",
  [ROUTES.admin.teachers]: "Teachers",
  [ROUTES.admin.courses]: "Courses",
  [ROUTES.admin.enrollments]: "Enrollments",
  [ROUTES.admin.reviews]: "Reviews",
  [ROUTES.admin.questionbank]: "Questions",
  [ROUTES.admin.qbCategories]: "QB Categories",
  [ROUTES.admin.qbSubjects]: "QB Subjects",
  [ROUTES.admin.qbPrograms]: "QB Programs",
  [ROUTES.admin.practiceExams]: "Practice Exams",
  [ROUTES.admin.keyConcepts]: "Key Concepts",
  [ROUTES.admin.subjects]: "Subjects",
  [ROUTES.admin.examsMcq]: "MCQ Exams",
  [ROUTES.admin.examsWritten]: "Written Exams",
  [ROUTES.admin.mcqExams]: "MCQ Exams",
  [ROUTES.admin.accessProducts]: "Access Products",
  [ROUTES.admin.gradebook]: "Gradebook",
  [ROUTES.admin.gradingQueue]: "Grading",
  [ROUTES.admin.categories]: "Categories",
  [ROUTES.admin.support]: "Support",
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
