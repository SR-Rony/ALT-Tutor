"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Square,
  Trash2,
  Users,
} from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import {
  LIVE_CLASS_PROVIDERS,
  LiveClassStatusBadge,
  formatLiveClassWhen,
  fromDatetimeLocalValue,
  liveClassCountdown,
  providerLabel,
  toDatetimeLocalValue,
} from "@/components/live-classes/live-class-shared";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateLiveClass,
  useDeleteLiveClass,
  useEndLiveClass,
  useGoLiveLiveClass,
  useLiveClassAttendance,
  useStaffLiveClasses,
  useUpdateLiveClass,
} from "@/hooks";
import type { ApiError } from "@/types";
import type {
  CreateLiveClassInput,
  LiveClass,
  LiveClassProvider,
  LiveClassStatus,
  UpdateLiveClassInput,
} from "@/types/live-class.types";
import { cn } from "@/utils";

type CourseOption = { id: string; title: string };

type FormState = {
  courseId: string;
  title: string;
  description: string;
  provider: LiveClassProvider;
  joinUrl: string;
  hostUrl: string;
  startsAt: string;
  endsAt: string;
  recordingUrl: string;
  status: LiveClassStatus;
};

const emptyForm = (courseId = ""): FormState => ({
  courseId,
  title: "",
  description: "",
  provider: "ZOOM",
  joinUrl: "",
  hostUrl: "",
  startsAt: "",
  endsAt: "",
  recordingUrl: "",
  status: "SCHEDULED",
});

type Props = {
  roleLabel: "Teacher" | "Admin";
  courses: CourseOption[];
  coursesLoading?: boolean;
};

