"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Timer, XCircle } from "lucide-react";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { usePracticeExamAttempt } from "@/hooks";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import { cn } from "@/utils";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = {
  programSlug: string;
  templateSlug: string;
  attemptId: string;
};

const LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

export function PracticeExamResultPage({
  programSlug,
  templateSlug,
  attemptId,
}: Props) {
  const router = useRouter();
  const { programName } = useProgramContext(programSlug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data, isLoading, error } = usePracticeExamAttempt(
    isAuthenticated ? attemptId : undefined
  );

  useEffect(() => {
    if (!isAuthenticated) {
      const next = ROUTES.subjectPracticeExamResult(programSlug, templateSlug, attemptId);
      router.replace(`${ROUTES.auth.login}?next=${encodeURIComponent(next)}`);
    }
  }, [isAuthenticated, programSlug, templateSlug, attemptId, router]);

  useEffect(() => {
    if (data?.attempt.status === "IN_PROGRESS") {
      router.replace(ROUTES.subjectPracticeExamTake(programSlug, templateSlug));
    }
  }, [data?.attempt.status, programSlug, templateSlug, router]);

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "practice-exams",
    resourceLabel: "Practice Exams",
    resourceHref: ROUTES.subjectResource(programSlug, "practice-exams"),
    topicLabel: data?.template.title ?? "Result",
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
          <Link href={ROUTES.subjectResource(programSlug, "practice-exams")}>
            Back to Practice Exams
          </Link>
        </Button>
      </div>
    );
  }

  const { attempt, template, questions } = data;
  const passed = attempt.passed;
  const scoreLabel =
    attempt.correctCount != null
      ? `${attempt.correctCount}/${attempt.totalQuestions}`
      : `${attempt.totalQuestions} Q`;

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title="Exam result"
        subtitle={`${programName} · ${template.title}`}
        description="Review your answers below. Retry starts a fresh timed attempt."
        icon={<Timer className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      />

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
        <section
          className={cn(
            "rounded-2xl border p-6 text-center",
            passed === true
              ? "border-[var(--accent-green)]/40 bg-[#ecfdf3]"
              : passed === false
                ? "border-accent/40 bg-accent/10"
                : "border-border bg-card"
          )}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Score
          </p>
          <p className="mt-2 text-4xl font-bold text-foreground">{attempt.score}%</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {scoreLabel} correct
            {attempt.totalMarks > 0
              ? ` · ${attempt.earnedMarks}/${attempt.totalMarks} marks`
              : ""}
            {template.passMarkPercent != null ? ` · pass mark ${template.passMarkPercent}%` : ""}
          </p>
          {passed != null ? (
            <p
              className={cn(
                "mt-3 text-sm font-bold",
                passed ? "text-[var(--accent-green)]" : "text-accent"
              )}
            >
              {passed ? "Passed" : "Not passed"}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild size="pill">
              <Link href={ROUTES.subjectPracticeExamTake(programSlug, templateSlug, { new: true })}>
                Retry exam
              </Link>
            </Button>
            <Button asChild variant="outline" size="pill">
              <Link href={ROUTES.subjectResource(programSlug, "practice-exams")}>
                All practice exams
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
                  <div className="mt-3 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground">
                      Mark scheme
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{question.markScheme}</p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
