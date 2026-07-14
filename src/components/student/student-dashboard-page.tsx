"use client";

import { BookOpen, GraduationCap, RefreshCw } from "lucide-react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminStatCard } from "@/components/admin/dashboard/admin-stat-card";
import { useStudentDashboard } from "@/hooks";
import type { ApiError } from "@/types";

export function StudentDashboardPage() {
  const { data, isLoading, isFetching, error, refetch } = useStudentDashboard();

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Student Dashboard"
          description="Your enrollments and learning progress."
          className="mb-0"
        />
        <PageLoader label="Loading your courses..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Student Dashboard"
          description="Your enrollments and learning progress."
          className="mb-0"
        />
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
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
        <AdminStatCard
          label="Enrolled courses"
          value={data?.totalEnrolled ?? 0}
          icon={BookOpen}
          tone="primary"
        />
        <AdminStatCard
          label="Completed"
          value={data?.completedCourses ?? 0}
          icon={GraduationCap}
          tone="green"
        />
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            My enrollments
          </h2>
          {!data?.enrollments?.length ? (
            <p className="text-sm text-muted-foreground">No enrollments yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.enrollments.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{item.course.title}</p>
                    <p className="text-xs text-muted-foreground">{item.status.toLowerCase()}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-primary">{item.progress}%</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
