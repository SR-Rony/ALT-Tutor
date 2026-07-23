"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/dashboard";
import { teacherFooterNav, teacherNav } from "@/config";
import { ROUTES } from "@/constants";

const titles: Record<string, string> = {
  [ROUTES.teacher.root]: "Overview",
  [ROUTES.teacher.courses]: "My Courses",
  [ROUTES.teacher.subjects]: "My Subjects",
  [ROUTES.teacher.practiceExams]: "Practice Exams",
  [ROUTES.teacher.keyConcepts]: "Key Concepts",
  [ROUTES.teacher.pastPapers]: "Past Papers",
  [ROUTES.teacher.assessments]: "Assessments",
  [ROUTES.teacher.gradingQueue]: "Grading",
  [ROUTES.teacher.gradebook]: "Gradebook",
  [ROUTES.teacher.settings]: "Settings",
};

function resolveTitle(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith(`${ROUTES.teacher.courses}/`)) return "Curriculum";
  return "Teacher";
}

export function TeacherLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const headerTitle = resolveTitle(pathname);

  return (
    <DashboardShell
      navItems={teacherNav}
      footerNavItems={teacherFooterNav}
      roleLabel="Teacher"
      headerTitle={headerTitle}
    >
      {children}
    </DashboardShell>
  );
}
