"use client";

import { useMemo, useState } from "react";
import { Download, RefreshCw, Search, Users } from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import {
  LiveClassStatusBadge,
  formatJoinOffset,
  formatLiveClassTime,
  formatLiveClassWhen,
  providerLabel,
} from "@/components/live-classes/live-class-shared";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLiveClassAttendance } from "@/hooks";
import type { ApiError } from "@/types";
import type { LiveClassAttendanceRecord } from "@/types/live-class.types";
import { cn, getInitials } from "@/utils";

type Props = {
  liveClassId: string | null;
  onClose: () => void;
};

function downloadAttendanceCsv(
  title: string,
  startsAt: string,
  timezone: string,
  records: LiveClassAttendanceRecord[]
) {
  const headers = ["#", "Name", "Email", "Phone", "Joined at", "Relative to start"];
  const rows = records.map((r, index) => [
    String(index + 1),
    r.student.name,
    r.student.email ?? "",
    r.student.phone ?? "",
    formatLiveClassWhen(r.joinedAt, timezone),
    formatJoinOffset(r.joinedAt, startsAt),
  ]);
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safe = title.replace(/[^\w\-]+/g, "_").slice(0, 48) || "attendance";
  a.href = url;
  a.download = `${safe}-attendance.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StudentAvatar({ name, avatar }: { name: string; avatar?: string | null }) {
  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt=""
        className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
      />
    );
  }
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-1 ring-border">
      {getInitials(name) || "?"}
    </span>
  );
}

export function LiveClassAttendanceModal({ liveClassId, onClose }: Props) {
  const open = Boolean(liveClassId);
  const [search, setSearch] = useState("");

  const query = useLiveClassAttendance(liveClassId ?? undefined, open);

  const data = query.data;
  const timezone = data?.liveClass.timezone ?? "Asia/Dhaka";
  const startsAt = data?.liveClass.startsAt ?? "";

  const filtered = useMemo(() => {
    const records = data?.records ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      const hay = [r.student.name, r.student.email, r.student.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [data?.records, search]);

  const enrolledCount = data?.enrolledCount ?? 0;
  const total = data?.total ?? 0;
  const rate = data?.attendanceRate;
  const absentCount = Math.max(enrolledCount - total, 0);

  return (
    <AdminModal
      open={open}
      title="Attendance details"
      description={
        data
          ? `${data.liveClass.title} · ${providerLabel(data.liveClass.provider)}`
          : "Who joined this live class and when"
      }
      onClose={() => {
        setSearch("");
        onClose();
      }}
      className="sm:max-w-3xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Join is recorded when a student clicks Join in the app (not Meet/Zoom presence).
          </p>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      {query.isLoading ? (
        <PageLoader label="Loading attendance..." />
      ) : query.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {(query.error as unknown as ApiError)?.message || "Failed to load attendance"}
        </p>
      ) : data ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <LiveClassStatusBadge status={data.liveClass.status} />
                <span className="text-sm text-muted-foreground">
                  {formatLiveClassWhen(data.liveClass.startsAt, timezone)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{data.liveClass.course.title}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void query.refetch()}
                disabled={query.isFetching}
              >
                <RefreshCw className={cn("h-4 w-4", query.isFetching && "animate-spin")} />
                Refresh
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!data.records.length}
                onClick={() =>
                  downloadAttendanceCsv(
                    data.liveClass.title,
                    data.liveClass.startsAt,
                    timezone,
                    data.records
                  )
                }
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Joined
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{total}</p>
              {data.firstJoinedAt ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  First: {formatLiveClassTime(data.firstJoinedAt, timezone)}
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Enrolled
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {enrolledCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {absentCount} not joined yet
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Attendance rate
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                {rate == null ? "—" : `${rate}%`}
              </p>
              {data.lastJoinedAt ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Latest: {formatLiveClassTime(data.lastJoinedAt, timezone)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name, email, or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {data.records.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-10 text-center">
              <Users className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">No joins yet</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Students appear here when they open the join link from Live Classes (starting 15
                minutes before class).
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No students match “{search.trim()}”.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">#</th>
                    <th className="px-3 py-2.5 font-semibold">Student</th>
                    <th className="px-3 py-2.5 font-semibold">Joined at</th>
                    <th className="px-3 py-2.5 font-semibold">Timing</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, index) => (
                    <tr key={r.id} className="border-t border-border/80">
                      <td className="px-3 py-3 align-middle tabular-nums text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <StudentAvatar name={r.student.name} avatar={r.student.avatar} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {r.student.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {r.student.email || r.student.phone || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <p className="font-medium tabular-nums text-foreground">
                          {formatLiveClassTime(r.joinedAt, timezone)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatLiveClassWhen(r.joinedAt, timezone)}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-middle">
                        <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {formatJoinOffset(r.joinedAt, startsAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {search.trim() && filtered.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {total} joined student{total === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      ) : null}
    </AdminModal>
  );
}
