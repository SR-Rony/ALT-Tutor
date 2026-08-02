"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  HelpCircle,
  Lock,
  XCircle,
} from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageLoader } from "@/components/shared";
import { StudyQuestionCard } from "@/components/public/questions";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import {
  useSavePastPaperAnswer,
  useStartPastPaperAttempt,
  useSubmitPastPaperAttempt,
} from "@/hooks";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import type {
  PastPaperAttemptPayload,
  PastPaperAttemptQuestion,
} from "@/types/past-paper.types";
import { cn } from "@/utils";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = {
  programSlug: string;
  paperSlug: string;
};

function formatTimer(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function PastPaperTakePage({ programSlug, paperSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceNew = searchParams.get("new") === "1";
  const { programName } = useProgramContext(programSlug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const startAttempt = useStartPastPaperAttempt();
  const saveAnswer = useSavePastPaperAnswer();
  const submitAttempt = useSubmitPastPaperAttempt();

  const [payload, setPayload] = useState<PastPaperAttemptPayload | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const bootedRef = useRef(false);
  const autoSubmitRef = useRef(false);

  const applyPayload = useCallback(
    (data: PastPaperAttemptPayload, opts?: { openResult?: boolean }) => {
      const submitted = data.attempt.status === "SUBMITTED";
      setPayload(data);
      setExamSubmitted(submitted);
      const restored: Record<string, string> = {};
      for (const q of data.questions) {
        if (q.studentAnswer) restored[q.id] = q.studentAnswer;
      }
      setSelectedAnswers(restored);
      if (submitted) {
        setRemainingSeconds(null);
        if (opts?.openResult) setResultModalOpen(true);
      } else if (data.attempt.expiresAt) {
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
    []
  );

  useEffect(() => {
    if (!isAuthenticated) {
      const next = ROUTES.subjectPastPaperTake(programSlug, paperSlug, {
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
          paperSlug,
          forceNew: forceNew || undefined,
        });
        applyPayload(data);
        if (forceNew) {
          router.replace(ROUTES.subjectPastPaperTake(programSlug, paperSlug));
        }
      } catch (err) {
        setBootError((err as ApiError)?.message || "Failed to start past paper");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once per mount
  }, [isAuthenticated, programSlug, paperSlug, forceNew]);

  useEffect(() => {
    if (!payload?.attempt.expiresAt || examSubmitted) return;
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
  }, [payload?.attempt.expiresAt, examSubmitted]);

  const handleSubmit = useCallback(async () => {
    if (!payload || submitting || submitAttempt.isPending || examSubmitted) return;
    setSubmitting(true);
    try {
      const data = await submitAttempt.mutateAsync(payload.attempt.id);
      applyPayload(data, { openResult: true });
      setSubmitting(false);
    } catch (err) {
      setBootError((err as ApiError)?.message || "Failed to submit paper");
      setSubmitting(false);
    }
  }, [payload, submitting, submitAttempt, examSubmitted, applyPayload]);

  useEffect(() => {
    if (remainingSeconds !== 0 || !payload || examSubmitted || autoSubmitRef.current) return;
    autoSubmitRef.current = true;
    void handleSubmit();
  }, [remainingSeconds, payload, examSubmitted, handleSubmit]);

  const handleSelectAnswer = async (questionId: string, letter: string) => {
    if (!payload || submitting || examSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: letter }));
    setSavingQuestionId(questionId);
    try {
      const result = await saveAnswer.mutateAsync({
        attemptId: payload.attempt.id,
        questionId,
        answer: letter,
      });
      if (result.expired && result.result) {
        applyPayload(result.result, { openResult: true });
      }
    } catch (err) {
      setBootError((err as ApiError)?.message || "Failed to save answer");
    } finally {
      setSavingQuestionId(null);
    }
  };

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "past-papers",
    resourceLabel: "Past Papers",
    resourceHref: ROUTES.subjectResource(programSlug, "past-papers"),
    topicLabel: payload?.paper.title ?? "Paper",
  });

  const answeredCount = useMemo(() => Object.keys(selectedAnswers).length, [selectedAnswers]);

  const reviewIncorrect = () => {
    const firstWrong = payload?.questions.find((q) => q.isCorrect === false);
    const el = firstWrong
      ? document.getElementById(`pp-q-${firstWrong.id}`)
      : document.querySelector("[data-pp-q]");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setResultModalOpen(false);
  };

  if (!isAuthenticated || (!payload && !bootError)) {
    return <PageLoader label="Starting past paper..." />;
  }

  if (bootError && !payload) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-accent">{bootError}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href={ROUTES.subjectPastPaper(programSlug, paperSlug)}>Back</Link>
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

  if (!payload) return <PageLoader label="Loading paper..." />;

  const { attempt, paper } = payload;
  const paperMarkSchemeUrl = examSubmitted ? paper.markSchemeUrl : null;

  return (
    <div className="bg-background pb-24">
      <ResourceHero
        title={paper.title}
        subtitle={`${programName} · ${paper.year} ${paper.paperCode}`}
        description={
          examSubmitted
            ? "Paper submitted. Review correct/incorrect answers and unlock mark schemes & videos."
            : "Fixed question set. Mark schemes and videos stay locked until you submit."
        }
        icon={<FileText className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card px-3 py-1 text-xs font-semibold">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden />
            {examSubmitted
              ? `${attempt.correctCount}/${attempt.totalQuestions} correct`
              : `${answeredCount}/${payload.questions.length} answered`}
          </span>
          {!examSubmitted && remainingSeconds != null ? (
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
          {examSubmitted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-green)]/30 bg-[#ecfdf3] px-3 py-1 text-xs font-bold text-[var(--accent-green)]">
              Score {attempt.score}%
            </span>
          ) : null}
        </div>
      </ResourceHero>

      {bootError ? (
        <p className="mx-auto max-w-5xl px-4 pt-4 text-sm text-accent md:px-6">{bootError}</p>
      ) : null}

      {examSubmitted ? (
        <div className="mx-auto max-w-5xl space-y-3 px-4 pt-6 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--accent-green)]/40 bg-[var(--accent-green)]/10 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">
              Paper submitted — {attempt.correctCount}/{attempt.totalQuestions} correct (
              {attempt.score}%). Mark schemes and video solutions are unlocked.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setResultModalOpen(true)}>
                View result
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={reviewIncorrect}>
                Review answers
              </Button>
            </div>
          </div>
          {paperMarkSchemeUrl || paper.pdfUrl ? (
            <div className="flex flex-wrap gap-2">
              {paperMarkSchemeUrl ? (
                <Button asChild variant="outline" size="sm">
                  <a href={paperMarkSchemeUrl} target="_blank" rel="noreferrer">
                    <FileText className="mr-1.5 h-4 w-4" />
                    Paper mark scheme PDF
                    <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                </Button>
              ) : null}
              {paper.pdfUrl ? (
                <Button asChild variant="outline" size="sm">
                  <a href={paper.pdfUrl} target="_blank" rel="noreferrer">
                    <FileText className="mr-1.5 h-4 w-4" />
                    Question paper PDF
                    <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mx-auto max-w-5xl px-4 pt-6 md:px-6">
          <div className="rounded-xl border border-primary/20 bg-primary-muted/60 px-4 py-3 text-sm">
            <p className="inline-flex items-center gap-2 font-medium text-foreground">
              <Lock className="h-4 w-4 text-primary" />
              Solutions are locked during the paper
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              After you submit, correct/incorrect answers, mark schemes, and videos appear on this
              page.
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-6">
        {payload.questions.map((question, index) => (
          <PastPaperQuestionCard
            key={question.id}
            index={index}
            question={question}
            selected={selectedAnswers[question.id] ?? null}
            saving={savingQuestionId === question.id}
            solutionsUnlocked={examSubmitted}
            paperMarkSchemeUrl={paperMarkSchemeUrl}
            disabled={submitting || examSubmitted}
            onSelect={(letter) => void handleSelectAnswer(question.id, letter)}
          />
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          {examSubmitted ? (
            <>
              <p className="text-sm text-muted-foreground">
                {attempt.correctCount}/{attempt.totalQuestions} correct · {attempt.score}%
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="pill" onClick={reviewIncorrect}>
                  Review answers
                </Button>
                <Button asChild size="pill">
                  <Link href={ROUTES.subjectResource(programSlug, "past-papers")}>
                    Back to Past Papers
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
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
                {submitting || submitAttempt.isPending ? "Submitting…" : "Submit paper"}
              </Button>
            </>
          )}
        </div>
      </div>

      <AdminModal
        open={resultModalOpen && examSubmitted}
        title="Paper result"
        description={`${paper.title} · ${programName}`}
        onClose={() => setResultModalOpen(false)}
        className="sm:max-w-md"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" size="pill" onClick={reviewIncorrect}>
              Review answers
            </Button>
            <Button type="button" size="pill" onClick={() => setResultModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-center">
          <p className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-muted text-primary">
            <CheckCircle2 className="h-7 w-7" aria-hidden />
          </p>
          <div>
            <p className="text-4xl font-bold text-foreground">{attempt.score}%</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {attempt.correctCount}/{attempt.totalQuestions} correct
              {attempt.totalMarks > 0
                ? ` · ${attempt.earnedMarks}/${attempt.totalMarks} marks`
                : ""}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Correct and incorrect answers are highlighted on this page. Use Mark Scheme and Video
            Solutions on each question to review.
          </p>
        </div>
      </AdminModal>
    </div>
  );
}

function PastPaperQuestionCard({
  index,
  question,
  selected,
  saving,
  solutionsUnlocked,
  paperMarkSchemeUrl,
  disabled,
  onSelect,
}: {
  index: number;
  question: PastPaperAttemptQuestion;
  selected: string | null;
  saving: boolean;
  solutionsUnlocked: boolean;
  paperMarkSchemeUrl?: string | null;
  disabled: boolean;
  onSelect: (letter: string) => void;
}) {
  const displayNumber = question.number || index + 1;
  const isMcq = question.options.length >= 2;

  return (
    <StudyQuestionCard
      contentMode="plain"
      solutionsUnlocked={solutionsUnlocked}
      examMode
      selectedAnswer={selected}
      onSelectAnswer={isMcq ? onSelect : undefined}
      saving={saving}
      answerDisabled={disabled}
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
        isCorrect: question.isCorrect,
        paperMarkSchemeUrl,
      }}
    />
  );
}
