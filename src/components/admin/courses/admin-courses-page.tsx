"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Eye,
  FilePenLine,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { AdminActionsBar, AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { useAdminCourses, useDeleteCourse, useUpdateCourseStatus } from "@/hooks";
import { formatMoney, formatShortDate } from "@/lib/format";
import type { ApiError, CourseStatus } from "@/types";
import { cn } from "@/utils";

const statuses: CourseStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

function statusBadgeClass(status: string) {
  const s = status.toUpperCase();
  if (s === "PUBLISHED") return "bg-[#ecfdf3] text-accent-green";
  if (s === "DRAFT") return "bg-muted text-muted-foreground";
  return "bg-accent/10 text-accent";
}

export function AdminCoursesPage() {
  const { data = [], isLoading, error, refetch, isFetching } = useAdminCourses();
  const updateStatus = useUpdateCourseStatus();
  const deleteCourse = useDeleteCourse();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((course) => {
      const matchesStatus =
        statusFilter === "ALL" || String(course.status).toUpperCase() === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        course.title.toLowerCase().includes(q) ||
        course.slug.toLowerCase().includes(q) ||
        course.teacher.name.toLowerCase().includes(q) ||
        course.category.name.toLowerCase().includes(q)
      );
    });
  }, [data, search, statusFilter]);

  const busy = updateStatus.isPending || deleteCourse.isPending;

  const onStatusChange = async (id: string, status: CourseStatus) => {
    setActionError(null);
    setPendingId(id);
    try {
      await updateStatus.mutateAsync({ id, status });
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError?.message || "Failed to update course status");
    } finally {
      setPendingId(null);
    }
  };

  const onDelete = async (id: string, title: string) => {
    const confirmed = window.confirm(`Delete course "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    setActionError(null);
    setPendingId(id);
    try {
      await deleteCourse.mutateAsync(id);
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError?.message || "Failed to delete course");
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading && data.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Courses"
          description="Review courses — publish, archive, view, or delete."
          className="mb-0"
        />
        <PageLoader label="Loading courses..." />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="border-b border-border px-5 py-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <PageHeader
            title="Courses"
            description="Review courses — publish, archive, view, or delete."
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, teacher, or category..."
            className="max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            {["ALL", ...statuses].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  statusFilter === status
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
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
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">Course</th>
              <th className="px-5 py-3 font-semibold">Teacher</th>
              <th className="px-5 py-3 font-semibold">Price</th>
              <th className="px-5 py-3 font-semibold">Enrolled</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Created</th>
              <th className="px-5 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!isLoading && visible.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                  No courses match your filters.
                </td>
              </tr>
            ) : null}

            {visible.map((course) => {
              const current = String(course.status).toUpperCase() as CourseStatus;
              const rowBusy = busy && pendingId === course.id;

              return (
                <tr key={course.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-foreground">{course.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.category.name} · {String(course.level).toLowerCase()}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{course.teacher.name}</td>
                  <td className="px-5 py-4 font-medium text-foreground">{formatMoney(course.price)}</td>
                  <td className="px-5 py-4 text-muted-foreground">{course._count.enrollments}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                        statusBadgeClass(String(course.status))
                      )}
                    >
                      {String(course.status).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{formatShortDate(course.createdAt)}</td>
                  <td className="px-5 py-4">
                    <AdminActionsBar>
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                        title="View course"
                      >
                        <Link href={ROUTES.courseDetail(course.slug)} target="_blank" aria-label="View course">
                          <Eye className="h-4 w-4" aria-hidden />
                        </Link>
                      </Button>

                      {current !== "PUBLISHED" ? (
                        <AdminIconAction
                          label="Publish"
                          icon={CheckCircle2}
                          tone="success"
                          disabled={rowBusy}
                          onClick={() => void onStatusChange(course.id, "PUBLISHED")}
                        />
                      ) : null}

                      {current !== "DRAFT" ? (
                        <AdminIconAction
                          label="Set draft"
                          icon={FilePenLine}
                          tone="warning"
                          disabled={rowBusy}
                          onClick={() => void onStatusChange(course.id, "DRAFT")}
                        />
                      ) : null}

                      {current !== "ARCHIVED" ? (
                        <AdminIconAction
                          label="Archive"
                          icon={Archive}
                          tone="default"
                          disabled={rowBusy}
                          onClick={() => void onStatusChange(course.id, "ARCHIVED")}
                        />
                      ) : null}

                      <AdminIconAction
                        label="Delete course"
                        icon={Trash2}
                        tone="danger"
                        disabled={rowBusy}
                        onClick={() => void onDelete(course.id, course.title)}
                      />
                    </AdminActionsBar>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
