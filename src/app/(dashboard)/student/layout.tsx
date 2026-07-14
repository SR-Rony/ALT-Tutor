import { DashboardShell } from "@/components/dashboard";
import { studentNav } from "@/config";
import { PageHeader } from "@/components/shared";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={studentNav} roleLabel="Student" headerTitle="Student">
      {children}
    </DashboardShell>
  );
}
