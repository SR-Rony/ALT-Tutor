"use client";

import { ListPagination, PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  useClientPagination,
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
  const { page, setPage, pageItems, total, totalPages, from, to } =
    useClientPagination(data);

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
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <ul className="divide-y divide-border/80">
            {pageItems.map((note) => (
              <li
                key={note.id}
                className={cn(
                  "flex items-start justify-between gap-4 px-4 py-4 sm:px-5",
                  note.isRead ? "bg-card" : "bg-primary/[0.04]"
                )}
              >
                <div className="min-w-0">
                  {!note.isRead ? (
                    <span className="mb-1.5 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      Unread
                    </span>
                  ) : null}
                  <p className="text-sm font-medium leading-relaxed text-foreground">
                    {note.message}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {formatShortDate(note.createdAt)}
                  </p>
                </div>
                {!note.isRead ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={markRead.isPending}
                    onClick={() => void markRead.mutateAsync(note.id)}
                  >
                    Mark read
                  </Button>
                ) : (
                  <span className="shrink-0 pt-1 text-xs font-medium text-muted-foreground">
                    Read
                  </span>
                )}
              </li>
            ))}
          </ul>
          <ListPagination
            page={page}
            totalPages={totalPages}
            total={total}
            from={from}
            to={to}
            onPageChange={setPage}
            label="notifications"
          />
        </div>
      )}
    </div>
  );
}
