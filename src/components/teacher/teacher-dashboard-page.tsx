"use client";

import Link from "next/link";
import {
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Layers,
  ListTree,
  PenLine,
  RefreshCw,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatCard } from "@/components/admin/dashboard/admin-stat-card";
import { ROUTES } from "@/constants";
import { useTeacherDashboard } from "@/hooks";
import { formatShortDate } from "@/lib/format";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import { cn } from "@/utils";

const quickActions: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: string;
}[] = [
  {
    title: "My Courses",
    description: "Create and manage curriculum",
    href: ROUTES.teacher.courses,
    icon: BookOpen,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "Assessments",
    description: "MCQ exams & written tasks",
    href: ROUTES.teacher.assessments,
    icon: ClipboardList,
    tone: "bg-accent/10 text-accent",
  },
  {
    title: "Grading Queue",
    description: "Review pending submissions",
    href: ROUTES.teacher.gradingQueue,
    icon: ClipboardCheck,
    tone: "bg-[#fff7ed] text-[#ea580c]",
  },
  {
    title: "Gradebook",
    description: "Scores, overrides & CSV",
    href: ROUTES.teacher.gradebook,
    icon: GraduationCap,
    tone: "bg-[#ecfdf3] text-accent-green",
  },
  {
    title: "My Subjects",
    description: "Programs & study resources",
    href: ROUTES.teacher.subjects,
    icon: Layers,
    tone: "bg-[#eff6ff] text-[#1877f2]",
  },
  {
    title: "New Assessment",
    description: "Set up the next exam",
    href: ROUTES.teacher.assessments,
    icon: PenLine,
    tone: "bg-[#fdf2f8] text-[#db2777]",
  },
];

function statusClass(status: string) {
  const s = status.toUpperCase();
  if (s === "PUBLISHED") return "bg-[#ecfdf3] text-accent-green";
  if (s === "ARCHIVED") return "bg-muted text-muted-foreground";
  return "bg-[#fff7ed] text-[#c2410c]";
}

function firstName(name?: string | null) {
  if (!name?.trim()) return "Teacher";
  return name.trim().split(/\s+/)[0] ?? "Teacher";
}

