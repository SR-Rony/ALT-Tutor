"use client";

import Link from "next/link";
import { BookOpen, ListTree, RefreshCw, Users } from "lucide-react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminStatCard } from "@/components/admin/dashboard/admin-stat-card";
import { ROUTES } from "@/constants";
import { useTeacherDashboard } from "@/hooks";
import type { ApiError } from "@/types";
import { cn } from "@/utils";

export function TeacherDashboardPage() {
  const { data, isLoading, isFetching, error, refetch } = useTeacherDashboard();

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Teacher Dashboard"
          description="Your courses, students, and enrollments."
          className="mb-0"
        />
        <PageLoader label="Loading teaching stats..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Teacher Dashboard"
          description="Your courses, students, and enrollments."
          className="mb-0"
        />
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href={ROUTES.teacher.courses}>Manage courses</Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4 text-sm text-accent">
          {(error as unknown as ApiError).message || "Could not load dashboard"}
          <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <AdminStatCard label="My courses" value={data?.totalCourses ?? 0} icon={BookOpen} tone="primary" />
        <AdminStatCard label="Students" value={data?.totalStudents ?? 0} icon={Users} tone="green" />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Course list
            </h2>
            <Link href={ROUTES.teacher.courses} className="text-xs font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          {!data?.courses?.length ? (
            <p className="text-sm text-muted-foreground">No courses yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.courses.map((course) => (
                <li
                  key={course.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {course._count.enrollments} enrolled · {course._count.reviews} reviews
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase",
                        course.status === "PUBLISHED"
                          ? "bg-[#ecfdf3] text-accent-green"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {course.status.toLowerCase()}
                    </span>
                    <Button asChild variant="outline" size="sm">
                      <Link href={ROUTES.teacher.courseCurriculum(course.id)}>
                        <ListTree className="h-3.5 w-3.5" aria-hidden />
                        Curriculum
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
