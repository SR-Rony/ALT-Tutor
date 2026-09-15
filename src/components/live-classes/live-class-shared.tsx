import { cn } from "@/utils";
import type { LiveClassProvider, LiveClassStatus } from "@/types/live-class.types";

export const LIVE_CLASS_PROVIDERS: { value: LiveClassProvider; label: string }[] = [
  { value: "ZOOM", label: "Zoom" },
  { value: "GOOGLE_MEET", label: "Google Meet" },
  { value: "JITSI", label: "Jitsi" },
  { value: "OTHER", label: "Other" },
];

export function providerLabel(provider: LiveClassProvider) {
  return LIVE_CLASS_PROVIDERS.find((p) => p.value === provider)?.label ?? provider;
}

export function formatLiveClassWhen(iso: string, timeZone = "Asia/Dhaka") {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

/** Compact clock time for attendance rows. */
export function formatLiveClassTime(iso: string, timeZone = "Asia/Dhaka") {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleTimeString();
  }
}

/** How early/late a student joined relative to class start. */
export function formatJoinOffset(joinedAt: string, startsAt: string) {
  const deltaMs = new Date(joinedAt).getTime() - new Date(startsAt).getTime();
  const absMins = Math.round(Math.abs(deltaMs) / 60000);
  if (absMins < 1) return "At start";
  const label =
    absMins < 60
      ? `${absMins}m`
      : `${Math.floor(absMins / 60)}h ${absMins % 60}m`;
  if (deltaMs < 0) return `${label} early`;
  return `${label} after start`;
}

export function liveClassCountdown(startsAt: string, status: LiveClassStatus) {
  if (status === "LIVE") return "Live now";
  if (status === "ENDED") return "Ended";
  if (status === "CANCELLED") return "Cancelled";
  const ms = new Date(startsAt).getTime() - Date.now();
  if (ms <= 0) return "Starting soon";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `Starts in ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `Starts in ${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return `Starts in ${days}d`;
}

export function LiveClassStatusBadge({ status }: { status: LiveClassStatus }) {
  const styles: Record<LiveClassStatus, string> = {
    SCHEDULED: "bg-sky-50 text-sky-800 ring-sky-200",
    LIVE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    ENDED: "bg-slate-100 text-slate-600 ring-slate-200",
    CANCELLED: "bg-rose-50 text-rose-800 ring-rose-200",
  };
  const labels: Record<LiveClassStatus, string> = {
    SCHEDULED: "Scheduled",
    LIVE: "Live",
    ENDED: "Ended",
    CANCELLED: "Cancelled",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}

/** datetime-local value from ISO (local browser time). */
export function toDatetimeLocalValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date/time");
  return d.toISOString();
}
