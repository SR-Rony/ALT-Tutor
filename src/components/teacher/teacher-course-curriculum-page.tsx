"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { CourseCurriculumManager } from "@/components/curriculum/course-curriculum-manager";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useTeacherCourses } from "@/hooks";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link href={ROUTES.teacher.courses}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              My Courses
            </Link>
          </Button>
          <PageHeader
            title={course.title}
            description={`Curriculum · ${String(course.status).toLowerCase()}`}
            className="mb-0"
          />
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.courseDetail(course.slug)} target="_blank">
            Preview
          </Link>
        </Button>
      </div>

      <CourseCurriculumManager courseId={course.id} courseTitle={course.title} />
    </div>
  );
}
