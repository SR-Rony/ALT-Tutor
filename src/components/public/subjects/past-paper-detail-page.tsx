"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, HelpCircle, Lock } from "lucide-react";
import { GoldUnlockModal } from "@/components/public/questionbank/gold-unlock-modal";
import { StudyQuestionCard } from "@/components/public/questions";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { usePastPaperDetail } from "@/hooks";
import { normalizeAccessBadge, tierBadgeClass, tierLabel } from "@/lib/access-tier";
import type { ApiError } from "@/types";
import type { PastPaperViewQuestion } from "@/types/past-paper.types";
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
  const [unlockOpen, setUnlockOpen] = useState(false);

  const paper = data?.paper;
  const locked = Boolean(paper?.locked);
  const badge = normalizeAccessBadge(paper?.accessTier);
  const questions = useMemo(() => paper?.questions ?? [], [paper?.questions]);

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

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title={paper.title}
        subtitle={`${programName} · ${paper.year} ${paper.session} · ${paper.paperCode}`}
        description={
          paper.description ||
          "Fixed past paper question set — browse and study at your own pace."
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
          <span className="rounded-full border border-primary/15 bg-card px-3 py-1 text-xs font-semibold">
            {sourceLabel(paper.sourceType)}
          </span>
          {!locked ? (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={ROUTES.subjectResource(programSlug, "past-papers")}>All past papers</Link>
            </Button>
          ) : null}
          {paper.pdfUrl && !locked ? (
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <a href={paper.pdfUrl} target="_blank" rel="noreferrer">
                Open PDF
              </a>
            </Button>
          ) : null}
        </div>
      </ResourceHero>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 md:px-6">
        {locked ? (
          <section className="rounded-2xl border border-border bg-card p-6 text-center">
            <Lock className="mx-auto h-8 w-8 text-[#9a3412]" aria-hidden />
            <h2 className="mt-3 text-lg font-bold text-foreground">This paper is locked</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Unlock {tierLabel(badge)} access to view the full question set.
            </p>
            {paper.sections?.length ? (
              <ul className="mx-auto mt-5 max-w-md space-y-2 text-left text-sm text-muted-foreground">
                {paper.sections.map((section) => (
                  <li key={section.id}>
                    <span className="font-semibold text-foreground">
                      {section.code ? `${section.code}. ` : ""}
                      {section.title}
                    </span>
                    {" · "}
                    {section.questionCount} question{section.questionCount === 1 ? "" : "s"}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                type="button"
                size="pill"
                className="border-[#d4a017]/50 bg-[#fff8ef] text-[#9a3412] hover:bg-[#fff1df]"
                onClick={() => setUnlockOpen(true)}
              >
                <Lock className="h-4 w-4" aria-hidden />
                Unlock {tierLabel(badge)}
              </Button>
              <Button asChild variant="outline" size="pill">
                <Link href={ROUTES.subjectResource(programSlug, "past-papers")}>
                  All past papers
                </Link>
              </Button>
            </div>
          </section>
        ) : questions.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {paper.pdfUrl
                ? "No interactive questions on this paper. Use the PDF link above."
                : "No questions are configured for this past paper yet."}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={ROUTES.subjectResource(programSlug, "past-papers")}>
                Back to Past Papers
              </Link>
            </Button>
          </section>
        ) : (
          <>
            {paper.sections?.length ? (
              <nav
                className="flex flex-wrap gap-2 text-xs text-muted-foreground"
                aria-label="Paper sections"
              >
                {paper.sections.map((section) => (
                  <span
                    key={section.id}
                    className="rounded-md border border-border bg-card px-2.5 py-1 font-semibold"
                  >
                    {section.code ? `${section.code}. ` : ""}
                    {section.title}
                    <span className="ml-1 font-normal text-muted-foreground">
                      ({section.questionCount})
                    </span>
                  </span>
                ))}
              </nav>
            ) : null}

            <div className="space-y-8">
              {questions.map((question, index) => (
                <PastPaperViewCard
                  key={question.id}
                  index={index}
                  question={question}
                  paperMarkSchemeUrl={paper.markSchemeUrl}
                />
              ))}
            </div>
          </>
        )}
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

function PastPaperViewCard({
  index,
  question,
  paperMarkSchemeUrl,
}: {
  index: number;
  question: PastPaperViewQuestion;
  paperMarkSchemeUrl?: string | null;
}) {
  const displayNumber = index + 1;
  const isMcq = (question.options?.length ?? 0) >= 2;
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <StudyQuestionCard
      contentMode="rich"
      solutionsUnlocked
      examMode={false}
      selectedAnswer={selected}
      onSelectAnswer={isMcq ? setSelected : undefined}
      idPrefix="pp-q"
      dataAttr="pp-q"
      question={{
        id: question.id,
        displayNumber,
        prompt: question.prompt,
        body: question.body,
        diagramUrl: question.diagramUrl,
        difficulty: question.difficulty,
        paper: question.paper,
        calculatorAllowed:
          question.calculatorAllowed === undefined || question.calculatorAllowed === null
            ? false
            : question.calculatorAllowed,
        marks: question.marks,
        options: question.options ?? [],
        markScheme: question.markScheme,
        videoUrl: question.videoUrl,
        correctAnswer: question.correctAnswer,
        isCorrect:
          selected && question.correctAnswer
            ? selected.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
            : null,
        paperMarkSchemeUrl,
      }}
    />
  );
}
