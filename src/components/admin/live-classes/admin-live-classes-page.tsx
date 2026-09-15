"use client";

import { useMemo } from "react";
import { StaffLiveClassesPage } from "@/components/live-classes/staff-live-classes-page";
import { useAdminCourses } from "@/hooks";

export function AdminLiveClassesPage() {
  const { data: courses = [], isLoading } = useAdminCourses();
  const options = useMemo(
    () =>
      (Array.isArray(courses) ? courses : []).map((c: { id: string; title: string }) => ({
        id: c.id,
        title: c.title,
      })),
    [courses]
  );
  return (
    <StaffLiveClassesPage
      roleLabel="Admin"
      courses={options}
      coursesLoading={isLoading}
    />
  );
}
