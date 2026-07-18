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
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { useStudentCourses } from "@/hooks";
import { formatShortDate } from "@/lib/format";
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

function statusMeta(status: string) {
  const s = status.toUpperCase();
  if (s === "COMPLETED") return { label: "Completed", className: "bg-[#ecfdf3] text-accent-green" };
  if (s === "CANCELLED") return { label: "Cancelled", className: "bg-accent/10 text-accent" };
  return { label: "In Progress", className: "bg-primary/10 text-primary" };
}

function CourseActionsMenu({
  learnHref,
  detailHref,
}: {
  learnHref: string | null;
  detailHref: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        aria-label="Course actions"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-lg">
          {learnHref ? (
            <Link
              href={learnHref}
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <Play className="h-4 w-4 text-primary" aria-hidden />
              Start Course
            </Link>
          ) : null}
          {detailHref ? (
            <Link
              href={detailHref}
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <Eye className="h-4 w-4 text-muted-foreground" aria-hidden />
              View Details
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
        <PageHeader title="My Courses" description="All enrolled courses and progress." className="mb-0" />
        <PageLoader label="Loading your courses..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <PageHeader
          title="My Courses"
          description="Track progress and continue learning across enrollments."
          className="mb-0"
        />
        {error ? (
          <p className="mt-3 text-sm text-accent">
            {(error as unknown as ApiError)?.message}
            <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
              Retry
            </button>
          </p>
        ) : null}
      </div>

      {/* Learning statistics */}
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

      {/* Purchased courses table */}
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
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Certificate</th>
                  <th className="px-5 py-3">Enrolled</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => {
                  const status = statusMeta(String(item.status));
                  const isCompleted = String(item.status).toUpperCase() === "COMPLETED";
                  return (
                    <tr key={item.id} className="border-b border-border/70 last:border-0">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#e8f2fe] to-[#fff5f2]">
                            {item.course.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.course.thumbnail}
                                alt={item.course.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[10px] font-medium text-muted-foreground">
                                {item.course.category?.name ?? "Course"}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{item.course.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.course.teacher?.name ?? "Instructor"}
                            </p>
                            {item.course.slug ? (
                              <Button asChild size="sm" className="mt-2 h-7 gap-1.5 px-3 text-xs">
                                <Link href={ROUTES.student.courseLearn(item.course.slug)}>
                                  <Play className="h-3 w-3" aria-hidden />
                                  Continue
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-36">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span className="font-semibold text-foreground">{item.progress}%</span>
                          </div>
                          <div className="mt-1.5">
                            <ProgressBar value={item.progress} />
                          </div>
                          <p className="mt-1.5 text-xs text-muted-foreground">{status.label}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-green">
                            <Award className="h-4 w-4" aria-hidden />
                            Available
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not available</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {item.enrolledAt ? formatShortDate(item.enrolledAt) : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <CourseActionsMenu
                          learnHref={
                            item.course.slug
                              ? ROUTES.student.courseLearn(item.course.slug)
                              : null
                          }
                          detailHref={
                            item.course.slug ? ROUTES.courseDetail(item.course.slug) : null
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
