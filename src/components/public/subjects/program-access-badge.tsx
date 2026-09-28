"use client";

import { CalendarCheck2 } from "lucide-react";
import { useMyProgramAccess } from "@/hooks";
import { formatAccessRemaining, formatShortDate } from "@/lib/format";
import { useAppSelector } from "@/store";
import type { ProgramAccessSource } from "@/types/student-dashboard.types";
import { cn } from "@/utils";

const SOURCE_LABEL: Record<ProgramAccessSource, string> = {
  GOLD_PASS: "Gold Pass",
  ADMIN_GRANT: "Gold (admin grant)",
  COURSE: "Gold via course",
};

/** Student's Gold access for this subject with purchase and expiry dates. Renders nothing without access. */
export function ProgramAccessBadge({
  programSlug,
  className,
}: {
  programSlug: string;
  className?: string;
}) {
  const role = useAppSelector((s) => s.auth.user?.role);
  const isStudent = String(role ?? "").toUpperCase() === "STUDENT";
  const { data } = useMyProgramAccess(programSlug, isStudent);

  if (!isStudent || !data || !data.source || String(data.tier).toUpperCase() === "FREE") {
    return null;
  }

  const remaining = formatAccessRemaining(data.expiresAt);

  return (
    <div
      className={cn(
        "inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[#abeec5] bg-[#ecfdf3] px-3 py-2 text-xs text-[#067647]",
        className
      )}
    >
      <span className="inline-flex items-center gap-1.5 font-bold">
        <CalendarCheck2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {SOURCE_LABEL[data.source]} active
      </span>
      {data.purchasedAt ? (
        <span>
          Purchased <span className="font-semibold">{formatShortDate(data.purchasedAt)}</span>
        </span>
      ) : null}
      <span>
        Expires{" "}
        <span className="font-semibold">
          {data.expiresAt ? formatShortDate(data.expiresAt) : "never (lifetime)"}
        </span>
        {remaining.daysLeft != null ? ` · ${remaining.daysLeft} day${remaining.daysLeft === 1 ? "" : "s"} left` : ""}
      </span>
    </div>
  );
}
