"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { ResultReviewQuestion } from "@/components/public/questions";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { usePastPaperAttempt } from "@/hooks";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = {
  programSlug: string;
  paperSlug: string;
  attemptId: string;
};

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
          {questions.map((question, index) => (
            <ResultReviewQuestion key={question.id} question={question} index={index} />
          ))}
        </section>
      </div>
    </div>
  );
}
