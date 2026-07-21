import { Suspense } from "react";
import { PageLoader } from "@/components/shared";
import { TeacherGradebookPage } from "@/components/teacher/teacher-gradebook-page";

export default function TeacherGradebookRoute() {
  return (
    <Suspense fallback={<PageLoader label="Loading gradebook..." />}>
      <TeacherGradebookPage />
    </Suspense>
  );
}
