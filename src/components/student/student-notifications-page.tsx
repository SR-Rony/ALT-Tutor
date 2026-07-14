"use client";

import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useStudentNotifications,
} from "@/hooks";
import { formatShortDate } from "@/lib/format";
import type { ApiError } from "@/types";
import { cn } from "@/utils";

export function StudentNotificationsPage() {
  const { data = [], isLoading, error, refetch } = useStudentNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = data.filter((n) => !n.isRead).length;

  if (isLoading && data.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" description="Updates from your courses." className="mb-0" />
        <PageLoader label="Loading notifications..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Notifications"
          description={`${unread} unread · ${data.length} total`}
          className="mb-0"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={markAll.isPending || unread === 0}
          onClick={() => void markAll.mutateAsync()}
        >
          Mark all read
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Failed to load"}
          <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
            Retry
          </button>
        </p>
      ) : null}

      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center text-sm text-muted-foreground">
          No notifications yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((note) => (
            <li
              key={note.id}
              className={cn(
                "flex items-start justify-between gap-4 rounded-2xl border px-4 py-4",
                note.isRead
                  ? "border-border bg-card"
                  : "border-primary/20 bg-primary/[0.04] shadow-[0_8px_24px_rgba(24,119,242,0.06)]"
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{note.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatShortDate(note.createdAt)}</p>
              </div>
              {!note.isRead ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={markRead.isPending}
                  onClick={() => void markRead.mutateAsync(note.id)}
                >
                  Mark read
                </Button>
              ) : (
                <span className="shrink-0 text-xs font-medium text-muted-foreground">Read</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
