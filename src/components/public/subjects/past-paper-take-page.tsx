"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  Check,
  CheckCircle2,
  Clock,
  Expand,
  ExternalLink,
  FileText,
  HelpCircle,
  Lock,
  PlayCircle,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageLoader } from "@/components/shared";
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

const LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

function formatTimer(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function difficultyMeta(d: string) {
  const key = d.toUpperCase();
  if (key === "HARD") return { label: "Hard", color: "text-accent", filled: 4, total: 4 };
  if (key === "MEDIUM") return { label: "Medium", color: "text-[#f59e0b]", filled: 2, total: 4 };
  return { label: "Easy", color: "text-accent-green", filled: 1, total: 4 };
}

function DifficultyDots({ difficulty }: { difficulty: string }) {
  const meta = difficultyMeta(difficulty);
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-semibold", meta.color)}>
      {meta.label}
      <span className="inline-flex gap-1">
        {Array.from({ length: meta.total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-2 rounded-full",
              i < meta.filled
                ? meta.label === "Hard"
                  ? "bg-accent"
                  : meta.label === "Medium"
                    ? "bg-[#f59e0b]"
                    : "bg-accent-green"
                : "bg-border"
            )}
          />
        ))}
      </span>
    </span>
  );
}

function paperLabel(paper?: string | null) {
  const key = String(paper ?? "").toUpperCase();
  if (key === "PAPER_3" || key === "3") return "Paper 3";
  if (key === "PAPER_2" || key === "2") return "Paper 2";
  return "Paper 1";
}

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
  } catch {
    return null;
  }
  return null;
}

