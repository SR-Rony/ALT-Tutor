"use client";

import Link from "next/link";
import {
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Layers,
  ListTree,
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
    description: "Curriculum & lessons",
    href: ROUTES.teacher.courses,
    icon: BookOpen,
    tone: "bg-primary/10 text-primary",
  },
  {
    title: "My Subjects",
    description: "Programs & resources",
    href: ROUTES.teacher.subjects,
    icon: Layers,
    tone: "bg-[#eff6ff] text-[#1877f2]",
  },
  {
    title: "Practice Exams",
    description: "Templates & quizzes",
    href: ROUTES.teacher.practiceExams,
    icon: ClipboardList,
    tone: "bg-accent/10 text-accent",
  },
  {
    title: "Key Concepts",
    description: "Short lesson content",
    href: ROUTES.teacher.keyConcepts,
    icon: BookOpen,
    tone: "bg-[#ecfdf3] text-accent-green",
  },
  {
    title: "Past Papers",
    description: "Archive papers",
    href: ROUTES.teacher.pastPapers,
    icon: ClipboardCheck,
    tone: "bg-[#fff7ed] text-[#ea580c]",
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
          description="Your teaching overview — courses, subjects, and resources."
          className="mb-0"
        />
        <PageLoader label="Loading teaching workspace..." />
      </div>
    );
  }

  const courses = data?.courses ?? [];
  const publishedCount = data?.publishedCourses ?? courses.filter((c) => c.status === "PUBLISHED").length;
  const draftCount = Math.max(0, (data?.totalCourses ?? courses.length) - publishedCount);

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/80 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={`Welcome back, ${firstName(user?.name)}`}
          description="Manage courses and subject resources — Questionbank, Practice Exams, Key Concepts, and Past Papers."
          className="mb-0"
        />
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button asChild size="sm">
            <Link href={ROUTES.teacher.courses}>Manage courses</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={ROUTES.teacher.subjects}>My subjects</Link>
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="My courses" value={data?.totalCourses ?? 0} icon={BookOpen} tone="primary" />
        <AdminStatCard label="Published" value={publishedCount} icon={GraduationCap} tone="green" />
        <AdminStatCard label="Students" value={data?.totalStudents ?? 0} icon={Users} tone="primary" />
        <AdminStatCard
          label="Enrollments"
          value={data?.totalEnrollments ?? 0}
          icon={Users}
          tone="neutral"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
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
                  className="rounded-xl border border-border px-4 py-3 transition-colors hover:border-primary/30 hover:bg-muted/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={ROUTES.teacher.courseCurriculum(course.id)}
                          className="truncate font-semibold text-foreground hover:text-primary hover:underline"
                        >
                          {course.title}
                        </Link>
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
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={ROUTES.teacher.courseCurriculum(course.id)}>
                        <ListTree className="h-3.5 w-3.5" aria-hidden />
                        Curriculum
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 xl:col-span-2">
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
                <span className="text-muted-foreground">Published courses</span>
                <span className="font-bold text-foreground">{publishedCount}</span>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={ROUTES.teacher.subjects}>Open my subjects</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
