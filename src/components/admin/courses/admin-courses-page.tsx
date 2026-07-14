"use client";

import { useMemo, useState } from "react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminCourses, useUpdateCourseStatus } from "@/hooks";
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
  const { data = [], isLoading, error, refetch } = useAdminCourses();
  const updateStatus = useUpdateCourseStatus();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionError, setActionError] = useState<string | null>(null);

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

  const onStatusChange = async (id: string, status: CourseStatus) => {
    setActionError(null);
    try {
      await updateStatus.mutateAsync({ id, status });
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError?.message || "Failed to update course status");
    }
  };

  if (isLoading && data.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Courses"
          description="Review all courses and update publish status."
          className="mb-0"
        />
        <PageLoader label="Loading courses..." />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="border-b border-border px-5 py-6">
        <PageHeader
          title="Courses"
          description="Review all courses and update publish status."
          className="mb-4"
        />
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
        <table className="w-full min-w-[860px] text-left text-sm">
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

            {visible.map((course) => (
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
                  <div className="flex justify-end gap-2">
                    {statuses
                      .filter((s) => s !== String(course.status).toUpperCase())
                      .map((status) => (
                        <Button
                          key={status}
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={updateStatus.isPending}
                          onClick={() => void onStatusChange(course.id, status)}
                        >
                          {status.charAt(0) + status.slice(1).toLowerCase()}
                        </Button>
                      ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
