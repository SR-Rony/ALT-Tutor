"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  RefreshCw,
  Video,
} from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import {
  LiveClassStatusBadge,
  formatLiveClassWhen,
  liveClassCountdown,
  providerLabel,
} from "@/components/live-classes/live-class-shared";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useJoinLiveClass, useStudentLiveClasses } from "@/hooks";
import type { ApiError } from "@/types";
import type { StudentLiveClass } from "@/types/live-class.types";
import { cn } from "@/utils";

function sectionTitle(key: "live" | "upcoming" | "past") {
  if (key === "live") return "Happening now";
  if (key === "upcoming") return "Upcoming";
  return "Recent & recordings";
}

function bucketClasses(rows: StudentLiveClass[]) {
  const live: StudentLiveClass[] = [];
  const upcoming: StudentLiveClass[] = [];
  const past: StudentLiveClass[] = [];
  for (const row of rows) {
    if (row.status === "LIVE") live.push(row);
    else if (row.status === "SCHEDULED") upcoming.push(row);
    else past.push(row);
  }
  upcoming.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  past.sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));
  return { live, upcoming, past };
}

function LiveClassCard({
  row,
  joiningId,
  onJoin,
}: {
  row: StudentLiveClass;
  joiningId: string | null;
  onJoin: (id: string) => void;
}) {
  const isPast = row.status === "ENDED" || row.status === "CANCELLED";

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {row.course.title}
          </p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground">{row.title}</h3>
        </div>
        <LiveClassStatusBadge status={row.status} />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {formatLiveClassWhen(row.startsAt, row.timezone)}
        <span className="mx-1.5 text-border">·</span>
        {liveClassCountdown(row.startsAt, row.status)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {providerLabel(row.provider)} · Host {row.host.name}
        {row.attended ? " · Attended" : null}
      </p>
      {row.description ? (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {row.description}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
        {!isPast ? (
          <Button
            type="button"
            size="sm"
            disabled={!row.canJoin || joiningId === row.id}
            onClick={() => onJoin(row.id)}
            title={row.joinBlockedReason ?? undefined}
          >
            <Video className="h-4 w-4" />
            {joiningId === row.id ? "Opening…" : "Join class"}
          </Button>
        ) : null}
        {row.recordingUrl ? (
          <Button asChild type="button" size="sm" variant="outline">
            <a href={row.recordingUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              Recording
            </a>
          </Button>
        ) : null}
        <Button asChild type="button" size="sm" variant="ghost">
          <Link href={ROUTES.student.courseLearn(row.course.slug)}>Course</Link>
        </Button>
        {!row.canJoin && !isPast && row.joinBlockedReason ? (
          <p className="w-full text-xs text-muted-foreground">{row.joinBlockedReason}</p>
        ) : null}
      </div>
    </article>
  );
}

export function StudentLiveClassesPage() {
  const { data = [], isLoading, error, refetch, isFetching } = useStudentLiveClasses();
  const joinMutation = useJoinLiveClass();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const buckets = useMemo(() => bucketClasses(data), [data]);

  const onJoin = async (id: string) => {
    setActionError(null);
    setJoiningId(id);
    try {
      const result = await joinMutation.mutateAsync(id);
      window.open(result.joinUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setActionError((err as ApiError)?.message || "Could not join class");
    } finally {
      setJoiningId(null);
    }
  };

  if (isLoading && data.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Live Classes"
          description="Upcoming and recent sessions for your enrolled courses."
          className="mb-0"
        />
        <PageLoader label="Loading live classes..." />
      </div>
    );
  }

  const sections: Array<{ key: "live" | "upcoming" | "past"; rows: StudentLiveClass[] }> = [
    { key: "live", rows: buckets.live },
    { key: "upcoming", rows: buckets.upcoming },
    { key: "past", rows: buckets.past },
  ];

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-6">
          <PageHeader
            title="Live Classes"
            description="Join Zoom, Meet, or Jitsi sessions scheduled for your courses. Join opens 15 minutes before start."
            className="mb-0"
          />
          <AdminIconAction
            label="Refresh"
            icon={RefreshCw}
            onClick={() => void refetch()}
            className={cn(isFetching && "animate-spin")}
          />
        </div>

        <div className="space-y-8 px-5 py-6">
          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {(error as unknown as ApiError)?.message || "Failed to load live classes"}
            </p>
          ) : null}
          {actionError ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {actionError}
            </p>
          ) : null}

          {data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
              <Video className="mx-auto h-10 w-10 text-primary/40" />
              <p className="mt-3 text-base font-semibold text-foreground">No live classes yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                When your teacher schedules a session for an enrolled course, it will appear here.
              </p>
              <Button asChild className="mt-5" size="sm" variant="outline">
                <Link href={ROUTES.student.courses}>Browse my courses</Link>
              </Button>
            </div>
          ) : (
            sections.map(({ key, rows }) =>
              rows.length === 0 ? null : (
                <section key={key} className="space-y-3">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    {sectionTitle(key)}
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {rows.map((row) => (
                      <LiveClassCard
                        key={row.id}
                        row={row}
                        joiningId={joiningId}
                        onJoin={onJoin}
                      />
                    ))}
                  </div>
                </section>
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}
