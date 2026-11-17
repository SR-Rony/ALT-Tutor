"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, FileText, Lock } from "lucide-react";
import { GoldUnlockModal } from "@/components/public/questionbank/gold-unlock-modal";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { usePastPaperArchive } from "@/hooks";
import { normalizeAccessBadge, tierBadgeClass, tierLabel } from "@/lib/access-tier";
import type { ApiError } from "@/types";
import type { PastPaper } from "@/types/past-paper.types";
import { cn } from "@/utils";
import { ResourceGridSkeleton } from "./resource-grid-skeleton";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = { programSlug: string };

function sourceLabel(type: string) {
  if (type === "PDF") return "PDF";
  if (type === "HYBRID") return "Hybrid";
  return "Interactive";
}

function formatPaperDisplayTitle(paper: PastPaper) {
  const rawTitle = (paper.title || "").trim();
  if (/paper\s*\d+/i.test(rawTitle) && /variant/i.test(rawTitle)) {
    return rawTitle;
  }

  const pMatch = paper.paperCode?.match(/p(\d+)/i);
  const paperText = pMatch ? `Paper ${pMatch[1]}` : (paper.paperCode || "");

  const combined = `${rawTitle} ${paper.session || ""} ${paper.slug || ""}`;
  const vMatch = combined.match(/variant[-_\s]*(\d+)/i);
  const variantText = vMatch ? `Variant ${vMatch[1]}` : "";

  const parts: string[] = [];
  const sessionText = paper.session?.trim() || rawTitle;
  parts.push(sessionText);

  if (paperText && !sessionText.toLowerCase().includes(paperText.toLowerCase())) {
    parts.push(paperText);
  }
  if (variantText && !sessionText.toLowerCase().includes(variantText.toLowerCase())) {
    parts.push(variantText);
  }

  return parts.join(" ") || rawTitle;
}

