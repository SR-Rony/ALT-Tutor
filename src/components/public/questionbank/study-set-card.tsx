"use client";

import Link from "next/link";
import { CheckCircle2, Lock, Timer, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeAccessBadge, tierBadgeClass, tierLabel } from "@/lib/access-tier";
import { formatMoney, formatShortDate } from "@/lib/format";
import { richTextToPlain } from "@/lib/rich-text";
import { studySetPrice, studySetRegularPrice } from "@/lib/study-set-pricing";
import type { QbSubtopic } from "@/types/qb.types";
import { cn } from "@/utils";

/** "1. Algebra" / "Topic 1: Algebra" → "Algebra" for display. */
export function topicDisplayTitle(title: string): string {
  const plain = richTextToPlain(title) || title;
  return (
    plain
      .replace(/^\s*topic\s*\d+\s*[.:)\-–—]\s*/i, "")
      .replace(/^\s*\d+(?:\.\d+)?\s*[.:)\-–—]\s*/, "")
      .trim() || plain
  );
}

/** Strip leading "1.1 " / "A.1 - " so we can re-apply the serial consistently. */
export function studySetBaseTitle(title: string): string {
  const plain = richTextToPlain(title) || title;
  return (
    plain
      .replace(/^\s*\d+(\.\d+)?\s*[.:)\-–—]?\s*/, "")
      .replace(/^\s*[A-Za-z]\.\d+\s*[-–—]\s*/, "")
      .trim() || plain
  );
}

export function StudySetCard({
  sub,
  serial,
  locked,
  onUnlock,
  onOpenStudy,
  examHref,
}: {
  sub: QbSubtopic;
  serial: string;
  locked: boolean;
  onUnlock: () => void;
  onOpenStudy: () => void;
  /** Optional shortcut into the timed exam for this set (shown when unlocked). */
  examHref?: string;
}) {
  const badge = normalizeAccessBadge(sub.badge);
  const isPaid = badge !== "FREE";
  const price = isPaid ? studySetPrice(sub) : null;
  const regularPrice = isPaid ? studySetRegularPrice(sub) : null;
  const preview =
    richTextToPlain(sub.description ?? "") ||
    `${sub._count?.questions ?? 0} practice questions in this study set.`;
  const displayTitle = `${serial} ${studySetBaseTitle(sub.title)}`;

  return (
    <article className="relative flex h-full flex-col rounded-xl border border-border/80 bg-white px-5 pb-5 pt-7 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition hover:border-primary/25 hover:shadow-[0_8px_24px_-16px_rgba(24,119,242,0.25)]">
      {isPaid ? (
        <span
          className={cn(
            "absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm",
            tierBadgeClass(badge)
          )}
        >
          {locked ? <Lock className="h-3 w-3" aria-hidden /> : <Unlock className="h-3 w-3" aria-hidden />}
          {tierLabel(badge)}
        </span>
      ) : null}

      <h3 className="text-base font-bold leading-snug text-foreground">{displayTitle}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{preview}</p>

      {isPaid && sub.purchased && !locked ? (
        <p className="mt-4 inline-flex items-center justify-center gap-1.5 self-center rounded-full bg-[#ecfdf3] px-2.5 py-1 text-xs font-semibold text-[#067647]">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Unlocked
          {sub.accessExpiresAt ? ` · until ${formatShortDate(sub.accessExpiresAt)}` : ""}
        </p>
      ) : null}

      {isPaid && locked && price != null ? (
        <p className="mt-4 flex items-baseline justify-center gap-2">
          <span className="text-lg font-extrabold text-foreground">{formatMoney(price)}</span>
          {regularPrice != null ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatMoney(regularPrice)}
            </span>
          ) : null}
        </p>
      ) : null}

      <div className={cn("flex justify-center", isPaid && (sub.purchased || (locked && price != null)) ? "mt-3" : "mt-5")}>
        <Button
          type="button"
          variant="outline"
          size="pill"
          className={cn(
            "min-w-[8.5rem] font-semibold",
            locked && price != null
              ? "border-[#d4a017]/60 text-[#92400e] hover:border-[#d4a017] hover:bg-[#fffbeb]"
              : "border-foreground/25 text-foreground hover:border-primary/40 hover:bg-primary-muted"
          )}
          onClick={() => {
            if (locked) {
              onUnlock();
              return;
            }
            onOpenStudy();
          }}
        >
          {locked ? (
            <>
              <Lock className="h-3.5 w-3.5" aria-hidden />
              {price != null ? "Unlock this set" : "Unlock"}
            </>
          ) : (
            "Open Study"
          )}
        </Button>
      </div>

      {examHref && !locked ? (
        <Link
          href={examHref}
          className="mt-2.5 inline-flex items-center justify-center gap-1 self-center text-xs font-semibold text-primary hover:underline"
        >
          <Timer className="h-3.5 w-3.5" aria-hidden />
          Timed exam
        </Link>
      ) : null}
    </article>
  );
}