export function TeacherDashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isFetching, error, refetch } = useTeacherDashboard();

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Teacher Dashboard"
          description="Your teaching overview — courses, students, and grading."
          className="mb-0"
        />
        <PageLoader label="Loading teaching workspace..." />
      </div>
    );
  }

  const courses = data?.courses ?? [];
  const pending = data?.pendingSubmissions ?? [];
  const publishedCount = data?.publishedCourses ?? courses.filter((c) => c.status === "PUBLISHED").length;
  const draftCount = Math.max(0, (data?.totalCourses ?? courses.length) - publishedCount);

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/80 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={`Welcome back, ${firstName(user?.name)}`}
          description="Your LMS teaching workspace — courses, assessments, grading, and student progress."
          className="mb-0"
        />
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button asChild size="sm">
            <Link href={ROUTES.teacher.gradingQueue}>
              <ClipboardCheck className="h-4 w-4" aria-hidden />
              Open grading
              {(data?.pendingGrading ?? 0) > 0 ? (
                <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[11px] font-bold">
                  {data?.pendingGrading}
                </span>
              ) : null}
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href={ROUTES.teacher.courses}>Manage courses</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4 text-sm text-accent">
          <p className="font-semibold">Could not load dashboard data</p>
          <p className="mt-1 opacity-90">
            {(error as unknown as ApiError).message || "Please try again."}
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <AdminStatCard label="My courses" value={data?.totalCourses ?? 0} icon={BookOpen} tone="primary" />
        <AdminStatCard label="Published" value={publishedCount} icon={GraduationCap} tone="green" />
        <AdminStatCard label="Students" value={data?.totalStudents ?? 0} icon={Users} tone="primary" />
        <AdminStatCard
          label="Enrollments"
          value={data?.totalEnrollments ?? 0}
          icon={Users}
          tone="neutral"
        />
        <AdminStatCard
          label="Assessments"
          value={data?.totalAssessments ?? 0}
          icon={ClipboardList}
          tone="accent"
        />
        <AdminStatCard
          label="To grade"
          value={data?.pendingGrading ?? 0}
          icon={ClipboardCheck}
          tone={(data?.pendingGrading ?? 0) > 0 ? "accent" : "green"}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={`${action.href}-${action.title}`}
              href={action.href}
              className={cn(
                "group rounded-2xl border border-border bg-card p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]",
                "transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_28px_rgba(24,119,242,0.12)]"
              )}
            >
              <div className={cn("mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl", action.tone)}>
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <p className="font-semibold text-foreground group-hover:text-primary">{action.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
            </Link>
          );
        })}
      </section>

      {(data?.pendingGrading ?? 0) > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#fed7aa] bg-gradient-to-r from-[#fff7ed] to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[#9a3412]">
              {data?.pendingGrading} submission{(data?.pendingGrading ?? 0) === 1 ? "" : "s"} waiting for your review
            </p>
            <p className="mt-1 text-sm text-[#c2410c]/80">
              Grade written work promptly so students get timely feedback.
            </p>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href={ROUTES.teacher.gradingQueue}>Go to grading queue</Link>
          </Button>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <div>
              <CardTitle className="text-base">My courses</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {publishedCount} published · {draftCount} draft
              </p>
            </div>
            <Link href={ROUTES.teacher.courses} className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {!courses.length ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
                <p className="text-sm text-muted-foreground">No courses yet. Create your first course to start teaching.</p>
                <Button asChild size="sm" className="mt-4">
                  <Link href={ROUTES.teacher.courses}>Create course</Link>
                </Button>
              </div>
            ) : (
              courses.slice(0, 6).map((course) => (
                <div
                  key={course.id}
                  className="rounded-xl border border-border px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-foreground">{course.title}</p>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase",
                            statusClass(course.status)
                          )}
                        >
                          {course.status.toLowerCase()}
                        </span>
                        {course.ownership === "delegated" ? (
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                            Co-teacher
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {course.category?.name ?? "Uncategorized"}
                        {" · "}
                        {course._count.enrollments} enrolled
                        {" · "}
                        {course._count.chapters ?? 0} chapters
                        {" · "}
                        {course._count.assignments ?? 0} assessments
                        {course._count.reviews ? ` · ${course._count.reviews} reviews` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={ROUTES.teacher.courseCurriculum(course.id)}>
                          <ListTree className="h-3.5 w-3.5" aria-hidden />
                          Curriculum
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`${ROUTES.teacher.assessments}?courseId=${course.id}`}>Assessments</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <CardTitle className="text-base">Needs attention</CardTitle>
              <Link
                href={ROUTES.teacher.gradingQueue}
                className="text-sm font-medium text-primary hover:underline"
              >
                Queue
              </Link>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              {!pending.length ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                  <ClipboardCheck className="mx-auto h-8 w-8 text-accent-green/70" aria-hidden />
                  <p className="mt-3 text-sm font-medium text-foreground">All caught up</p>
                  <p className="mt-1 text-xs text-muted-foreground">No pending submissions to grade.</p>
                </div>
              ) : (
                pending.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border px-4 py-3">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.assignment?.title ?? "Assignment"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.student?.name ?? "Student"}
                      {item.assignment?.course?.title ? ` · ${item.assignment.course.title}` : ""}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {item.submittedAt ? formatShortDate(item.submittedAt) : "—"}
                      </span>
                      <Link
                        href={ROUTES.teacher.gradingQueue}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Grade
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-base">Teaching snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Active students</span>
                <span className="font-bold text-foreground">{data?.totalStudents ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Total enrollments</span>
                <span className="font-bold text-foreground">{data?.totalEnrollments ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-muted-foreground">Assessments live</span>
                <span className="font-bold text-foreground">{data?.totalAssessments ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#fff7ed] px-4 py-3">
                <span className="text-[#9a3412]">Pending grading</span>
                <span className="font-bold text-[#c2410c]">{data?.pendingGrading ?? 0}</span>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={ROUTES.teacher.gradebook}>Open gradebook</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
