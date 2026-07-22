"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatRoleLabel, formatShortDate } from "@/lib/format";
import type { AdminCourse, AdminPayment, AdminUser } from "@/types/admin-dashboard.types";
import { cn } from "@/utils";

function PanelShell({
  title,
  href,
  children,
  loading,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border py-4">
        <CardTitle className="text-base">{title}</CardTitle>
        {href ? (
          <Link href={href} className="text-sm font-medium text-primary hover:text-primary-hover">
            View all
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function roleBadgeClass(role: string) {
  const r = role.toUpperCase();
  if (r === "ADMIN") return "bg-accent/10 text-accent";
  if (r === "TEACHER") return "bg-primary/10 text-primary";
  return "bg-[#ecfdf3] text-accent-green";
}

function statusBadgeClass(status: string) {
  const s = status.toUpperCase();
  if (s === "PUBLISHED" || s === "SUCCESS") return "bg-[#ecfdf3] text-accent-green";
  if (s === "DRAFT" || s === "PENDING") return "bg-muted text-muted-foreground";
  if (s === "ARCHIVED" || s === "FAILED") return "bg-accent/10 text-accent";
  return "bg-muted text-muted-foreground";
}

export function AdminRecentUsers({ users, loading }: { users: AdminUser[]; loading?: boolean }) {
  return (
    <PanelShell title="Recent users" href="/admin/users" loading={loading}>
      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users yet.</p>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.phone}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  roleBadgeClass(user.role)
                )}
              >
                {formatRoleLabel(user.role)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

export function AdminRecentCourses({
  courses,
  loading,
}: {
  courses: AdminCourse[];
  loading?: boolean;
}) {
  return (
    <PanelShell title="Recent courses" href="/admin/courses" loading={loading}>
      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No courses yet.</p>
      ) : (
        <ul className="space-y-3">
          {courses.map((course) => (
            <li key={course.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{course.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {course.teacher.name} · {course._count.enrollments} enrolled
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  statusBadgeClass(String(course.status))
                )}
              >
                {String(course.status).toLowerCase()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}

export function AdminRecentPayments({
  payments,
  loading,
}: {
  payments: AdminPayment[];
  loading?: boolean;
}) {
  return (
    <PanelShell title="Recent payments" loading={loading}>
      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments yet.</p>
      ) : (
        <ul className="space-y-3">
          {payments.map((payment) => (
            <li key={payment.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {payment.course?.title ??
                    payment.accessProduct?.title ??
                    "Payment"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {payment.student.name} · {formatShortDate(payment.createdAt)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-foreground">{formatMoney(payment.amount)}</p>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                    statusBadgeClass(String(payment.status))
                  )}
                >
                  {String(payment.status).toLowerCase()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelShell>
  );
}
