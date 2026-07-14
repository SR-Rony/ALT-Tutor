"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { useCancelEnrollment, useStudentCourses } from "@/hooks";
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

export function StudentCoursesPage() {
  const { data = [], isLoading, error, refetch } = useStudentCourses();
  const cancelEnrollment = useCancelEnrollment();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionError, setActionError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((item) => {
      const matchesStatus =
        statusFilter === "ALL" || String(item.status).toUpperCase() === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        item.course.title.toLowerCase().includes(q) ||
        (item.course.teacher?.name ?? "").toLowerCase().includes(q) ||
        (item.course.category?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [data, search, statusFilter]);

  const onCancel = async (courseId: string) => {
    setActionError(null);
    try {
      await cancelEnrollment.mutateAsync(courseId);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to cancel enrollment");
    }
  };

  if (isLoading && data.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Courses" description="All enrolled courses and progress." className="mb-0" />
        <PageLoader label="Loading your courses..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <PageHeader
          title="My Courses"
          description="Track progress and continue learning across enrollments."
          className="mb-4"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            {["ALL", "ACTIVE", "COMPLETED", "CANCELLED"].map((status) => (
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
            {actionError || (error as unknown as ApiError)?.message}
            {!actionError && error ? (
              <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
                Retry
              </button>
            ) : null}
          </p>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">No courses match your filters.</p>
          <Link href={ROUTES.courses} className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">
            Browse catalog
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <article
              key={item.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
            >
              <div className="relative h-36 bg-gradient-to-br from-[#e8f2fe] to-[#fff5f2]">
                {item.course.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.course.thumbnail}
                    alt={item.course.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                    {item.course.category?.name ?? "Course"}
                  </div>
                )}
                <span
                  className={cn(
                    "absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase",
                    statusClass(String(item.status))
                  )}
                >
                  {String(item.status).toLowerCase()}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-2 font-bold text-foreground">{item.course.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.course.teacher?.name ?? "Instructor"}
                  {item.enrolledAt ? ` · Joined ${formatShortDate(item.enrolledAt)}` : ""}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <ProgressBar value={item.progress} />
                  <span className="text-sm font-semibold text-primary">{item.progress}%</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.course._count?.chapters ?? 0} chapters
                  {item.course.price != null ? ` · ${formatMoney(item.course.price)}` : ""}
                </p>
                <div className="mt-auto flex gap-2 pt-4">
                  {item.course.slug ? (
                    <Button asChild size="sm" className="flex-1">
                      <Link href={ROUTES.courseDetail(item.course.slug)}>Continue</Link>
                    </Button>
                  ) : null}
                  {String(item.status).toUpperCase() === "ACTIVE" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={cancelEnrollment.isPending}
                      onClick={() => void onCancel(item.courseId)}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
