import { PageHeader } from "@/components/shared";
import { EmptyState } from "@/components/shared";

export default function TeacherDashboardPage() {
  return (
    <>
      <PageHeader title="Teacher Dashboard" description="Courses, students, analytics, and live classes." />
      <EmptyState title="Course builder" description="Add course creation wizard in components/teacher/." />
    </>
  );
}
