"use client";

import { GradingQueuePage } from "@/components/admin/grading/admin-grading-queue-page";
import { ROUTES } from "@/constants";

export default function TeacherGradingRoute() {
  return (
    <GradingQueuePage
      title="Grading queue"
      description="Grade written and file submissions from courses you own or are delegated to."
      assessmentsHref={ROUTES.teacher.assessments}
      assessmentsLabel="Assessments"
    />
  );
}