export function PastPapersPage({ programSlug }: Props) {
  const { programName, isLoading: menuLoading } = useProgramContext(programSlug);
  const { data, isLoading, isFetching, error, refetch } = usePastPaperArchive(programSlug);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<{
    title: string;
    requiredTier: string;
  }>({ title: "", requiredTier: "GOLD" });

  const years = useMemo(() => {
    const list = data?.years ?? [];
    return [...list].sort((a, b) => b.year - a.year);
  }, [data?.years]);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const activeYear =
    selectedYear !== null && years.some((b) => b.year === selectedYear)
      ? selectedYear
      : years[0]?.year ?? null;

  const activeBlock = useMemo(() => {
    return years.find((b) => b.year === activeYear) ?? null;
  }, [years, activeYear]);

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "past-papers",
    resourceLabel: "Past Papers",
    resourceHref: ROUTES.subjectResource(programSlug, "past-papers"),
  });

  const openUnlock = (paper: PastPaper) => {
    setUnlockTarget({
      title: paper.title,
      requiredTier: String(paper.accessTier ?? "GOLD"),
    });
    setUnlockOpen(true);
  };

  if (menuLoading && isLoading) {
    return <PageLoader label="Loading past papers..." />;
  }

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        programSlug={programSlug}
        title={`${programName} Past Papers`}
        description="Browse past exam papers by year. Open a paper to view its fixed question set — no timer, no attempt."
        icon={<FileText className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} separator="." />}
      />

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6 md:py-10">
        {/* Step 1: How to Use Past Papers */}
        <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-xs md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                How to Use Past Papers
              </h2>
            </div>
            {isFetching ? (
              <p className="text-xs text-muted-foreground" role="status">
                Updating…
              </p>
            ) : null}
          </div>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <li className="flex items-start gap-3 rounded-xl border border-border/70 bg-primary-muted/20 p-4 transition-colors">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-xs">
                1
              </span>
              <p className="text-sm leading-snug text-foreground">
                <span className="font-semibold">Pick a Year</span> and click View to open the paper.
              </p>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-border/70 bg-primary-muted/20 p-4 transition-colors">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-xs">
                2
              </span>
              <p className="text-sm leading-snug text-foreground">
                <span className="font-semibold">Try Yourself First:</span> Attempt the questions independently.
              </p>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-border/70 bg-primary-muted/20 p-4 transition-colors">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-xs">
                3
              </span>
              <p className="text-sm leading-snug text-foreground">
                <span className="font-semibold">Get Help:</span> Use video lessons and notes if needed.
              </p>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-border/70 bg-primary-muted/20 p-4 transition-colors">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-xs">
                4
              </span>
              <p className="text-sm leading-snug text-foreground">
                <span className="font-semibold">Check &amp; Improve:</span> Compare your answers with the Marking Scheme (MS) and correct your mistakes.
              </p>
            </li>
          </ol>
        </div>

        {/* Step 2 & 3: Year Selector Dropdown (Latest Year First) */}
        {years.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-xs">
            <div className="flex items-center gap-3">
              <label htmlFor="past-paper-year-select" className="text-sm font-bold text-foreground sm:text-base">
                Select Year:
              </label>
              <div className="relative inline-block">
                <select
                  id="past-paper-year-select"
                  value={activeYear ?? ""}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="h-10 cursor-pointer rounded-xl border-2 border-primary/20 bg-background px-4 py-1.5 pr-10 text-base font-bold text-primary transition hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {years.map((block) => (
                    <option key={block.year} value={block.year} className="font-semibold text-foreground">
                      {block.year}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" aria-hidden />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              Showing {activeBlock?.papers.length ?? 0} past paper{(activeBlock?.papers.length ?? 0) === 1 ? "" : "s"} for {activeYear}
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-accent/30 bg-accent/5 px-5 py-6 text-center">
            <p className="text-sm text-accent">
              {(error as unknown as ApiError)?.message || "Failed to load past papers"}
            </p>
            <Button type="button" variant="outline" className="mt-3" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : isLoading ? (
          <ResourceGridSkeleton count={4} />
        ) : years.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No past papers published for this program yet.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={ROUTES.subjectQuestionbank(programSlug)}>Open Questionbank</Link>
            </Button>
          </div>
        ) : activeBlock ? (
          <section key={activeBlock.year} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-extrabold tracking-tight text-primary sm:text-4xl md:text-5xl">
                {activeBlock.year}
              </h3>
            </div>
            <div className="space-y-3">
              {activeBlock.papers.map((paper) => {
                const locked = Boolean(paper.locked);
                const badge = normalizeAccessBadge(paper.accessTier);
                const viewHref = ROUTES.subjectPastPaper(programSlug, paper.slug);

                return (
                  <div
                    key={paper.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 transition-colors",
                      !locked && "hover:border-primary/30 hover:bg-primary-muted/20",
                      locked && "opacity-95"
                    )}
                  >
                    {locked ? (
                      <div className="min-w-0 flex-1">
                        <PaperMeta paper={paper} badge={badge} />
                      </div>
                    ) : (
                      <Link href={viewHref} className="min-w-0 flex-1 outline-none">
                        <PaperMeta paper={paper} badge={badge} />
                      </Link>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {locked ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-[#d4a017]/50 text-[#9a3412]"
                          onClick={() => openUnlock(paper)}
                        >
                          <Lock className="h-3.5 w-3.5" aria-hidden />
                          Unlock
                        </Button>
                      ) : (
                        <Button asChild size="sm">
                          <Link href={viewHref}>View questions</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      {data?.program ? (
        <GoldUnlockModal
          open={unlockOpen}
          onClose={() => setUnlockOpen(false)}
          programId={data.program.id}
          programName={data.program.name}
          programSlug={programSlug}
          subtopicTitle={unlockTarget.title}
          requiredTier={unlockTarget.requiredTier}
          onUnlocked={() => {
            void refetch();
          }}
          returnPath={`${ROUTES.subjectResource(programSlug, "past-papers")}?unlocked=1`}
        />
      ) : null}
    </div>
  );
}

function PaperMeta({
  paper,
  badge,
}: {
  paper: PastPaper;
  badge: ReturnType<typeof normalizeAccessBadge>;
}) {
  const displayTitle = formatPaperDisplayTitle(paper);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-base font-semibold text-foreground">{displayTitle}</p>
        <span
          className={cn(
            "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase text-white",
            tierBadgeClass(badge)
          )}
        >
          {tierLabel(badge)}
        </span>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
          {sourceLabel(paper.sourceType)}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {paper.totalQuestions} question{paper.totalQuestions === 1 ? "" : "s"} · {paper.totalMarks}{" "}
        marks
      </p>
    </>
  );
}
