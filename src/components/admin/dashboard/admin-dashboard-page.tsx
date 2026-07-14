"use client";

import {
  BookOpen,
  GraduationCap,
  RefreshCw,
  Users,
  UserCheck,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  useAdminCourses,
  useAdminPayments,
  useAdminStats,
  useAdminUsers,
} from "@/hooks";
import { formatMoney } from "@/lib/format";
import type { ApiError } from "@/types";
import { AdminQuickActions } from "./admin-quick-actions";
import { AdminRecentCourses, AdminRecentPayments, AdminRecentUsers } from "./admin-recent-panels";
import { AdminStatCard } from "./admin-stat-card";

export function AdminDashboardPage() {
  const statsQuery = useAdminStats();
  const usersQuery = useAdminUsers();
  const coursesQuery = useAdminCourses();
  const paymentsQuery = useAdminPayments();

  const loading = statsQuery.isLoading;
  const stats = statsQuery.data;
  const error = (statsQuery.error ?? usersQuery.error ?? coursesQuery.error) as ApiError | null;

  const refetchAll = () => {
    void statsQuery.refetch();
    void usersQuery.refetch();
    void coursesQuery.refetch();
    void paymentsQuery.refetch();
  };

  const recentUsers = (usersQuery.data ?? []).slice(0, 5);
  const recentCourses = (coursesQuery.data ?? []).slice(0, 5);
  const recentPayments = (paymentsQuery.data ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Admin Dashboard"
          description="Live platform overview — users, courses, enrollments, and revenue."
          className="mb-0"
        />
        <Button type="button" variant="outline" size="sm" onClick={refetchAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading || statsQuery.isFetching ? "animate-spin" : ""}`} />
          Refresh
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          label="Total users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          tone="primary"
          loading={loading}
        />
        <AdminStatCard
          label="Students"
          value={stats?.totalStudents ?? 0}
          icon={GraduationCap}
          tone="green"
          loading={loading}
        />
        <AdminStatCard
          label="Teachers"
          value={stats?.totalTeachers ?? 0}
          icon={UserCheck}
          tone="primary"
          loading={loading}
        />
        <AdminStatCard
          label="Courses"
          value={stats?.totalCourses ?? 0}
          icon={BookOpen}
          tone="accent"
          loading={loading}
        />
        <AdminStatCard
          label="Enrollments"
          value={stats?.totalEnrollments ?? 0}
          icon={GraduationCap}
          tone="neutral"
          loading={loading}
        />
        <AdminStatCard
          label="Revenue"
          value={stats?.totalRevenue ?? 0}
          icon={Wallet}
          tone="green"
          loading={loading}
          formatter={formatMoney}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick actions</h2>
        <AdminQuickActions />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <AdminRecentUsers users={recentUsers} loading={usersQuery.isLoading} />
        <AdminRecentCourses courses={recentCourses} loading={coursesQuery.isLoading} />
        <AdminRecentPayments payments={recentPayments} loading={paymentsQuery.isLoading} />
      </section>
    </div>
  );
}
