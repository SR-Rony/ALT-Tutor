"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, ListTree } from "lucide-react";
import { CourseCurriculumManager } from "@/components/curriculum/course-curriculum-manager";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useAdminCourses } from "@/hooks";

type Props = { courseId: string };

export function AdminCourseCurriculumPage({ courseId }: Props) {
  const { data = [], isLoading, error } = useAdminCourses();
  const course = useMemo(() => data.find((c) => c.id === courseId), [data, courseId]);

  if (isLoading && !course) {
    return <PageLoader label="Loading course..." />;
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-accent">Course not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.admin.courses}>Back to courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link href={ROUTES.admin.courses}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Courses
            </Link>
          </Button>
          <PageHeader
            title={course.title}
            description={`Curriculum editor · ${course.category?.name ?? "Course"} · ${String(course.status).toLowerCase()}`}
            className="mb-0"
          />
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.courseDetail(course.slug)} target="_blank">
            View public page
          </Link>
        </Button>
      </div>

      {error ? <p className="text-sm text-accent">Could not refresh course list.</p> : null}

      <CourseCurriculumManager courseId={course.id} courseTitle={course.title} />
    </div>
  );
}

export function CurriculumNavHint() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <ListTree className="h-3.5 w-3.5" aria-hidden />
      Curriculum
    </span>
  );
}
