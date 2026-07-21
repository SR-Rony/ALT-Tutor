import { TeacherLayoutShell } from "@/components/teacher/teacher-layout-shell";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <TeacherLayoutShell>{children}</TeacherLayoutShell>;
}
