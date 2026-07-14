import { DashboardShell } from "@/components/dashboard";
import { teacherFooterNav, teacherNav } from "@/config";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={teacherNav} footerNavItems={teacherFooterNav} roleLabel="Teacher" headerTitle="Teacher">
      {children}
    </DashboardShell>
  );
}
