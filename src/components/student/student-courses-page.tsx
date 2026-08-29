"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Percent,
  Play,
} from "lucide-react";
import { ListPagination, PageLoader } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { useClientPagination, useStudentCourses } from "@/hooks";
import { formatAccessRemaining, formatShortDate } from "@/lib/format";
import type { ApiError } from "@/types";
import { cn } from "@/utils";

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-[#e8edf5]"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function statusMeta(status: string) {
  const s = status.toUpperCase();
  if (s === "COMPLETED") {
    return { label: "Completed", className: "bg-[#ecfdf3] text-accent-green ring-1 ring-[#abefc6]/60" };
  }
  if (s === "CANCELLED") {
    return { label: "Cancelled", className: "bg-accent/10 text-accent ring-1 ring-accent/15" };
  }
  return { label: "In Progress", className: "bg-primary/10 text-primary ring-1 ring-primary/15" };
}

function CourseActionsMenu({
  learnHref,
  detailHref,
  learnLabel,
}: {
  learnHref: string | null;
  detailHref: string | null;
  learnLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="More course actions"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 bottom-full z-30 mb-1.5 w-48 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-[0_12px_32px_-8px_rgba(15,23,42,0.18)]"
        >
          {learnHref ? (
            <Link
              href={learnHref}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <Play className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              {learnLabel}
            </Link>
          ) : null}
          {detailHref ? (
            <Link
              href={detailHref}
              role="menuitem"
              className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <Eye className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              View details
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  className,
  iconClassName,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  className: string;
  iconClassName: string;
}) {
  return (
    <div className={cn("flex items-center gap-4 rounded-2xl px-5 py-5", className)}>
      <span
        className={cn(
          "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white",
          iconClassName
        )}
      >
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold leading-tight text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function StudentCoursesPage() {
  const { data = [], isLoading, error, refetch } = useStudentCourses();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  const {
    page,
    setPage,
    pageItems,
    total,
    totalPages,
    from,
    to,
  } = useClientPagination(visible);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, setPage]);

  const stats = useMemo(() => {
    const purchased = data.length;
    const completed = data.filter(
      (item) => String(item.status).toUpperCase() === "COMPLETED"
    ).length;
    const avgProgress =
      purchased === 0
        ? 0
        : Math.round(data.reduce((sum, item) => sum + (item.progress ?? 0), 0) / purchased);
    return { purchased, completed, avgProgress };
  }, [data]);

  if (isLoading && data.length === 0) {
    return (
      <div className="space-y-6">
        <PageLoader label="Loading your courses..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message}
          <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
            Retry
          </button>
        </p>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <h2 className="mb-4 text-base font-bold text-foreground">My Learning Statistics</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<BookOpen className="h-5 w-5" aria-hidden />}
            value={String(stats.purchased)}
            label="Purchased Courses"
            className="bg-[#e8f2fe]"
            iconClassName="bg-primary"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
            value={String(stats.completed)}
            label="Completed Courses"
            className="bg-[#ecfdf3]"
            iconClassName="bg-accent-green"
          />
          <StatCard
            icon={<Percent className="h-5 w-5" aria-hidden />}
            value={`${stats.avgProgress}%`}
            label="Average Progress"
            className="bg-[#f5f0fe]"
            iconClassName="bg-[#8b5cf6]"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">My Purchased Courses</h2>
              <p className="mt-0.5 text-sm text-primary">
                Continue learning with your enrolled courses
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses..."
                className="h-9 w-full sm:w-64"
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
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm text-muted-foreground">
              {data.length === 0
                ? "You have not enrolled in any courses yet."
                : "No courses match your search or filter."}
            </p>
            <Link
              href={ROUTES.courses}
              className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
            >
              Browse catalog
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] table-fixed text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="w-[32%] px-5 py-3">Course</th>
                  <th className="w-[16%] px-5 py-3">Progress</th>
                  <th className="w-[12%] px-5 py-3">Status</th>
                  <th className="w-[14%] px-5 py-3">Certificate</th>
                  <th className="w-[14%] px-5 py-3">Enrolled / Access</th>
                  <th className="w-[12%] px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => {
                  const status = statusMeta(String(item.status));
                  const isCompleted = String(item.status).toUpperCase() === "COMPLETED";
                  const isCancelled = String(item.status).toUpperCase() === "CANCELLED";
                  const progress = Math.min(100, Math.max(0, item.progress ?? 0));
                  const learnHref = item.course.slug
                    ? ROUTES.student.courseLearn(item.course.slug)
                    : null;
                  const detailHref = item.course.slug
                    ? ROUTES.courseDetail(item.course.slug)
                    : null;
                  const learnLabel =
                    progress > 0 && !isCompleted ? "Continue learning" : "Start course";
                  const access = formatAccessRemaining(item.expiresAt);

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border/70 transition-colors last:border-0 hover:bg-[#f8fafc]/80"
                    >
                      <td className="px-5 py-4 align-middle">
                        <div className="flex min-w-0 items-center gap-3.5">
                          <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#e8f2fe] to-[#fff5f2] ring-1 ring-border/60">
                            {item.course.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.course.thumbnail}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] font-medium text-muted-foreground">
                                {item.course.category?.name ?? "Course"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold leading-snug text-foreground">
                              {item.course.title}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {item.course.teacher?.name ?? "Instructor"}
                              {item.course.category?.name
                                ? ` · ${item.course.category.name}`
                                : null}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <div className="max-w-[11rem]">
                          <div className="mb-1.5 text-right text-xs font-semibold tabular-nums text-foreground">
                            {progress}%
                          </div>
                          <ProgressBar value={progress} />
                        </div>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-green">
                            <Award className="h-3.5 w-3.5" aria-hidden />
                            Ready
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
                            title="Finish the course to unlock your certificate"
                          >
                            <Award className="h-3.5 w-3.5 opacity-50" aria-hidden />
                            Locked
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 align-middle text-xs leading-relaxed text-muted-foreground">
                        <p>
                          Enrolled{" "}
                          <span className="font-medium text-foreground">
                            {item.enrolledAt ? formatShortDate(item.enrolledAt) : "—"}
                          </span>
                        </p>
                        <p
                          className={cn(
                            "mt-0.5 font-medium",
                            access.expired
                              ? "text-accent"
                              : access.daysLeft != null && access.daysLeft <= 7
                                ? "text-amber-600"
                                : "text-foreground"
                          )}
                        >
                          {access.label}
                        </p>
                      </td>

                      <td className="px-5 py-4 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          {learnHref && !isCancelled ? (
                            <Link
                              href={learnHref}
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
                            >
                              <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
                              {progress > 0 && !isCompleted ? "Continue" : "Start"}
                            </Link>
                          ) : null}
                          <CourseActionsMenu
                            learnHref={isCancelled ? null : learnHref}
                            detailHref={detailHref}
                            learnLabel={learnLabel}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <ListPagination
          page={page}
          totalPages={totalPages}
          total={total}
          from={from}
          to={to}
          onPageChange={setPage}
          label="courses"
        />
      </div>
    </div>
  );
}
