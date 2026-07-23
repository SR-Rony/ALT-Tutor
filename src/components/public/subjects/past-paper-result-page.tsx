"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, XCircle } from "lucide-react";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { usePastPaperAttempt } from "@/hooks";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import { cn } from "@/utils";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = {
  programSlug: string;
  paperSlug: string;
  attemptId: string;
};

const LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

export function PastPaperResultPage({ programSlug, paperSlug, attemptId }: Props) {
  const router = useRouter();
  const { programName } = useProgramContext(programSlug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data, isLoading, error } = usePastPaperAttempt(
    isAuthenticated ? attemptId : undefined
  );

  useEffect(() => {
    if (!isAuthenticated) {
      const next = ROUTES.subjectPastPaperResult(programSlug, paperSlug, attemptId);
      router.replace(`${ROUTES.auth.login}?next=${encodeURIComponent(next)}`);
    }
  }, [isAuthenticated, programSlug, paperSlug, attemptId, router]);

  useEffect(() => {
    if (data?.attempt.status === "IN_PROGRESS") {
      router.replace(ROUTES.subjectPastPaperTake(programSlug, paperSlug));
    }
  }, [data?.attempt.status, programSlug, paperSlug, router]);

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "past-papers",
    resourceLabel: "Past Papers",
    resourceHref: ROUTES.subjectResource(programSlug, "past-papers"),
    topicLabel: data?.paper.title ?? "Result",
  });

  if (!isAuthenticated || isLoading || (data && data.attempt.status === "IN_PROGRESS")) {
    return <PageLoader label="Loading result..." />;
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Result not found"}
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href={ROUTES.subjectResource(programSlug, "past-papers")}>
            Back to Past Papers
          </Link>
        </Button>
      </div>
    );
  }

  const { attempt, paper, questions } = data;
  const scoreLabel = `${attempt.correctCount}/${attempt.totalQuestions}`;

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title="Paper result"
        subtitle={`${programName} · ${paper.title}`}
        description="Review your answers below. Retry starts a fresh timed attempt with the same fixed set."
        icon={<FileText className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
        <section className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Score
          </p>
          <p className="mt-2 text-4xl font-bold text-foreground">{attempt.score}%</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {scoreLabel} correct
            {attempt.totalMarks > 0
              ? ` · ${attempt.earnedMarks}/${attempt.totalMarks} marks`
              : ""}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild size="pill">
              <Link href={ROUTES.subjectPastPaperTake(programSlug, paperSlug, { new: true })}>
                Retry paper
              </Link>
            </Button>
            <Button asChild variant="outline" size="pill">
              <Link href={ROUTES.subjectResource(programSlug, "past-papers")}>
                All past papers
              </Link>
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Review</h2>
          {questions.map((question, index) => {
            const selected = question.studentAnswer;
            const correct = question.correctAnswer;
            const isCorrect = question.isCorrect;
            return (
              <article
                key={question.id}
                className="rounded-2xl border border-border bg-card p-4 sm:p-5"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-primary-muted px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                    Q{question.number || index + 1}
                  </span>
                  {isCorrect === true ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-green)]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Correct
                    </span>
                  ) : isCorrect === false ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
                      <XCircle className="h-3.5 w-3.5" /> Incorrect
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">Unanswered</span>
                  )}
                </div>
                <p className="text-sm text-foreground">{question.prompt}</p>
                {question.options.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-sm">
                    {question.options.map((opt, i) => {
                      const letter = LETTERS[i] ?? String(i + 1);
                      const isSel = selected === letter;
                      const isAns = correct === letter;
                      return (
                        <li
                          key={`${question.id}-${letter}`}
                          className={cn(
                            "rounded-lg px-2 py-1",
                            isAns && "bg-[#ecfdf3] text-[var(--accent-green)]",
                            isSel && !isAns && "bg-accent/10 text-accent"
                          )}
                        >
                          <span className="font-semibold">{letter}.</span> {opt}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                {question.markScheme ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Mark scheme: {question.markScheme}
                  </p>
                ) : null}
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
