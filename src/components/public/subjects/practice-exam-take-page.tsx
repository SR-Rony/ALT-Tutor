"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, HelpCircle, Timer } from "lucide-react";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import {
  useSavePracticeExamAnswer,
  useStartPracticeExamAttempt,
  useSubmitPracticeExamAttempt,
} from "@/hooks";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import type {
  PracticeExamAttemptPayload,
  PracticeExamAttemptQuestion,
} from "@/types/practice-exam.types";
import { cn } from "@/utils";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = {
  programSlug: string;
  templateSlug: string;
};

const LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

function formatTimer(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function PracticeExamTakePage({ programSlug, templateSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceNew = searchParams.get("new") === "1";
  const { programName } = useProgramContext(programSlug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const startAttempt = useStartPracticeExamAttempt();
  const saveAnswer = useSavePracticeExamAnswer();
  const submitAttempt = useSubmitPracticeExamAttempt();

  const [payload, setPayload] = useState<PracticeExamAttemptPayload | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const bootedRef = useRef(false);
  const autoSubmitRef = useRef(false);

  const resultHref = useCallback(
    (attemptId: string) =>
      ROUTES.subjectPracticeExamResult(programSlug, templateSlug, attemptId),
    [programSlug, templateSlug]
  );

  const goResult = useCallback(
    (attemptId: string) => {
      router.replace(resultHref(attemptId));
    },
    [router, resultHref]
  );

  const applyPayload = useCallback(
    (data: PracticeExamAttemptPayload) => {
      if (data.attempt.status === "SUBMITTED") {
        goResult(data.attempt.id);
        return;
      }
      setPayload(data);
      const restored: Record<string, string> = {};
      for (const q of data.questions) {
        if (q.studentAnswer) restored[q.id] = q.studentAnswer;
      }
      setSelectedAnswers(restored);
      if (data.attempt.expiresAt) {
        setRemainingSeconds(
          Math.max(
            0,
            Math.floor((new Date(data.attempt.expiresAt).getTime() - Date.now()) / 1000)
          )
        );
      } else {
        setRemainingSeconds(null);
      }
    },
    [goResult]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      const next = ROUTES.subjectPracticeExamTake(programSlug, templateSlug, {
        new: forceNew || undefined,
      });
      router.replace(`${ROUTES.auth.login}?next=${encodeURIComponent(next)}`);
      return;
    }
    if (bootedRef.current) return;
    bootedRef.current = true;
    void (async () => {
      setBootError(null);
      try {
        const data = await startAttempt.mutateAsync({
          programSlug,
          templateSlug,
          forceNew: forceNew || undefined,
        });
        applyPayload(data);
        if (forceNew) {
          router.replace(ROUTES.subjectPracticeExamTake(programSlug, templateSlug));
        }
      } catch (err) {
        setBootError((err as ApiError)?.message || "Failed to start practice exam");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once per mount
  }, [isAuthenticated, programSlug, templateSlug, forceNew]);

  useEffect(() => {
    if (!payload?.attempt.expiresAt || payload.attempt.status === "SUBMITTED") return;
    const tick = () => {
      const left = Math.max(
        0,
        Math.floor((new Date(payload.attempt.expiresAt!).getTime() - Date.now()) / 1000)
      );
      setRemainingSeconds(left);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [payload?.attempt.expiresAt, payload?.attempt.status]);

  const handleSubmit = useCallback(async () => {
    if (!payload || submitting || submitAttempt.isPending) return;
    setSubmitting(true);
    try {
      const data = await submitAttempt.mutateAsync(payload.attempt.id);
      goResult(data.attempt.id);
    } catch (err) {
      setBootError((err as ApiError)?.message || "Failed to submit exam");
      setSubmitting(false);
    }
  }, [payload, submitting, submitAttempt, goResult]);

  useEffect(() => {
    if (remainingSeconds !== 0 || !payload || autoSubmitRef.current) return;
    autoSubmitRef.current = true;
    void handleSubmit();
  }, [remainingSeconds, payload, handleSubmit]);

  const handleSelectAnswer = async (questionId: string, letter: string) => {
    if (!payload || submitting) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: letter }));
    setSavingQuestionId(questionId);
    try {
      const result = await saveAnswer.mutateAsync({
        attemptId: payload.attempt.id,
        questionId,
        answer: letter,
      });
      if (result.expired && result.result) {
        goResult(result.result.attempt.id);
      }
    } catch (err) {
      setBootError((err as ApiError)?.message || "Failed to save answer");
    } finally {
      setSavingQuestionId(null);
    }
  };

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "practice-exams",
    resourceLabel: "Practice Exams",
    resourceHref: ROUTES.subjectResource(programSlug, "practice-exams"),
    topicLabel: payload?.template.title ?? "Exam",
  });

  const answeredCount = useMemo(
    () => Object.keys(selectedAnswers).length,
    [selectedAnswers]
  );

  if (!isAuthenticated || (!payload && !bootError)) {
    return <PageLoader label="Starting exam..." />;
  }

  if (bootError && !payload) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-accent">{bootError}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href={ROUTES.subjectPracticeExam(programSlug, templateSlug)}>Back</Link>
          </Button>
          <Button
            type="button"
            onClick={() => {
              bootedRef.current = false;
              setBootError(null);
              router.refresh();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!payload) return <PageLoader label="Loading exam..." />;

  return (
    <div className="bg-background pb-24">
      <ResourceHero
        title={payload.template.title}
        subtitle={`${programName} · timed exam`}
        description="Mark schemes stay locked until you submit. Answers autosave."
        icon={<Timer className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card px-3 py-1 text-xs font-semibold">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden />
            {answeredCount}/{payload.questions.length} answered
          </span>
          {remainingSeconds != null ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                remainingSeconds < 300
                  ? "bg-accent/15 text-accent"
                  : "border border-primary/15 bg-card text-foreground"
              )}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {formatTimer(remainingSeconds)}
            </span>
          ) : null}
        </div>
      </ResourceHero>

      {bootError ? (
        <p className="mx-auto max-w-3xl px-4 pt-4 text-sm text-accent md:px-6">{bootError}</p>
      ) : null}

      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 md:px-6">
        {payload.questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            index={index}
            question={question}
            selected={selectedAnswers[question.id] ?? null}
            saving={savingQuestionId === question.id}
            disabled={submitting}
            onSelect={(letter) => void handleSelectAnswer(question.id, letter)}
          />
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <p className="text-sm text-muted-foreground">
            {answeredCount < payload.questions.length
              ? `${payload.questions.length - answeredCount} unanswered`
              : "All questions answered"}
          </p>
          <Button
            type="button"
            size="pill"
            disabled={submitting || submitAttempt.isPending}
            onClick={() => {
              const unanswered = payload.questions.length - answeredCount;
              if (
                unanswered > 0 &&
                !window.confirm(`Submit with ${unanswered} unanswered question(s)?`)
              ) {
                return;
              }
              void handleSubmit();
            }}
          >
            {submitting || submitAttempt.isPending ? "Submitting…" : "Submit exam"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuestionCard({
  index,
  question,
  selected,
  saving,
  disabled,
  onSelect,
}: {
  index: number;
  question: PracticeExamAttemptQuestion;
  selected: string | null;
  saving: boolean;
  disabled: boolean;
  onSelect: (letter: string) => void;
}) {
  const letters = LETTERS.slice(0, Math.max(question.options.length, 1));

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        <span className="rounded-md bg-primary-muted px-2 py-0.5 text-primary">
          Q{question.number || index + 1}
        </span>
        {question.difficulty ? (
          <span className="rounded-md border border-border px-2 py-0.5">{question.difficulty}</span>
        ) : null}
        {question.marks != null && question.marks > 0 ? (
          <span className="rounded-md border border-border px-2 py-0.5">[{question.marks}]</span>
        ) : null}
      </div>
      <p className="text-sm leading-relaxed text-foreground md:text-base">{question.prompt}</p>
      {question.body ? (
        <p className="mt-2 text-sm text-muted-foreground">{question.body}</p>
      ) : null}
      {question.diagramUrl ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.diagramUrl}
            alt={`Diagram for question ${index + 1}`}
            className="mx-auto max-h-[28rem] w-auto max-w-full object-contain p-3"
          />
        </div>
      ) : null}

      {question.options.length > 0 ? (
        <ul className="mt-4 space-y-1.5 text-sm text-foreground">
          {question.options.map((opt, i) => (
            <li key={`${i}-${opt}`}>
              <span className="font-semibold">{LETTERS[i] ?? i + 1}.</span> {opt}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Choose an answer
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {letters.map((letter) => {
            const isSelected = selected === letter;
            return (
              <button
                key={letter}
                type="button"
                disabled={disabled || saving}
                onClick={() => onSelect(letter)}
                className={cn(
                  "flex h-12 items-center justify-center rounded-xl border text-sm font-bold transition",
                  isSelected
                    ? "border-primary bg-primary-muted text-primary"
                    : "border-border bg-muted/40 hover:border-primary hover:bg-primary-muted",
                  (disabled || saving) && "opacity-70"
                )}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}