function VideoEmbed({ url }: { url: string }) {
  const yt = youtubeEmbedUrl(url);
  if (yt) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-sm">
        <iframe
          src={yt}
          title="Video solution"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  const lower = url.toLowerCase();
  if (/\.(mp4|webm|ogg)(\?|$)/.test(lower)) {
    return (
      <video
        controls
        className="aspect-video w-full rounded-xl border border-border bg-black shadow-sm"
        src={url}
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
      <PlayCircle className="mx-auto mb-2 h-8 w-8 text-primary" />
      <p className="text-sm text-muted-foreground">Inline preview is unavailable for this link.</p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        Watch video <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
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
  const [modal, setModal] = useState<"scheme" | "video" | null>(null);
  const [completed, setCompleted] = useState(false);
  const displayNumber = question.number || index + 1;
  const qLabel = `Question ${displayNumber}`;
  const answered = selected !== null;
  const correctAnswer = (question.correctAnswer ?? "").toUpperCase();
  const correct = question.isCorrect === true;
  const optionCount = Math.max(question.options.length, 1);
  const letters = LETTERS.slice(0, optionCount);
  const markScheme = question.markScheme;
  const videoUrl = question.videoUrl;
  const isMcq = question.options.length > 0;
  const hasScheme = Boolean(markScheme) || Boolean(paperMarkSchemeUrl);

  return (
    <section id={`pp-q-${question.id}`} className="scroll-mt-28" data-pp-q>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">{qLabel}</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          {solutionsUnlocked && question.isCorrect != null ? (
            question.isCorrect ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent-green)]">
                <CheckCircle2 className="h-4 w-4" /> Correct
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-accent">
                <XCircle className="h-4 w-4" /> Incorrect
              </span>
            )
          ) : (
            <>
              <ThumbsUp className="h-4 w-4" />
              <ThumbsDown className="h-4 w-4" />
            </>
          )}
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4",
          solutionsUnlocked ? "lg:grid-cols-[minmax(0,1fr)_10rem]" : "grid-cols-1"
        )}
      >
        <article className="rounded-2xl border border-border bg-card p-4 shadow-[0_8px_28px_-16px_rgba(24,119,242,0.2)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {question.calculatorAllowed ? (
                <span className="rounded-md bg-primary-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                  Calculator
                </span>
              ) : (
                <span className="rounded-md bg-primary-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                  No calculator
                </span>
              )}
              {question.difficulty ? (
                <DifficultyDots difficulty={String(question.difficulty)} />
              ) : null}
              <span className="rounded-md border border-primary/15 bg-primary-muted/40 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                {paperLabel(question.paper)}
                {isMcq ? " · MCQ" : ""}
              </span>
              {question.marks != null && question.marks > 0 ? (
                <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-bold uppercase text-foreground">
                  [{question.marks}]
                </span>
              ) : null}
            </div>
            <Expand className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="text-sm leading-relaxed text-foreground md:text-base">{question.prompt}</p>
          {question.body ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{question.body}</p>
          ) : null}

          {question.diagramUrl ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={question.diagramUrl}
                alt={`Diagram for ${qLabel}`}
                className="mx-auto max-h-[28rem] w-auto max-w-full object-contain p-3"
              />
            </div>
          ) : null}

          {isMcq ? (
            <ul className="mt-4 space-y-1.5 text-sm text-foreground">
              {question.options.map((opt, i) => (
                <li key={`${i}-${opt}`}>
                  <span className="font-semibold">{LETTERS[i] ?? i + 1}.</span> {opt}
                </li>
              ))}
            </ul>
          ) : null}

          {isMcq ? (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Choose an answer
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {letters.map((letter) => {
                  const isSelected = selected === letter;
                  const isCorrectChoice = correctAnswer ? letter === correctAnswer : false;
                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={saving || disabled}
                      onClick={() => onSelect(letter)}
                      className={cn(
                        "relative flex h-12 items-center justify-center rounded-xl border text-sm font-bold transition",
                        !answered &&
                          "border-border bg-muted/40 hover:border-primary hover:bg-primary-muted",
                        answered &&
                          solutionsUnlocked &&
                          isCorrectChoice &&
                          "border-accent-green bg-[#ecfdf3] text-accent-green",
                        answered &&
                          solutionsUnlocked &&
                          isSelected &&
                          !correct &&
                          "border-accent bg-accent/10 text-accent",
                        answered &&
                          solutionsUnlocked &&
                          !isSelected &&
                          !isCorrectChoice &&
                          "opacity-50",
                        answered &&
                          !solutionsUnlocked &&
                          isSelected &&
                          "border-primary bg-primary-muted text-primary"
                      )}
                    >
                      {letter}
                      {answered && solutionsUnlocked && isCorrectChoice ? (
                        <CheckCircle2 className="absolute right-2 h-4 w-4" />
                      ) : null}
                      {answered && solutionsUnlocked && isSelected && !correct ? (
                        <XCircle className="absolute right-2 h-4 w-4" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </article>

        {solutionsUnlocked ? (
          <aside className="flex flex-row flex-wrap gap-2 lg:flex-col lg:flex-nowrap">
            <div className="flex gap-2 lg:justify-end">
              <button
                type="button"
                className="rounded-lg border border-border p-2 text-muted-foreground hover:text-primary"
                aria-label="Bookmark"
              >
                <Bookmark className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCompleted((v) => !v)}
                className={cn(
                  "rounded-lg border p-2 transition",
                  completed
                    ? "border-accent-green bg-[#ecfdf3] text-accent-green"
                    : "border-border text-muted-foreground hover:text-accent-green"
                )}
                aria-label={completed ? "Mark incomplete" : "Mark complete"}
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              className="justify-start border-primary/40 text-primary hover:bg-primary-muted hover:text-primary"
              onClick={() => setModal("scheme")}
              disabled={!hasScheme}
            >
              <FileText className="mr-1.5 h-4 w-4" />
              Mark Scheme
            </Button>
            <Button
              type="button"
              className="justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setModal("video")}
              disabled={!videoUrl}
            >
              Video Solutions
              {videoUrl ? (
                <span className="ml-auto rounded-full bg-white/25 px-1.5 text-[10px] font-bold text-white">
                  1
                </span>
              ) : null}
            </Button>
            {paperMarkSchemeUrl ? (
              <a
                href={paperMarkSchemeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-1 text-sm text-muted-foreground hover:text-primary"
              >
                Mark scheme file <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </aside>
        ) : null}
      </div>

      <AdminModal
        open={modal === "scheme"}
        title="Mark Scheme"
        description={`${qLabel} · Official solution guidance`}
        onClose={() => setModal(null)}
        className="sm:max-w-2xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            {paperMarkSchemeUrl ? (
              <a
                href={paperMarkSchemeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Open mark scheme PDF <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span />
            )}
            <Button type="button" variant="outline" onClick={() => setModal(null)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-lg bg-primary-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <FileText className="h-3.5 w-3.5" />
            Solution notes
          </div>
          {markScheme ? (
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm leading-relaxed text-foreground md:text-[15px]">
              <p className="whitespace-pre-wrap">{markScheme}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No per-question mark scheme text. Use the paper mark scheme file if available.
            </p>
          )}
          {correctAnswer ? (
            <p className="text-xs text-muted-foreground">
              Correct answer:{" "}
              <span className="font-semibold text-foreground">{correctAnswer}</span>
            </p>
          ) : null}
        </div>
      </AdminModal>

      <AdminModal
        open={modal === "video"}
        title="Video Solution"
        description={`${qLabel} · Short worked explanation`}
        onClose={() => setModal(null)}
        className="sm:max-w-3xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            {videoUrl ? (
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Open in new tab <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span />
            )}
            <Button type="button" variant="outline" onClick={() => setModal(null)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-lg bg-primary-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <PlayCircle className="h-3.5 w-3.5" />
            1 video available
          </div>
          {videoUrl ? <VideoEmbed key={videoUrl} url={videoUrl} /> : null}
        </div>
      </AdminModal>
    </section>
  );
}
