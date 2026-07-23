"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Lock } from "lucide-react";
import { GoldUnlockModal } from "@/components/public/questionbank/gold-unlock-modal";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { usePastPaperArchive, usePastPaperHistory } from "@/hooks";
import { normalizeAccessBadge, tierBadgeClass, tierLabel } from "@/lib/access-tier";
import { useAppSelector } from "@/store";
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

export function PastPapersPage({ programSlug }: Props) {
  const { programName, isLoading: menuLoading } = useProgramContext(programSlug);
  const { data, isLoading, isFetching, error, refetch } = usePastPaperArchive(programSlug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data: history = [] } = usePastPaperHistory(programSlug);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<{
    title: string;
    requiredTier: string;
  }>({ title: "", requiredTier: "GOLD" });

  const years = data?.years ?? [];
  const recentAttemptIds = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of history) {
      const paperId = (row as { paper?: { id?: string }; id?: string }).paper?.id;
      if (paperId && !map.has(paperId)) map.set(paperId, row.id);
    }
    return map;
  }, [history]);

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
        title={`${programName} Past Papers`}
        description="Year-by-year archive with fixed question sets. Timed attempts freeze the paper so scores stay consistent."
        icon={<FileText className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      />

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 md:px-6 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground md:text-2xl">Archive</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a year, then open a paper. Locked papers need a Practice Pass or course access.
            </p>
          </div>
          {isFetching ? (
            <p className="text-sm text-muted-foreground" role="status">
              Updating…
            </p>
          ) : null}
        </div>

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
        ) : (
          years.map((block) => (
            <section key={block.year}>
              <p className="text-3xl font-bold text-primary sm:text-4xl md:text-5xl">{block.year}</p>
              <div className="mt-5 space-y-3">
                {block.papers.map((paper) => {
                  const locked = Boolean(paper.locked);
                  const badge = normalizeAccessBadge(paper.accessTier);
                  const href = ROUTES.subjectPastPaper(programSlug, paper.slug);
                  const attempted = recentAttemptIds.has(paper.id);

                  return (
                    <div
                      key={paper.id}
                      className={cn(
                        "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-4",
                        locked && "opacity-95"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{paper.title}</p>
                          <span className="rounded-md bg-primary-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                            {paper.paperCode}
                          </span>
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                            {paper.session}
                          </span>
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
                          {attempted ? (
                            <span className="rounded-md bg-[#ecfdf3] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--accent-green)]">
                              Attempted
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {paper.totalQuestions}Q · {paper.totalMarks} marks · {paper.durationMin}{" "}
                          min
                        </p>
                      </div>
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
                        ) : null}
                        <Button asChild size="sm" variant={locked ? "outline" : "default"}>
                          <Link href={href}>{locked ? "View details" : "Open paper"}</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}

        {!isAuthenticated ? (
          <p className="text-center text-sm text-muted-foreground">
            <Link href={ROUTES.auth.login} className="font-semibold text-primary hover:underline">
              Sign in
            </Link>{" "}
            to start timed past paper attempts and see your history.
          </p>
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
