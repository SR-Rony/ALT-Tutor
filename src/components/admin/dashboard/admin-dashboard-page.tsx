"use client";

import {
  BookOpen,
  GraduationCap,
  RefreshCw,
  Users,
  UserCheck,
  Wallet,
} from "lucide-react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  useAdminAnalytics,
  useAdminCourses,
  useAdminPayments,
  useAdminStats,
  useAdminUsers,
} from "@/hooks";
import { downloadCsv } from "@/lib/export-csv";
import { formatMoney } from "@/lib/format";
import type { ApiError } from "@/types";
import { AdminDashboardCharts } from "./admin-dashboard-charts";
import { AdminQuickActions } from "./admin-quick-actions";
import { AdminRecentCourses, AdminRecentPayments, AdminRecentUsers } from "./admin-recent-panels";
import { AdminStatCard } from "./admin-stat-card";

export function AdminDashboardPage() {
  const statsQuery = useAdminStats();
  const analyticsQuery = useAdminAnalytics();
  const usersQuery = useAdminUsers();
  const coursesQuery = useAdminCourses();
  const paymentsQuery = useAdminPayments();

  const initialLoading =
    statsQuery.isLoading || usersQuery.isLoading || coursesQuery.isLoading || paymentsQuery.isLoading;
  const refreshing =
    !initialLoading &&
    (statsQuery.isFetching ||
      analyticsQuery.isFetching ||
      usersQuery.isFetching ||
      coursesQuery.isFetching ||
      paymentsQuery.isFetching);
  const stats = statsQuery.data;
  const analytics = analyticsQuery.data ?? stats?.assessmentAnalytics;
  const error = (statsQuery.error ?? usersQuery.error ?? coursesQuery.error ?? paymentsQuery.error) as
    | ApiError
    | null;

  const refetchAll = () => {
    void statsQuery.refetch();
    void analyticsQuery.refetch();
    void usersQuery.refetch();
    void coursesQuery.refetch();
    void paymentsQuery.refetch();
  };

  const users = usersQuery.data ?? [];
  const courses = coursesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card/80 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Admin Dashboard"
          description="Production overview of users, courses, enrollments, and revenue."
          className="mb-0"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refetchAll}
          disabled={initialLoading || refreshing}
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${initialLoading || refreshing ? "animate-spin" : ""}`} />
          Refresh data
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4 text-sm text-accent">
          <p className="font-semibold">Could not load dashboard data</p>
          <p className="mt-1 opacity-90">{error.message || "Please try again."}</p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={refetchAll}>
            Retry
          </Button>
        </div>
      ) : null}

      {initialLoading && !stats ? (
        <PageLoader label="Loading dashboard data..." />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <AdminStatCard
              label="Total users"
              value={stats?.totalUsers ?? 0}
              icon={Users}
              tone="primary"
              loading={statsQuery.isLoading}
            />
            <AdminStatCard
              label="Students"
              value={stats?.totalStudents ?? 0}
              icon={GraduationCap}
              tone="green"
              loading={statsQuery.isLoading}
            />
            <AdminStatCard
              label="Teachers"
              value={stats?.totalTeachers ?? 0}
              icon={UserCheck}
              tone="primary"
              loading={statsQuery.isLoading}
            />
            <AdminStatCard
              label="Courses"
              value={stats?.totalCourses ?? 0}
              icon={BookOpen}
              tone="accent"
              loading={statsQuery.isLoading}
            />
            <AdminStatCard
              label="Enrollments"
              value={stats?.totalEnrollments ?? 0}
              icon={GraduationCap}
              tone="neutral"
              loading={statsQuery.isLoading}
            />
            <AdminStatCard
              label="Revenue"
              value={stats?.totalRevenue ?? 0}
              icon={Wallet}
              tone="green"
              loading={statsQuery.isLoading}
              formatter={formatMoney}
            />
          </section>

          <AdminDashboardCharts
            stats={stats}
            users={users}
            courses={courses}
            payments={payments}
          />

          <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Learning analytics
              </h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!analytics}
                onClick={() => {
                  if (!analytics) return;
                  downloadCsv("admin-analytics.csv", [
                    ["Metric", "Value"],
                    ["Practice sessions", analytics.submittedPracticeSessions],
                    ["Avg practice score", analytics.averagePracticeScore],
                    ["Ungraded written", analytics.ungradedWrittenSubmissions],
                    ["Avg MCQ score", analytics.averageMcqScore],
                    ["MCQ accuracy", analytics.averageMcqAccuracy ?? ""],
                    ["MCQ pass rate", analytics.mcqPassRate ?? ""],
                    [
                      "Grading turnaround (h)",
                      analytics.averageGradingTurnaroundHours ?? "",
                    ],
                    ...(analytics.weakTopics ?? []).map((t) => [
                      `Weak: ${t.topicTitle} / ${t.title}`,
                      `${t.accuracy}% (${t.correct}/${t.total})`,
                    ]),
                  ]);
                }}
              >
                Export CSV
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl bg-muted/50 px-4 py-3">
                <p className="text-xs uppercase text-muted-foreground">Practice sessions</p>
                <p className="mt-1 text-2xl font-bold">
                  {analytics?.submittedPracticeSessions ?? "—"}
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 px-4 py-3">
                <p className="text-xs uppercase text-muted-foreground">MCQ pass rate</p>
                <p className="mt-1 text-2xl font-bold">
                  {analytics?.mcqPassRate != null ? `${analytics.mcqPassRate}%` : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 px-4 py-3">
                <p className="text-xs uppercase text-muted-foreground">Avg MCQ score</p>
                <p className="mt-1 text-2xl font-bold">
                  {analytics?.averageMcqScore != null ? `${analytics.averageMcqScore}%` : "—"}
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 px-4 py-3">
                <p className="text-xs uppercase text-muted-foreground">Grading turnaround</p>
                <p className="mt-1 text-2xl font-bold">
                  {analytics?.averageGradingTurnaroundHours != null
                    ? `${analytics.averageGradingTurnaroundHours}h`
                    : "—"}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Weak topics</h3>
              {(analytics?.weakTopics?.length ?? 0) === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Not enough practice data yet (needs ≥3 answers per subtopic).
                </p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {analytics?.weakTopics?.map((t) => (
                    <li
                      key={t.subtopicId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <span>
                        {t.topicTitle} / {t.title}
                      </span>
                      <span className="font-semibold text-accent">{t.accuracy}% accuracy</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ungraded written submissions: {analytics?.ungradedWrittenSubmissions ?? 0}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Quick actions
            </h2>
            <AdminQuickActions />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recent activity
            </h2>
            <div className="grid gap-4 lg:grid-cols-3">
              <AdminRecentUsers users={users.slice(0, 5)} loading={usersQuery.isLoading} />
              <AdminRecentCourses courses={courses.slice(0, 5)} loading={coursesQuery.isLoading} />
              <AdminRecentPayments payments={payments.slice(0, 5)} loading={paymentsQuery.isLoading} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
