import { Suspense } from "react";
import { PageLoader } from "@/components/shared";
import { TeacherAssessmentsPage } from "@/components/teacher/teacher-assessments-page";

export default function TeacherAssessmentsRoute() {
  return (
    <Suspense fallback={<PageLoader label="Loading assessments..." />}>
      <TeacherAssessmentsPage />
    </Suspense>
  );
}
