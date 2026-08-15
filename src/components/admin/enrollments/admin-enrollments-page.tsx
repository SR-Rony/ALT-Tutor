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
  UserPlus,
} from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { AdminGrantPracticeAccessModal } from "@/components/admin/shared/admin-grant-practice-access-modal";
import { AdminActionsBar, AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import {
  useAdminCancelEnrollment,
  useAdminCourses,
  useAdminEnrollStudent,
  useAdminEnrollments,
  useAdminUsers,
} from "@/hooks/use-admin-dashboard";
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

function AdminEnrollStudentModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: students = [], isLoading: studentsLoading } = useAdminUsers("STUDENT");
  const { data: courses = [], isLoading: coursesLoading } = useAdminCourses();
  const enrollStudent = useAdminEnrollStudent();

  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStudentId("");
    setCourseId("");
    setStudentQuery("");
    setCourseQuery("");
    setFormError(null);
  }, [open]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    const active = students.filter((s) => s.isActive);
    if (!q) return active;
    return active.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q)
    );
  }, [students, studentQuery]);

  const filteredCourses = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    const available = courses.filter((c) => String(c.status).toUpperCase() !== "ARCHIVED");
    if (!q) return available;
    return available.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.teacher?.name?.toLowerCase().includes(q)
    );
  }, [courses, courseQuery]);

  const selectedStudent = students.find((s) => s.id === studentId);
  const selectedCourse = courses.find((c) => c.id === courseId);

  const onSubmit = async () => {
    if (!studentId || !courseId) {
      setFormError("Select both a student and a course.");
      return;
    }
    setFormError(null);
    try {
      await enrollStudent.mutateAsync({ studentId, courseId });
      onClose();
    } catch (err) {
      const apiError = err as ApiError;
      setFormError(apiError?.message || "Failed to enroll student");
    }
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title="Enroll student"
      description="Manually enroll any student into any course. Payment is skipped; access duration still applies."
      className="sm:max-w-lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={enrollStudent.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void onSubmit()}
            disabled={enrollStudent.isPending || !studentId || !courseId}
          >
            {enrollStudent.isPending ? "Enrolling…" : "Enroll student"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Student</label>
          <Input
            value={studentQuery}
            onChange={(e) => setStudentQuery(e.target.value)}
            placeholder="Filter by name, phone, or email…"
          />
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            disabled={studentsLoading}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          >
            <option value="">
              {studentsLoading ? "Loading students…" : "Select a student"}
            </option>
            {filteredStudents.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} · {student.phone}
                {student.email ? ` · ${student.email}` : ""}
              </option>
            ))}
          </select>
          {selectedStudent ? (
            <p className="text-xs text-muted-foreground">
              Selected: {selectedStudent.name} ({selectedStudent.phone})
            </p>
          ) : null}
          {!studentsLoading && filteredStudents.length === 0 ? (
            <p className="text-xs text-muted-foreground">No active students match this filter.</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Course</label>
          <Input
            value={courseQuery}
            onChange={(e) => setCourseQuery(e.target.value)}
            placeholder="Filter by title, slug, or teacher…"
          />
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            disabled={coursesLoading}
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          >
            <option value="">
              {coursesLoading ? "Loading courses…" : "Select a course"}
            </option>
            {filteredCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} · {String(course.status)} · {formatCoursePrice(course.price)}
              </option>
            ))}
          </select>
          {selectedCourse ? (
            <p className="text-xs text-muted-foreground">
              Selected: {selectedCourse.title}
              {String(selectedCourse.status).toUpperCase() === "DRAFT"
                ? " (draft — student may have limited public visibility)"
                : ""}
            </p>
          ) : null}
          {!coursesLoading && filteredCourses.length === 0 ? (
            <p className="text-xs text-muted-foreground">No courses match this filter.</p>
          ) : null}
        </div>

        {formError ? (
          <p className="rounded-lg border border-[#fecdca] bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]">
            {formError}
          </p>
        ) : null}
      </div>
    </AdminModal>
  );
}

export function AdminEnrollmentsPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<StatusTab>("ALL");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [grantPracticeOpen, setGrantPracticeOpen] = useState(false);

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
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setGrantPracticeOpen(true)}>
              <UserPlus className="h-4 w-4" aria-hidden />
              Grant practice access
            </Button>
            <Button type="button" size="sm" onClick={() => setEnrollOpen(true)}>
              <UserPlus className="h-4 w-4" aria-hidden />
              Enroll student
            </Button>
            <AdminIconAction
              label="Refresh"
              icon={RefreshCw}
              tone="primary"
              disabled={isFetching}
              onClick={() => void refetch()}
              className={isFetching ? "animate-spin" : undefined}
            />
          </div>
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

      <div
        className={cn(
          "overflow-x-auto transition-opacity duration-150",
          isFetching ? "pointer-events-none opacity-60" : "opacity-100"
        )}
      >
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">Student</th>
              <th className="px-5 py-3 font-semibold">Course</th>
              <th className="px-5 py-3 font-semibold">Progress</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Enrolled / Access</th>
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
                    <div>{formatShortDate(enrollment.enrolledAt)}</div>
                    <div className="mt-0.5 text-xs">
                      {enrollment.expiresAt
                        ? `Until ${formatShortDate(enrollment.expiresAt)}`
                        : "Lifetime"}
                    </div>
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

      <AdminEnrollStudentModal open={enrollOpen} onClose={() => setEnrollOpen(false)} />
      <AdminGrantPracticeAccessModal
        open={grantPracticeOpen}
        onClose={() => setGrantPracticeOpen(false)}
      />
    </div>
  );
}
