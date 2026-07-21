"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, ClipboardList, ExternalLink, GraduationCap } from "lucide-react";
import { CourseCurriculumManager } from "@/components/curriculum/course-curriculum-manager";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useTeacherCourses } from "@/hooks";
import { cn } from "@/utils";

type Props = { courseId: string };

export function TeacherCourseCurriculumPage({ courseId }: Props) {
  const { data, isLoading } = useTeacherCourses();
  const course = useMemo(() => data?.all.find((c) => c.id === courseId), [data, courseId]);

  if (isLoading && !course) {
    return <PageLoader label="Loading course..." />;
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-accent">Course not found or you do not have access.</p>
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.teacher.courses}>Back to my courses</Link>
        </Button>
      </div>
    );
  }

  const isPublished = String(course.status) === "PUBLISHED";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link href={ROUTES.teacher.courses}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            My Courses
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <PageHeader title={course.title} description="" className="mb-0" />
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase",
                  isPublished ? "bg-[#ecfdf3] text-accent-green" : "bg-muted text-muted-foreground"
                )}
              >
                {String(course.status).toLowerCase()}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Build chapters and lessons · click a chapter to expand · click a lesson to edit
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {course.category?.name ?? "Uncategorized"} · {String(course.level).toLowerCase()}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button asChild variant="outline" size="sm">
              <Link href={`${ROUTES.teacher.assessments}?courseId=${course.id}`}>
                <ClipboardList className="h-3.5 w-3.5" aria-hidden />
                Assessments
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`${ROUTES.teacher.gradebook}?courseId=${course.id}`}>
                <GraduationCap className="h-3.5 w-3.5" aria-hidden />
                Gradebook
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link href={ROUTES.courseDetail(course.slug)} target="_blank">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Preview
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <CourseCurriculumManager courseId={course.id} courseTitle={course.title} />
    </div>
  );
}