export function StaffLiveClassesPage({ roleLabel, courses, coursesLoading }: Props) {
  const [courseFilter, setCourseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<LiveClassStatus | "">("");
  const [search, setSearch] = useState("");

  const query = useMemo(
    () => ({
      courseId: courseFilter || undefined,
      status: statusFilter || undefined,
      q: search.trim() || undefined,
    }),
    [courseFilter, statusFilter, search]
  );

  const { data = [], isLoading, error, refetch, isFetching } = useStaffLiveClasses(query);
  const createMutation = useCreateLiveClass();
  const updateMutation = useUpdateLiveClass();
  const deleteMutation = useDeleteLiveClass();
  const goLiveMutation = useGoLiveLiveClass();
  const endMutation = useEndLiveClass();

  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<LiveClass | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [actionError, setActionError] = useState<string | null>(null);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);

  const attendanceQuery = useLiveClassAttendance(attendanceId ?? undefined, Boolean(attendanceId));

  const openCreate = () => {
    setActionError(null);
    setEditing(null);
    setForm(emptyForm(courseFilter || courses[0]?.id || ""));
    setModal("create");
  };

  const openEdit = (row: LiveClass) => {
    setActionError(null);
    setEditing(row);
    setForm({
      courseId: row.courseId,
      title: row.title,
      description: row.description ?? "",
      provider: row.provider,
      joinUrl: row.joinUrl,
      hostUrl: row.hostUrl ?? "",
      startsAt: toDatetimeLocalValue(row.startsAt),
      endsAt: toDatetimeLocalValue(row.endsAt),
      recordingUrl: row.recordingUrl ?? "",
      status: row.status,
    });
    setModal("edit");
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    setActionError(null);
    try {
      if (!form.courseId) throw new Error("Select a course");
      if (!form.title.trim()) throw new Error("Title is required");
      if (!form.joinUrl.trim().startsWith("https://")) {
        throw new Error("Join URL must start with https://");
      }
      if (form.hostUrl && !form.hostUrl.trim().startsWith("https://")) {
        throw new Error("Host URL must start with https://");
      }
      if (form.recordingUrl && !form.recordingUrl.trim().startsWith("https://")) {
        throw new Error("Recording URL must start with https://");
      }

      const startsAt = fromDatetimeLocalValue(form.startsAt);
      const endsAt = fromDatetimeLocalValue(form.endsAt);

      if (modal === "create") {
        const payload: CreateLiveClassInput = {
          courseId: form.courseId,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          provider: form.provider,
          joinUrl: form.joinUrl.trim(),
          hostUrl: form.hostUrl.trim() || undefined,
          startsAt,
          endsAt,
          timezone: "Asia/Dhaka",
        };
        await createMutation.mutateAsync(payload);
      } else if (modal === "edit" && editing) {
        const payload: UpdateLiveClassInput = {
          title: form.title.trim(),
          description: form.description.trim() || null,
          provider: form.provider,
          joinUrl: form.joinUrl.trim(),
          hostUrl: form.hostUrl.trim() || null,
          startsAt,
          endsAt,
          status: form.status,
          recordingUrl: form.recordingUrl.trim() || null,
        };
        await updateMutation.mutateAsync({ id: editing.id, payload });
      }
      setModal(null);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save");
    }
  };

  const saving =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    goLiveMutation.isPending ||
    endMutation.isPending;

  if ((isLoading || coursesLoading) && data.length === 0 && courses.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Live Classes"
          description={`Schedule and manage external meeting sessions (${roleLabel}).`}
          className="mb-0"
        />
        <PageLoader label="Loading live classes..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-6">
          <PageHeader
            title="Live Classes"
            description="Schedule Zoom, Google Meet, or Jitsi sessions for enrolled students. Join opens 15 minutes before start."
            className="mb-0"
          />
          <div className="flex flex-wrap items-center gap-2">
            <AdminIconAction
              label="Refresh"
              icon={RefreshCw}
              onClick={() => void refetch()}
              className={cn(isFetching && "animate-spin")}
            />
            <Button type="button" size="sm" onClick={openCreate} disabled={!courses.length}>
              <Plus className="h-4 w-4" />
              Schedule class
            </Button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex flex-wrap gap-3">
            <select
              className="h-10 min-w-[180px] rounded-xl border border-border bg-card px-3 text-sm"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <select
              className="h-10 min-w-[140px] rounded-xl border border-border bg-card px-3 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as LiveClassStatus | "")}
            >
              <option value="">All statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="LIVE">Live</option>
              <option value="ENDED">Ended</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <Input
              className="max-w-xs"
              placeholder="Search title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {(error as unknown as ApiError)?.message || "Failed to load"}
            </p>
          ) : null}

          {!courses.length ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No courses available to schedule against yet.
            </p>
          ) : null}

          {data.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No live classes match these filters.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Class</th>
                    <th className="px-4 py-3 font-semibold">When</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.id} className="border-t border-border/80">
                      <td className="px-4 py-3 align-top">
                        <p className="font-semibold text-foreground">{row.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.course.title} · {providerLabel(row.provider)}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground">
                        <p>{formatLiveClassWhen(row.startsAt, row.timezone)}</p>
                        <p className="text-xs">{liveClassCountdown(row.startsAt, row.status)}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <LiveClassStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 align-top text-muted-foreground">
                        {row._count?.attendance ?? 0}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap justify-end gap-1">
                          {row.status === "SCHEDULED" || row.status === "LIVE" ? (
                            <AdminIconAction
                              label={row.status === "LIVE" ? "Already live" : "Go live"}
                              icon={Radio}
                              disabled={row.status === "LIVE" || saving}
                              onClick={() => void goLiveMutation.mutateAsync(row.id)}
                            />
                          ) : null}
                          {row.status === "LIVE" || row.status === "SCHEDULED" ? (
                            <AdminIconAction
                              label="End class"
                              icon={Square}
                              disabled={saving}
                              onClick={() => void endMutation.mutateAsync(row.id)}
                            />
                          ) : null}
                          <AdminIconAction
                            label="Copy join link"
                            icon={Copy}
                            onClick={() => void navigator.clipboard.writeText(row.joinUrl)}
                          />
                          {row.hostUrl ? (
                            <AdminIconAction
                              label="Open host link"
                              icon={ExternalLink}
                              onClick={() =>
                                window.open(row.hostUrl!, "_blank", "noopener,noreferrer")
                              }
                            />
                          ) : null}
                          <AdminIconAction
                            label="Attendance"
                            icon={Users}
                            onClick={() => setAttendanceId(row.id)}
                          />
                          <AdminIconAction
                            label="Edit"
                            icon={Pencil}
                            onClick={() => openEdit(row)}
                          />
                          <AdminIconAction
                            label="Cancel / delete"
                            icon={Trash2}
                            disabled={saving}
                            onClick={() => {
                              if (
                                window.confirm(
                                  roleLabel === "Admin"
                                    ? `Delete "${row.title}" permanently?`
                                    : `Cancel "${row.title}" for students?`
                                )
                              ) {
                                void deleteMutation.mutateAsync(row.id);
                              }
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AdminModal
        open={modal !== null}
        title={modal === "create" ? "Schedule live class" : "Edit live class"}
        description="Students join via the meeting link. Host link stays staff-only."
        onClose={() => setModal(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onSave()} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {actionError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {actionError}
            </p>
          ) : null}
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">Course</span>
            <select
              className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              value={form.courseId}
              disabled={modal === "edit"}
              onChange={(e) => setField("courseId", e.target.value)}
            >
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">Title</span>
            <Input value={form.title} onChange={(e) => setField("title", e.target.value)} />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">Description</span>
            <textarea
              className="min-h-[80px] w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-foreground">Provider</span>
              <select
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                value={form.provider}
                onChange={(e) => setField("provider", e.target.value as LiveClassProvider)}
              >
                {LIVE_CLASS_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            {modal === "edit" ? (
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-foreground">Status</span>
                <select
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value as LiveClassStatus)}
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="LIVE">Live</option>
                  <option value="ENDED">Ended</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>
            ) : null}
          </div>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">Student join URL (https)</span>
            <Input
              value={form.joinUrl}
              placeholder="https://zoom.us/j/…"
              onChange={(e) => setField("joinUrl", e.target.value)}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-foreground">Host URL (optional, staff only)</span>
            <Input
              value={form.hostUrl}
              placeholder="https://…"
              onChange={(e) => setField("hostUrl", e.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-foreground">Starts</span>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setField("startsAt", e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-foreground">Ends</span>
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setField("endsAt", e.target.value)}
              />
            </label>
          </div>
          {modal === "edit" ? (
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-foreground">Recording URL (optional)</span>
              <Input
                value={form.recordingUrl}
                placeholder="https://…"
                onChange={(e) => setField("recordingUrl", e.target.value)}
              />
            </label>
          ) : null}
        </div>
      </AdminModal>

      <AdminModal
        open={Boolean(attendanceId)}
        title="Attendance"
        description={
          attendanceQuery.data
            ? `${attendanceQuery.data.total} student(s) joined · ${attendanceQuery.data.liveClass.title}`
            : "Students who opened the join link"
        }
        onClose={() => setAttendanceId(null)}
      >
        {attendanceQuery.isLoading ? (
          <PageLoader label="Loading attendance..." />
        ) : attendanceQuery.data?.records.length ? (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {attendanceQuery.data.records.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">{r.student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.student.email || r.student.phone || "—"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatLiveClassWhen(r.joinedAt)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No students have joined yet.</p>
        )}
      </AdminModal>
    </div>
  );
}
