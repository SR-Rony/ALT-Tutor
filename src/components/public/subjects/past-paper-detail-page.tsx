"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, FileText, HelpCircle, Lock } from "lucide-react";
import { GoldUnlockModal } from "@/components/public/questionbank/gold-unlock-modal";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { usePastPaperDetail } from "@/hooks";
import { normalizeAccessBadge, tierBadgeClass, tierLabel } from "@/lib/access-tier";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import { cn } from "@/utils";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = {
  programSlug: string;
  paperSlug: string;
};

function sourceLabel(type: string) {
  if (type === "PDF") return "PDF";
  if (type === "HYBRID") return "Hybrid";
  return "Interactive";
}

export function PastPaperDetailPage({ programSlug, paperSlug }: Props) {
  const { programName, isLoading: menuLoading } = useProgramContext(programSlug);
  const { data, isLoading, error, refetch } = usePastPaperDetail(programSlug, paperSlug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [unlockOpen, setUnlockOpen] = useState(false);

  const paper = data?.paper;
  const locked = Boolean(paper?.locked);
  const badge = normalizeAccessBadge(paper?.accessTier);

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "past-papers",
    resourceLabel: "Past Papers",
    resourceHref: ROUTES.subjectResource(programSlug, "past-papers"),
    topicLabel: paper?.title ?? "Paper",
  });

  if ((menuLoading && isLoading) || (isLoading && !paper)) {
    return <PageLoader label="Loading past paper..." />;
  }

  if (error || !paper) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Past paper not found"}
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href={ROUTES.subjectResource(programSlug, "past-papers")}>
            Back to Past Papers
          </Link>
        </Button>
      </div>
    );
  }

  const loginHref = `${ROUTES.auth.login}?next=${encodeURIComponent(
    ROUTES.subjectPastPaperTake(programSlug, paperSlug)
  )}`;

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title={paper.title}
        subtitle={`${programName} · ${paper.year} ${paper.session} · ${paper.paperCode}`}
        description={
          paper.description ||
          "Fixed archive paper — the question set stays the same for every attempt."
        }
        icon={<FileText className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase text-white",
              tierBadgeClass(badge)
            )}
          >
            {badge !== "FREE" ? <Lock className="h-3 w-3" aria-hidden /> : null}
            {tierLabel(badge)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card px-3 py-1 text-xs font-semibold">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden />
            {paper.totalQuestions} questions · {paper.totalMarks} marks
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card px-3 py-1 text-xs font-semibold">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {paper.durationMin} mins
          </span>
          <span className="rounded-full border border-primary/15 bg-card px-3 py-1 text-xs font-semibold">
            {sourceLabel(paper.sourceType)}
          </span>
        </div>
      </ResourceHero>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 md:px-6">
        {paper.sections?.length ? (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Sections
            </h2>
            <ul className="mt-3 space-y-3">
              {paper.sections.map((section) => (
                <li key={section.id} className="text-sm">
                  <p className="font-semibold text-foreground">
                    {section.code ? `${section.code}. ` : ""}
                    {section.title}
                  </p>
                  <p className="text-muted-foreground">
                    {section.questionCount} question{section.questionCount === 1 ? "" : "s"}
                    {section.instructions ? ` · ${section.instructions}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {paper.pdfUrl && !locked ? (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              PDF paper
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Optional PDF companion for this archive entry.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <a href={paper.pdfUrl} target="_blank" rel="noreferrer">
                Open PDF
              </a>
            </Button>
          </section>
        ) : null}

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-base font-bold text-foreground">Ready to sit this paper?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Timed attempt with the fixed question order. Mark schemes stay hidden until you submit.
            Past scores stay stable even if live Questionbank items change later.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {locked ? (
              <Button
                type="button"
                size="pill"
                className="border-[#d4a017]/50 bg-[#fff8ef] text-[#9a3412] hover:bg-[#fff1df]"
                onClick={() => setUnlockOpen(true)}
              >
                <Lock className="h-4 w-4" aria-hidden />
                Unlock {tierLabel(badge)}
              </Button>
            ) : !isAuthenticated ? (
              <Button asChild size="pill">
                <Link href={loginHref}>Log in to start</Link>
              </Button>
            ) : (
              <Button asChild size="pill">
                <Link href={ROUTES.subjectPastPaperTake(programSlug, paperSlug)}>
                  Start timed exam
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="pill">
              <Link href={ROUTES.subjectResource(programSlug, "past-papers")}>
                All past papers
              </Link>
            </Button>
          </div>
        </section>
      </div>

      {data?.program ? (
        <GoldUnlockModal
          open={unlockOpen}
          onClose={() => setUnlockOpen(false)}
          programId={data.program.id}
          programName={data.program.name}
          programSlug={programSlug}
          subtopicTitle={paper.title}
          requiredTier={String(paper.accessTier)}
          onUnlocked={() => {
            void refetch();
          }}
          returnPath={ROUTES.subjectPastPaper(programSlug, paperSlug)}
        />
      ) : null}
    </div>
  );
}
