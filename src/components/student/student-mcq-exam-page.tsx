"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useMcqStatus, useStartMcqExam, useSubmitMcqExam } from "@/hooks/use-mcq";
import { mcqService } from "@/services/mcq.service";
import type { ApiError } from "@/types";
import type { McqResult, McqSession } from "@/types/mcq.types";
import { cn } from "@/utils";

const LETTERS = ["A", "B", "C", "D"] as const;
const AUTOSAVE_DEBOUNCE_MS = 800;

type SaveState = "idle" | "saving" | "saved" | "failed";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isSession(data: McqSession | McqResult): data is McqSession {
  return "questions" in data && Array.isArray((data as McqSession).questions);
}

export function StudentMcqExamPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = String(params.assignmentId ?? "");

  const { data: status, isLoading, error, refetch } = useMcqStatus(assignmentId);
  const startExam = useStartMcqExam();
  const submitExam = useSubmitMcqExam();

  const [phase, setPhase] = useState<"intro" | "exam" | "result">("intro");
  const [session, setSession] = useState<McqSession | null>(null);
  const [result, setResult] = useState<McqResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitFailed, setSubmitFailed] = useState(false);
  const [dirty, setDirty] = useState(false);

  const answersRef = useRef(answers);
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const lastSavedJsonRef = useRef<string>("{}");

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const flushSave = useCallback(async () => {
    if (!session || phase !== "exam") return;
    const payload = answersRef.current;
    const json = JSON.stringify(payload);
    if (json === lastSavedJsonRef.current) {
      setDirty(false);
      setSaveState("saved");
      return;
    }
    setSaveState("saving");
    try {
      await mcqService.saveAnswers(assignmentId, payload);
      lastSavedJsonRef.current = json;
      setDirty(false);
      setSaveState("saved");
    } catch {
      setSaveState("failed");
    }
  }, [assignmentId, phase, session]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void flushSave();
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [flushSave]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current != null) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!status) return;
    if (status.phase === "IN_PROGRESS" && status.inProgressAttemptId) {
      void mcqService.getSession(assignmentId).then((data) => {
        if (isSession(data)) {
          const restored = (data.savedAnswers as Record<string, string>) ?? {};
          setSession(data);
          setAnswers(restored);
          lastSavedJsonRef.current = JSON.stringify(restored);
          setDirty(false);
          setSaveState("saved");
          setCurrentIndex(0);
          setRemaining(data.remainingSeconds);
          setPhase("exam");
        } else {
          setResult(data);
          setPhase("result");
        }
      });
    } else if (status.latestResult && (status.phase === "COMPLETED" || status.phase === "CAN_RETAKE")) {
      setResult(status.latestResult);
      setPhase("result");
    }
  }, [status, assignmentId]);

  useEffect(() => {
    if (phase !== "exam") return;
    const t = window.setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) {
          window.clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [phase, session?.attemptId]);

  useEffect(() => {
    if (phase !== "exam") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [phase]);

  const handleSubmit = useCallback(
    async (auto = false) => {
      if (!session || submitting) return;
      if (saveTimerRef.current != null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      setSubmitting(true);
      setActionError(null);
      setSubmitFailed(false);
      try {
        if (dirtyRef.current) {
          await flushSave();
        }
        const res = await submitExam.mutateAsync({ assignmentId, answers: answersRef.current });
        setResult(res);
        setPhase("result");
        setDirty(false);
        setSubmitFailed(false);
        void refetch();
      } catch (err) {
        setActionError((err as ApiError)?.message || "Submit failed");
        setSubmitFailed(true);
        setSubmitting(false);
        if (auto) {
          // Keep exam phase so student can manually retry after auto-submit failure.
          setPhase("exam");
        }
      }
    },
    [session, submitting, submitExam, assignmentId, refetch, flushSave]
  );

  useEffect(() => {
    if (phase === "exam" && remaining === 0 && session && !submitting) {
      void handleSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase]);

  const handleStart = async () => {
    setActionError(null);
    try {
      const data = await startExam.mutateAsync(assignmentId);
      const restored = (data.savedAnswers as Record<string, string>) ?? {};
      setSession(data);
      setAnswers(restored);
      lastSavedJsonRef.current = JSON.stringify(restored);
      setDirty(false);
      setSaveState(Object.keys(restored).length ? "saved" : "idle");
      setCurrentIndex(0);
      setRemaining(data.remainingSeconds);
      setPhase("exam");
      setSubmitFailed(false);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Could not start exam");
    }
  };

  const selectAnswer = (questionId: string, option: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: option };
      answersRef.current = next;
      return next;
    });
    setDirty(true);
    setSaveState("saving");
    scheduleSave();
  };

  const handleExit = async () => {
    if (dirty) {
      const ok = window.confirm(
        "You have unsaved answers. Save and leave the exam? Your attempt will stay in progress."
      );
      if (!ok) return;
      await flushSave();
    }
    router.push(ROUTES.student.assignments);
  };

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v && v.trim()).length,
    [answers]
  );
  const currentQuestion = session?.questions[currentIndex] ?? null;

  const saveLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : saveState === "failed"
          ? "Save failed — retrying on next change"
          : "";

  if (isLoading && !status) {
    return <PageLoader label="Loading exam..." />;
  }

  if (error || !status) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-accent">{(error as unknown as ApiError)?.message || "Exam not found"}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={ROUTES.student.assignments}>Back</Link>
        </Button>
      </div>
    );
  }

  if (phase === "result" && result) {
    const waiting = result.resultsReleased === false;
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-6">
        <div
          className={cn(
            "rounded-2xl border p-8 text-center",
            waiting
              ? "border-primary/20 bg-primary-muted/40"
              : result.passed
                ? "border-accent-green/40 bg-[#ecfdf3]"
                : "border-accent/30 bg-accent/5"
          )}
        >
          {waiting ? (
            <Clock className="mx-auto mb-3 h-12 w-12 text-primary" />
          ) : result.passed ? (
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-accent-green" />
          ) : (
            <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-accent" />
          )}
          <h1 className="text-2xl font-bold text-foreground">
            {waiting ? "Results pending" : result.passed ? "Passed" : "Not passed"}
          </h1>
          {waiting ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Score and answers are hidden until results are released.
            </p>
          ) : (
            <>
              <p className="mt-2 text-4xl font-bold text-primary">{result.score}%</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {result.correctCount} / {result.totalQuestions} correct · Attempt #
                {result.attemptNumber}
              </p>
              {status.passingScore != null ? (
                <p className="mt-1 text-xs text-muted-foreground">Pass mark: {status.passingScore}%</p>
              ) : null}
            </>
          )}
          <p className="mt-3 text-sm text-muted-foreground">{result.message}</p>
        </div>

        {result.canReviewAnswers && result.review?.length ? (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Answer review</h2>
            {result.review.map((item, idx) => (
              <article
                key={item.questionId}
                className={cn(
                  "rounded-xl border p-4 text-sm",
                  item.isCorrect ? "border-accent-green/30 bg-[#ecfdf3]/40" : "border-accent/20 bg-accent/5"
                )}
              >
                <p className="font-semibold text-foreground">
                  Q{idx + 1}. {item.text}
                </p>
                <p className="mt-2 text-muted-foreground">
                  Your answer: <strong className="text-foreground">{item.yourAnswer ?? "—"}</strong>
                </p>
                <p className="text-muted-foreground">
                  Correct: <strong className="text-foreground">{item.correctAnswer}</strong>
                </p>
              </article>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-center gap-3">
          {status.canRetake ? (
            <Button
              type="button"
              onClick={() => {
                setPhase("intro");
                setResult(null);
                setSession(null);
                setCurrentIndex(0);
                void refetch();
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Retake exam ({status.attemptsRemaining} left)
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href={ROUTES.student.assignments}>Back to assignments</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "exam" && session) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 pb-12">
        <div className="sticky top-16 z-20 rounded-2xl border border-primary/15 bg-card px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{session.title}</p>
              <p className="text-xs text-muted-foreground">
                Attempt #{session.attemptNumber} · {answeredCount}/{session.totalQuestions} answered
                {saveLabel ? ` · ${saveLabel}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary-muted/60 px-3 py-1 text-xs font-semibold text-primary">
                <EyeOff className="h-3.5 w-3.5" />
                Solutions hidden during exam
              </span>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-lg font-bold",
                  remaining < 60 ? "bg-accent/10 text-accent" : "bg-primary-muted text-primary"
                )}
              >
                <Clock className="h-4 w-4" />
                {formatTime(remaining)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <article className="rounded-2xl border border-border bg-card p-5">
            {currentQuestion ? (
              <>
                <p className="mb-3 text-sm font-semibold text-primary">
                  Question {currentIndex + 1} of {session.totalQuestions}
                </p>
                <p className="mb-4 text-foreground">{currentQuestion.text}</p>
                <ul className="space-y-2">
                  {currentQuestion.options.map((opt, oi) => {
                    const letter = LETTERS[oi] ?? String(oi + 1);
                    const selected = answers[currentQuestion.id] === opt;
                    return (
                      <li key={opt}>
                        <button
                          type="button"
                          onClick={() => selectAnswer(currentQuestion.id, opt)}
                          className={cn(
                            "flex w-full items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition",
                            selected
                              ? "border-primary bg-primary-muted text-primary"
                              : "border-border hover:border-primary/40"
                          )}
                        >
                          <span className="font-bold">{letter}.</span>
                          <span>{opt}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-6 flex flex-wrap justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={currentIndex >= session.totalQuestions - 1}
                    onClick={() =>
                      setCurrentIndex((prev) => Math.min(session.totalQuestions - 1, prev + 1))
                    }
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : null}
          </article>

          <aside className="h-fit rounded-2xl border border-border bg-card p-3 sm:p-4 lg:sticky lg:top-36">
            <p className="text-sm font-semibold text-foreground">Question Navigator</p>
            <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-5 sm:gap-2">
              {session.questions.map((q, idx) => {
                const isActive = idx === currentIndex;
                const isAnswered = Boolean(answers[q.id]);
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "h-9 rounded-lg border text-xs font-semibold transition",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isAnswered
                          ? "border-[var(--accent-green)] bg-[var(--accent-green)]/10 text-[var(--accent-green)]"
                          : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Green = answered, blue = current question.
            </p>
            {saveState === "failed" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => void flushSave()}
              >
                Retry save
              </Button>
            ) : null}
          </aside>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => void handleExit()}>
            Exit
          </Button>
          <Button type="button" disabled={submitting} onClick={() => void handleSubmit(false)}>
            {submitting
              ? "Submitting..."
              : submitFailed
                ? "Retry submit"
                : "Finish & see marks"}
          </Button>
        </div>
        {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}
        {submitFailed ? (
          <p className="text-sm text-muted-foreground">
            Auto-submit failed. Your answers are kept — tap Retry submit when ready.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <PageHeader title={status.title} description={status.description} className="mb-0" />
      <div className="rounded-2xl border border-border bg-card p-6">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Duration: <strong className="text-foreground">{status.durationMinutes} minutes</strong> (starts on
            click)
          </li>
          <li>
            Questions: <strong className="text-foreground">{status.questionCount}</strong>
          </li>
          <li>
            Attempts: <strong className="text-foreground">{status.attemptsUsed}</strong> /{" "}
            {status.maxAttempts} used
          </li>
          {status.passingScore != null ? (
            <li>
              Pass mark: <strong className="text-foreground">{status.passingScore}%</strong>
            </li>
          ) : null}
        </ul>

        {status.latestResult ? (
          <div className="mt-4 rounded-xl bg-muted/40 p-3 text-sm">
            Last score: <strong>{status.latestResult.score}%</strong>
            {status.latestResult.passed ? " (Passed)" : " (Failed)"}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {status.phase === "NOT_STARTED" || status.phase === "CAN_RETAKE" ? (
            <Button type="button" disabled={startExam.isPending} onClick={() => void handleStart()}>
              {startExam.isPending
                ? "Starting..."
                : status.phase === "CAN_RETAKE"
                  ? "Start retake"
                  : "Start exam"}
            </Button>
          ) : status.phase === "IN_PROGRESS" ? (
            <Button type="button" onClick={() => void handleStart()}>
              Continue exam
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">No attempts remaining.</p>
          )}
          <Button asChild variant="outline">
            <Link href={ROUTES.student.assignments}>Back</Link>
          </Button>
        </div>
        {actionError ? <p className="mt-3 text-sm text-accent">{actionError}</p> : null}
      </div>
    </div>
  );
}
