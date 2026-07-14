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
  useAdminCourses,
  useAdminPayments,
  useAdminStats,
  useAdminUsers,
} from "@/hooks";
import { formatMoney } from "@/lib/format";
import type { ApiError } from "@/types";
import { AdminDashboardCharts } from "./admin-dashboard-charts";
import { AdminQuickActions } from "./admin-quick-actions";
import { AdminRecentCourses, AdminRecentPayments, AdminRecentUsers } from "./admin-recent-panels";
import { AdminStatCard } from "./admin-stat-card";

export function AdminDashboardPage() {
  const statsQuery = useAdminStats();
  const usersQuery = useAdminUsers();
  const coursesQuery = useAdminCourses();
  const paymentsQuery = useAdminPayments();

  const initialLoading =
    statsQuery.isLoading || usersQuery.isLoading || coursesQuery.isLoading || paymentsQuery.isLoading;
  const refreshing =
    !initialLoading &&
    (statsQuery.isFetching || usersQuery.isFetching || coursesQuery.isFetching || paymentsQuery.isFetching);
  const stats = statsQuery.data;
  const error = (statsQuery.error ?? usersQuery.error ?? coursesQuery.error ?? paymentsQuery.error) as
    | ApiError
    | null;

  const refetchAll = () => {
    void statsQuery.refetch();
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
