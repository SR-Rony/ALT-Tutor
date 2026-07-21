"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { AdminActionsBar, AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { PageHeader, PageLoader } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { useAdminCancelEnrollment, useAdminEnrollments } from "@/hooks";
import { formatCoursePrice } from "@/lib/course-format";
import { formatShortDate } from "@/lib/format";
import type { ApiError, EnrollmentStatus } from "@/types";
import { cn } from "@/utils";

type StatusTab = "ALL" | EnrollmentStatus;

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "ACTIVE", label: "Active" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELLED", label: "Cancelled" },
];

const PAGE_SIZE = 20;

function statusBadgeClass(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return "bg-[#ecfdf3] text-[#067647] ring-[#abefc6]";
  if (s === "COMPLETED") return "bg-[#eff8ff] text-[#175cd3] ring-[#b2ddff]";
  if (s === "CANCELLED") return "bg-[#fef3f2] text-[#b42318] ring-[#fecdca]";
  return "bg-muted text-muted-foreground ring-border";
}

function formatStatusLabel(status: string) {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return "Active";
  if (s === "COMPLETED") return "Completed";
  if (s === "CANCELLED") return "Cancelled";
  return status;
}

export function AdminEnrollmentsPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("ALL");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(
    () => ({
      status: statusTab === "ALL" ? undefined : statusTab,
      search: search || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [statusTab, search, page]
  );

  const { data, isLoading, error, refetch, isFetching } = useAdminEnrollments(filters);
  const cancelEnrollment = useAdminCancelEnrollment();

  const items = data?.items ?? [];
  const counts = data?.counts ?? { all: 0, active: 0, completed: 0, cancelled: 0 };
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const tabCount = (tab: StatusTab) => {
    if (tab === "ALL") return counts.all;
    if (tab === "ACTIVE") return counts.active;
    if (tab === "COMPLETED") return counts.completed;
    return counts.cancelled;
  };

  const onCancel = async (id: string, studentName: string, courseTitle: string) => {
    const confirmed = window.confirm(
      `Cancel enrollment for "${studentName}" in "${courseTitle}"?\n\nThey will lose access to this course content.`
    );
    if (!confirmed) return;

    setActionError(null);
    setPendingId(id);
    try {
      await cancelEnrollment.mutateAsync(id);
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError?.message || "Failed to cancel enrollment");
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Enrollments"
          description="Track student course enrollments, progress, and access status."
          className="mb-0"
        />
        <PageLoader label="Loading enrollments..." />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="border-b border-border px-5 py-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <PageHeader
            title="Enrollments"
            description="Track student course enrollments, progress, and access status."
            className="mb-0"
          />
          <AdminIconAction
            label="Refresh"
            icon={RefreshCw}
            tone="primary"
            disabled={isFetching}
            onClick={() => void refetch()}
            className={isFetching ? "animate-spin" : undefined}
          />
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              { label: "Total", value: counts.all, tone: "text-foreground" },
              { label: "Active", value: counts.active, tone: "text-[#067647]" },
              { label: "Completed", value: counts.completed, tone: "text-[#175cd3]" },
              { label: "Cancelled", value: counts.cancelled, tone: "text-[#b42318]" },
            ] as const
          ).map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-muted/30 px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              <p className={cn("mt-1 text-2xl font-bold tabular-nums", stat.tone)}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search student, phone, email, or course..."
            className="max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusTab(tab.id);
                  setPage(1);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  statusTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    statusTab === tab.id
                      ? "bg-white/20 text-primary-foreground"
                      : "bg-background/80 text-muted-foreground"
                  )}
                >
                  {tabCount(tab.id)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {actionError || error ? (
          <p className="mt-3 text-sm text-accent">
            {actionError || (error as unknown as ApiError)?.message || "Something went wrong"}
            {!actionError && error ? (
              <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
                Retry
              </button>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">Student</th>
              <th className="px-5 py-3 font-semibold">Course</th>
              <th className="px-5 py-3 font-semibold">Progress</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Enrolled</th>
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                  No enrollments match your filters.
                </td>
              </tr>
            ) : null}

            {items.map((enrollment) => {
              const status = String(enrollment.status).toUpperCase();
              const canCancel = status === "ACTIVE" || status === "COMPLETED";
              const isPending = pendingId === enrollment.id;
              const progress = Math.max(0, Math.min(100, Number(enrollment.progress) || 0));

              return (
                <tr key={enrollment.id} className="border-b border-border/70 last:border-0">
                  <td className="px-5 py-3.5 align-middle">
                    <Link
                      href={ROUTES.admin.userDetail(enrollment.student.id)}
                      className="group block min-w-0"
                    >
                      <p className="font-semibold text-foreground group-hover:text-primary group-hover:underline">
                        {enrollment.student.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {enrollment.student.phone}
                        {enrollment.student.email ? ` · ${enrollment.student.email}` : ""}
                      </p>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 align-middle">
                    <Link
                      href={ROUTES.admin.courseCurriculum(enrollment.course.id)}
                      className="group block min-w-0"
                    >
                      <p className="font-medium text-foreground group-hover:text-primary group-hover:underline">
                        {enrollment.course.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatCoursePrice(enrollment.course.price)}
                        {enrollment.course.teacher?.name
                          ? ` · ${enrollment.course.teacher.name}`
                          : ""}
                      </p>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 align-middle">
                    <div className="min-w-[120px]">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold tabular-nums text-foreground">{progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            progress >= 100 ? "bg-[#175cd3]" : "bg-primary"
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 align-middle">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
                        statusBadgeClass(status)
                      )}
                    >
                      {formatStatusLabel(status)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 align-middle text-muted-foreground">
                    {formatShortDate(enrollment.enrolledAt)}
                  </td>
                  <td className="px-5 py-3.5 align-middle">
                    <AdminActionsBar>
                      <AdminIconAction
                        label="Open student"
                        icon={ExternalLink}
                        tone="primary"
                        onClick={() => router.push(ROUTES.admin.userDetail(enrollment.student.id))}
                      />
                      {canCancel ? (
                        <AdminIconAction
                          label="Cancel enrollment"
                          icon={Ban}
                          tone="danger"
                          disabled={isPending || cancelEnrollment.isPending}
                          onClick={() =>
                            void onCancel(
                              enrollment.id,
                              enrollment.student.name,
                              enrollment.course.title
                            )
                          }
                        />
                      ) : null}
                    </AdminActionsBar>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              Prev
            </button>
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
