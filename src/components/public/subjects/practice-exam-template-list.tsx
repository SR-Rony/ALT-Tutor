"use client";

import Link from "next/link";
import { Clock, HelpCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { normalizeAccessBadge, tierBadgeClass, tierLabel } from "@/lib/access-tier";
import type { PracticeExamTemplate } from "@/types/practice-exam.types";
import { cn } from "@/utils";

type Props = {
  programSlug: string;
  templates: PracticeExamTemplate[];
  emptyLabel?: string;
  onUnlock?: (template: PracticeExamTemplate) => void;
};

function modeAccent(mode?: string) {
  return mode === "WRITTEN" ? "border-l-[#1d4ed8]" : "border-l-accent";
}

function writtenStyleLabel(style?: string | null) {
  return style === "PER_QUESTION" ? "Per question" : "Full paper";
}

export function PracticeExamTemplateList({
  programSlug,
  templates,
  emptyLabel = "No practice exams published yet.",
  onUnlock,
}: Props) {
  if (templates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => {
        const locked = Boolean(template.locked);
        const badge = normalizeAccessBadge(template.accessTier);
        const takeHref = ROUTES.subjectPracticeExamTake(programSlug, template.slug);
        const isWritten = template.mode === "WRITTEN";
        const modeLabel = template.modeLabel ?? (isWritten ? "Written" : "MCQ");

        return (
          <article
            key={template.id}
            className={cn(
              "flex flex-col gap-4 rounded-2xl border border-border border-l-4 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5",
              modeAccent(template.mode)
            )}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">{template.title}</h3>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                    isWritten
                      ? "bg-[#eff6ff] text-[#1d4ed8]"
                      : "bg-primary-muted text-primary"
                  )}
                >
                  {modeLabel}
                </span>
                {isWritten ? (
                  <span className="rounded-md bg-[#f8fafc] px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                    {writtenStyleLabel(template.writtenStyle)}
                  </span>
                ) : null}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase text-white",
                    tierBadgeClass(badge)
                  )}
                >
                  {badge !== "FREE" ? <Lock className="h-3 w-3" aria-hidden /> : null}
                  {tierLabel(badge)}
                </span>
              </div>
              {template.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {template.description}
                </p>
              ) : null}
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                  {template.totalQuestions} question{template.totalQuestions === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {template.durationMin} mins
                </span>
                {template.passMarkPercent != null ? (
                  <span>Pass {template.passMarkPercent}%</span>
                ) : null}
                {locked ? <span>· Practice Pass / course required</span> : null}
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[9.5rem]">
              {locked ? (
                <Button
                  type="button"
                  variant="outline"
                  size="pill"
                  className="w-full border-[#d4a017]/50 text-[#9a3412]"
                  onClick={() => onUnlock?.(template)}
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden />
                  Unlock {tierLabel(badge)}
                </Button>
              ) : (
                <Button asChild size="pill" className="w-full">
                  <Link href={takeHref}>Start</Link>
                </Button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
