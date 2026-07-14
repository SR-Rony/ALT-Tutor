"use client";

import Link from "next/link";
import {
  Bell,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Percent,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatCard } from "@/components/admin/dashboard/admin-stat-card";
import { ROUTES } from "@/constants";
import { useStudentDashboard } from "@/hooks";
import { formatMoney, formatShortDate } from "@/lib/format";
import type { ApiError } from "@/types";
import { cn } from "@/utils";

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function statusClass(status: string) {
  const s = status.toUpperCase();
  if (s === "COMPLETED") return "bg-[#ecfdf3] text-accent-green";
  if (s === "CANCELLED") return "bg-accent/10 text-accent";
  return "bg-primary/10 text-primary";
}

export function StudentDashboardPage() {
  const { data, isLoading, isFetching, error, refetch } = useStudentDashboard();

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Student Dashboard"
          description="Track learning progress, assignments, and notifications."
          className="mb-0"
        />
        <PageLoader label="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Welcome back"
          description="Your learning overview — courses, progress, and updates."
          className="mb-0"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="shrink-0"
        >
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <AdminStatCard label="Enrolled" value={data?.totalEnrolled ?? 0} icon={BookOpen} tone="primary" />
        <AdminStatCard label="Active" value={data?.activeCourses ?? 0} icon={GraduationCap} tone="green" />
        <AdminStatCard
          label="Completed"
          value={data?.completedCourses ?? 0}
          icon={GraduationCap}
          tone="neutral"
        />
        <AdminStatCard
          label="Avg progress"
          value={data?.averageProgress ?? 0}
          icon={Percent}
          tone="primary"
          formatter={(v) => `${Number(v) || 0}%`}
        />
        <AdminStatCard
          label="Assignments"
          value={data?.totalAssignments ?? 0}
          icon={ClipboardList}
          tone="accent"
        />
        <AdminStatCard
          label="Unread"
          value={data?.unreadNotifications ?? 0}
          icon={Bell}
          tone="accent"
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: ROUTES.student.courses, title: "My Courses", desc: "Continue learning" },
          { href: ROUTES.student.assignments, title: "Assignments", desc: "Submit work & MCQs" },
          { href: ROUTES.student.notifications, title: "Notifications", desc: "Latest updates" },
          { href: ROUTES.student.payments, title: "Payments", desc: "Purchase history" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_12px_28px_rgba(24,119,242,0.1)]"
          >
            <p className="font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <CardTitle className="text-base">Continue learning</CardTitle>
            <Link href={ROUTES.student.courses} className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            {!data?.enrollments?.length ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
                <p className="text-sm text-muted-foreground">No enrollments yet.</p>
                <Link
                  href={ROUTES.courses}
                  className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
                >
                  Browse courses
                </Link>
              </div>
            ) : (
              data.enrollments.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{item.course.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.course.teacher?.name ?? "Instructor"}
                        {item.course.category?.name ? ` · ${item.course.category.name}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase",
                        statusClass(String(item.status))
                      )}
                    >
                      {String(item.status).toLowerCase()}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <ProgressBar value={item.progress} />
                    <span className="shrink-0 text-sm font-semibold text-primary">{item.progress}%</span>
                  </div>
                  {item.course.slug ? (
                    <Link
                      href={ROUTES.courseDetail(item.course.slug)}
                      className="mt-3 inline-flex text-xs font-semibold text-primary hover:underline"
                    >
                      Open course
                    </Link>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
              <CardTitle className="text-base">Notifications</CardTitle>
              <Link
                href={ROUTES.student.notifications}
                className="text-sm font-medium text-primary hover:underline"
              >
                All
              </Link>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              {!data?.recentNotifications?.length ? (
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
              ) : (
                data.recentNotifications.slice(0, 4).map((note) => (
                  <div
                    key={note.id}
                    className={cn(
                      "rounded-xl border px-3 py-2.5",
                      note.isRead ? "border-border bg-card" : "border-primary/20 bg-primary/5"
                    )}
                  >
                    <p className="text-sm text-foreground">{note.message}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatShortDate(note.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-base">Spending</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3 pt-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ecfdf3] text-accent-green">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total spent</p>
                <p className="text-xl font-bold text-foreground">{formatMoney(data?.totalSpent ?? 0)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
