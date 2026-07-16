"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Headphones,
  Inbox,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminSupportContacts } from "@/hooks";
import { formatShortDate } from "@/lib/format";
import type { ApiError } from "@/types";
import type { SupportContactMessage, SupportInboxFilter } from "@/types/admin-support-management.types";
import { cn } from "@/utils";

const READ_KEY = "alt-tutor-support-read-ids";

function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(READ_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  window.localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek() {
  const d = startOfToday();
  d.setDate(d.getDate() - 6);
  return d;
}

function isToday(iso: string) {
  return new Date(iso) >= startOfToday();
}

function isThisWeek(iso: string) {
  return new Date(iso) >= startOfWeek();
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatShortDate(iso);
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AdminSupportManagementPage() {
  const { data = [], isLoading, error, refetch, isFetching } = useAdminSupportContacts();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SupportInboxFilter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setReadIds(loadReadIds());
  }, []);

  useEffect(() => {
    if (!selectedId && data.length > 0) {
      setSelectedId(data[0].id);
    }
  }, [data, selectedId]);

  const stats = useMemo(() => {
    const unread = data.filter((m) => !readIds.has(m.id)).length;
    return {
      total: data.length,
      today: data.filter((m) => isToday(m.createdAt)).length,
      week: data.filter((m) => isThisWeek(m.createdAt)).length,
      unread,
    };
  }, [data, readIds]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((item) => {
      if (filter === "TODAY" && !isToday(item.createdAt)) return false;
      if (filter === "WEEK" && !isThisWeek(item.createdAt)) return false;
      if (filter === "UNREAD" && readIds.has(item.id)) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.email ?? "").toLowerCase().includes(q) ||
        (item.phone ?? "").toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q)
      );
    });
  }, [data, search, filter, readIds]);

  const selected = useMemo(
    () => visible.find((m) => m.id === selectedId) ?? data.find((m) => m.id === selectedId) ?? null,
    [visible, data, selectedId]
  );

  const markRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  };

  const markUnread = (id: string) => {
    setReadIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      saveReadIds(next);
      return next;
    });
  };

  const selectMessage = (item: SupportContactMessage) => {
    setSelectedId(item.id);
    markRead(item.id);
  };

  if (isLoading && data.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Support Inbox"
          description="Contact form messages from students and visitors."
          className="mb-0"
        />
        <PageLoader label="Loading support messages..." />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title="Support Inbox"
          description="Review and reply to contact form submissions from the public site."
          className="mb-0"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="border-primary/20"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Failed to load support messages."}
        </p>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Inbox className="h-4 w-4" />}
          label="Total messages"
          value={stats.total}
          tone="primary"
        />
        <StatCard
          icon={<Clock3 className="h-4 w-4" />}
          label="Today"
          value={stats.today}
          tone="green"
        />
        <StatCard
          icon={<Headphones className="h-4 w-4" />}
          label="This week"
          value={stats.week}
          tone="muted"
        />
        <StatCard
          icon={<Mail className="h-4 w-4" />}
          label="Unread"
          value={stats.unread}
          tone="accent"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:p-4">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone, or message..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["ALL", "All"],
              ["UNREAD", "Unread"],
              ["TODAY", "Today"],
              ["WEEK", "This week"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-primary-muted hover:text-primary"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Inbox layout */}
      <div className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)] lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        {/* Message list */}
        <div className="border-b border-border lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-border bg-primary-muted/40 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              Messages
              <span className="ml-2 text-muted-foreground">({visible.length})</span>
            </p>
          </div>

          <div className="max-h-[28rem] overflow-y-auto lg:max-h-[calc(100vh-22rem)]">
            {visible.length === 0 ? (
              <div className="px-4 py-16 text-center text-sm text-muted-foreground">
                No messages match this filter.
              </div>
            ) : (
              <ul>
                {visible.map((item) => {
                  const unread = !readIds.has(item.id);
                  const active = selected?.id === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => selectMessage(item)}
                        className={cn(
                          "flex w-full gap-3 border-b border-border/70 px-4 py-3.5 text-left transition",
                          active
                            ? "bg-primary-muted/70"
                            : "hover:bg-muted/60",
                          unread && !active && "bg-card"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                            unread
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {initials(item.name) || "?"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span
                              className={cn(
                                "truncate text-sm",
                                unread ? "font-bold text-foreground" : "font-medium text-foreground"
                              )}
                            >
                              {item.name}
                            </span>
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {formatRelative(item.createdAt)}
                            </span>
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {item.email || item.phone || "No contact info"}
                          </span>
                          <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {item.message}
                          </span>
                          {unread ? (
                            <span className="mt-2 inline-flex rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                              New
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex min-h-[22rem] flex-col bg-gradient-to-br from-primary-muted/30 via-card to-card">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-muted text-primary">
                <Inbox className="h-7 w-7" />
              </div>
              <p className="text-base font-semibold text-foreground">Select a message</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Choose a contact submission from the list to read the full message and reply.
              </p>
            </div>
          ) : (
            <>
              <div className="border-b border-border px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
                      {initials(selected.name) || "?"}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold text-foreground">{selected.name}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Received {formatShortDate(selected.createdAt)} · {formatRelative(selected.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {readIds.has(selected.id) ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => markUnread(selected.id)}
                      >
                        Mark unread
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => markRead(selected.id)}
                      >
                        Mark read
                      </Button>
                    )}
                    {selected.email ? (
                      <Button asChild size="sm">
                        <a
                          href={`mailto:${selected.email}?subject=${encodeURIComponent(
                            `Re: Your message to Alt Tutor`
                          )}`}
                        >
                          <Mail className="h-4 w-4" />
                          Reply by email
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <InfoChip icon={<UserRound className="h-3.5 w-3.5" />} label={selected.name} />
                  {selected.email ? (
                    <InfoChip icon={<Mail className="h-3.5 w-3.5" />} label={selected.email} />
                  ) : null}
                  {selected.phone ? (
                    <InfoChip icon={<Phone className="h-3.5 w-3.5" />} label={selected.phone} />
                  ) : null}
                </div>
              </div>

              <div className="flex-1 px-5 py-5 sm:px-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Message
                </p>
                <div className="rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground shadow-sm sm:p-5">
                  <p className="whitespace-pre-wrap">{selected.message}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: "primary" | "green" | "accent" | "muted";
}) {
  const tones = {
    primary: "bg-primary-muted text-primary",
    green: "bg-[#ecfdf3] text-accent-green",
    accent: "bg-accent/10 text-accent",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className={cn("mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg", tones[tone])}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
    </div>
  );
}

function InfoChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">
      <span className="text-primary">{icon}</span>
      <span className="truncate">{label}</span>
    </span>
  );
}
