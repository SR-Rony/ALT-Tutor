"use client";

import { useMemo } from "react";
import { StaffLiveClassesPage } from "@/components/live-classes/staff-live-classes-page";
import { useTeacherCourses } from "@/hooks";

export function TeacherLiveClassesPage() {
  const { data, isLoading } = useTeacherCourses();
  const options = useMemo(
    () => (data?.all ?? []).map((c) => ({ id: c.id, title: c.title })),
    [data?.all]
  );
  return (
    <StaffLiveClassesPage
      roleLabel="Teacher"
      courses={options}
      coursesLoading={isLoading}
    />
  );
}
