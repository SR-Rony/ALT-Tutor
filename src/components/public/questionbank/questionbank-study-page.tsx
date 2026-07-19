"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  Expand,
  ExternalLink,
  FileText,
  HelpCircle,
  ListOrdered,
  Lock,
  PlayCircle,
  SlidersHorizontal,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared";
import { ROUTES } from "@/constants";
import {
  ResourceHero,
  SubjectBreadcrumbNav,
  useSubjectBreadcrumbs,
} from "@/components/public/subjects";
import { useQbQuestions, useSavePracticeAnswer, useStartPracticeSession, useSubmitPracticeSession } from "@/hooks/use-questionbank";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import type { PracticeAnswerFeedback, QbDifficulty, QbFilters, QbPaper, QbQuestion, QbQuestionType } from "@/types/qb.types";
import { cn } from "@/utils";
import { downloadQuestionPaperPdf } from "@/utils/qb-pdf-export";

type Props = {
  programSlug: string;
  subtopicSlug: string;
  examMode?: boolean;
  initialPaper?: QbPaper;
};
type ViewMode = "ALL" | "COMPLETE" | "INCOMPLETE";

const LETTERS = ["A", "B", "C", "D"] as const;

const TYPE_OPTIONS: { value: QbQuestionType; label: string }[] = [
  { value: "DATA_BASED", label: "Data-based Questions" },
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice Questions" },
  { value: "SHORT_ANSWER", label: "Short Answer (P2 SQ)" },
];

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
                ? keyDot(meta.label)
                : "bg-border"
            )}
          />
        ))}
      </span>
    </span>
  );
}

function keyDot(label: string) {
  if (label === "Hard") return "bg-accent";
  if (label === "Medium") return "bg-[#f59e0b]";
  return "bg-accent-green";
}

function toggleFilter<T extends string>(list: T[] | undefined, value: T): T[] {
  const current = list ?? [];
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}

function isStructuredType(type: string) {
  const t = type.toUpperCase();
  return t === "SHORT_ANSWER" || t === "DATA_BASED";
}

function QuestionCard({
  question,
  index,
  completed,
  onToggleComplete,
  solutionsUnlocked = true,
  examMode = false,
  selectedAnswer,
  feedback,
  onSelectAnswer,
  saving = false,
}: {
  question: QbQuestion;
  index: number;
  completed?: boolean;
  onToggleComplete?: () => void;
  solutionsUnlocked?: boolean;
  examMode?: boolean;
  selectedAnswer?: string | null;
  feedback?: PracticeAnswerFeedback | null;
  onSelectAnswer?: (letter: string) => void;
  saving?: boolean;
}) {
  if (isStructuredType(String(question.questionType))) {
    return (
      <StructuredQuestionCard
        question={question}
        index={index}
        completed={completed}
        onToggleComplete={onToggleComplete}
        solutionsUnlocked={solutionsUnlocked}
        examMode={examMode}
      />
    );
  }

  return (
    <McqQuestionCard
      question={question}
      index={index}
      completed={completed}
      onToggleComplete={onToggleComplete}
      solutionsUnlocked={solutionsUnlocked}
      examMode={examMode}
      selectedAnswer={selectedAnswer}
      feedback={feedback}
      onSelectAnswer={onSelectAnswer}
      saving={saving}
    />
  );
}

function McqQuestionCard({
  question,
  index,
  completed,
  onToggleComplete,
  solutionsUnlocked = true,
  examMode = false,
  selectedAnswer,
  feedback,
  onSelectAnswer,
  saving = false,
}: {
  question: QbQuestion;
  index: number;
  completed?: boolean;
  onToggleComplete?: () => void;
  solutionsUnlocked?: boolean;
  examMode?: boolean;
  selectedAnswer?: string | null;
  feedback?: PracticeAnswerFeedback | null;
  onSelectAnswer?: (letter: string) => void;
  saving?: boolean;
}) {
  const [modal, setModal] = useState<"scheme" | "video" | null>(null);
  const selected = selectedAnswer ?? null;
  const answered = selected !== null;
  const correctAnswer = feedback?.correctAnswer?.toUpperCase() ?? "";
  const correct = feedback ? feedback.isCorrect : false;
  const qLabel = `Question ${question.number || index + 1}`;
  const markScheme = feedback?.markScheme ?? question.markScheme;
  const videoUrl = feedback?.videoUrl ?? question.videoUrl;

  return (
    <section id={`q-${question.number}`} className="scroll-mt-28">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">{qLabel}</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <ThumbsUp className="h-4 w-4" />
          <ThumbsDown className="h-4 w-4" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_10rem]">
        <article className="rounded-2xl border border-border bg-card p-4 shadow-[0_8px_28px_-16px_rgba(24,119,242,0.2)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {question.calculatorAllowed ? (
                <span className="rounded-md bg-primary-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                  Calculator
                </span>
              ) : null}
              <DifficultyDots difficulty={String(question.difficulty)} />
            </div>
            <Expand className="h-4 w-4 text-muted-foreground" />
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
                alt={`Diagram for ${qLabel}`}
                className="mx-auto max-h-[28rem] w-auto max-w-full object-contain p-3"
              />
            </div>
          ) : null}

          <ul className="mt-4 space-y-1.5 text-sm text-foreground">
            {question.options.map((opt, i) => (
              <li key={`${i}-${opt}`}>
                <span className="font-semibold">{LETTERS[i] ?? i + 1}.</span> {opt}
              </li>
            ))}
          </ul>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Choose an answer
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LETTERS.slice(0, question.options.length).map((letter) => {
                const isSelected = selected === letter;
                const isCorrectChoice = correctAnswer ? letter === correctAnswer : false;
                return (
                  <button
                    key={letter}
                    type="button"
                    disabled={saving || (answered && examMode && !solutionsUnlocked)}
                    onClick={() => onSelectAnswer?.(letter)}
                    className={cn(
                      "relative flex h-12 items-center justify-center rounded-xl border text-sm font-bold transition",
                      !answered && "border-border bg-muted/40 hover:border-primary hover:bg-primary-muted",
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
        </article>

        <aside className="flex flex-row flex-wrap gap-2 lg:flex-col lg:flex-nowrap">
          <div className="flex gap-2 lg:justify-end">
            <button
              type="button"
              className="rounded-lg border border-border p-2 text-muted-foreground hover:text-primary"
            >
              <Bookmark className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onToggleComplete}
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
            disabled={!markScheme || !solutionsUnlocked}
          >
            Mark Scheme
          </Button>
          <Button
            type="button"
            className="justify-start bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setModal("video")}
            disabled={!videoUrl || !solutionsUnlocked}
          >
            Video Solutions
            {videoUrl ? (
              <span className="ml-auto rounded-full bg-white/25 px-1.5 text-[10px] font-bold text-white">
                1
              </span>
            ) : null}
          </Button>
          <a
            href="#"
            className="inline-flex items-center gap-1 px-1 text-sm text-muted-foreground hover:text-primary"
          >
            Formula Booklet <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {examMode && !solutionsUnlocked ? (
            <p className="text-xs font-medium text-muted-foreground">
              Locked until exam submission
            </p>
          ) : null}
        </aside>
      </div>

      <AdminModal
        open={modal === "scheme"}
        title="Mark Scheme"
        description={`${qLabel} · Official solution guidance`}
        onClose={() => setModal(null)}
        className="sm:max-w-2xl"
        footer={
          <div className="flex justify-end">
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
          <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm leading-relaxed text-foreground md:text-[15px]">
            <p className="whitespace-pre-wrap">{markScheme}</p>
          </div>
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

/** P2 (SQ/CQ) — structured written question, PDF-style layout */
function StructuredQuestionCard({
  question,
  index,
  completed,
  onToggleComplete,
  solutionsUnlocked = true,
  examMode = false,
}: {
  question: QbQuestion;
  index: number;
  completed?: boolean;
  onToggleComplete?: () => void;
  solutionsUnlocked?: boolean;
  examMode?: boolean;
}) {
  const [modal, setModal] = useState<"scheme" | "video" | null>(null);
  const qLabel = `Question ${question.number || index + 1}`;
  const maxMarkMatch = question.body?.match(/\[Maximum mark:\s*(\d+)\]/i);
  const maxMarks = maxMarkMatch?.[1];

  return (
    <section id={`q-${question.number}`} className="scroll-mt-28">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">{qLabel}</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <ThumbsUp className="h-4 w-4" />
          <ThumbsDown className="h-4 w-4" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_10rem]">
        <article className="rounded-2xl border border-border bg-card p-4 shadow-[0_8px_28px_-16px_rgba(24,119,242,0.2)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {question.calculatorAllowed ? (
                <span className="rounded-md bg-primary-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                  Calculator
                </span>
              ) : null}
              <DifficultyDots difficulty={String(question.difficulty)} />
              <span className="rounded-md border border-primary/20 bg-primary-muted/50 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                Paper 2 · SQ
              </span>
            </div>
            <Expand className="h-4 w-4 text-muted-foreground" />
          </div>

          {maxMarks ? (
            <p className="mb-2 text-sm font-semibold text-foreground">[Maximum mark: {maxMarks}]</p>
          ) : null}

          <p className="text-sm leading-relaxed text-foreground md:text-base">{question.prompt}</p>
          {question.body ? (
            <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground md:text-[15px]">
              {question.body}
            </div>
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

          <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your written response
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {examMode && !solutionsUnlocked
                ? "Complete your answer on paper or in your workbook. Mark scheme unlocks after submission."
                : "Use the mark scheme and video solution on the right when you are ready to check your work."}
            </p>
          </div>
        </article>

        <aside className="flex flex-row flex-wrap gap-2 lg:flex-col lg:flex-nowrap">
          <div className="flex gap-2 lg:justify-end">
            <button
              type="button"
              className="rounded-lg border border-border p-2 text-muted-foreground hover:text-primary"
            >
              <Bookmark className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onToggleComplete}
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
            disabled={!question.markScheme || !solutionsUnlocked}
          >
            Mark Scheme
          </Button>
          <Button
            type="button"
            className="justify-start bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setModal("video")}
            disabled={!question.videoUrl || !solutionsUnlocked}
          >
            Video Solutions
            {question.videoUrl ? (
              <span className="ml-auto rounded-full bg-white/25 px-1.5 text-[10px] font-bold text-white">
                1
              </span>
            ) : null}
          </Button>
          <a
            href="#"
            className="inline-flex items-center gap-1 px-1 text-sm text-muted-foreground hover:text-primary"
          >
            Formula Booklet <ExternalLink className="h-3.5 w-3.5" />
          </a>
          {examMode && !solutionsUnlocked ? (
            <p className="text-xs font-medium text-muted-foreground">
              Locked until exam submission
            </p>
          ) : null}
        </aside>
      </div>

      <AdminModal
        open={modal === "scheme"}
        title="Mark Scheme"
        description={`${qLabel} · Structured question solution`}
        onClose={() => setModal(null)}
        className="sm:max-w-2xl"
        footer={
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => setModal(null)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm leading-relaxed text-foreground md:text-[15px]">
          <p className="whitespace-pre-wrap">{question.markScheme}</p>
        </div>
      </AdminModal>

      <AdminModal
        open={modal === "video"}
        title="Video Solution"
        description={`${qLabel} · Worked solution`}
        onClose={() => setModal(null)}
        className="sm:max-w-3xl"
        footer={
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => setModal(null)}>
              Close
            </Button>
          </div>
        }
      >
        {question.videoUrl ? <VideoEmbed key={question.videoUrl} url={question.videoUrl} /> : null}
      </AdminModal>
    </section>
  );
}

export function QuestionbankStudyPage({
  programSlug,
  subtopicSlug,
  examMode = false,
  initialPaper,
}: Props) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [typeOpen, setTypeOpen] = useState(false);
  const [filters, setFilters] = useState<QbFilters>(() =>
    initialPaper ? { paper: [initialPaper] } : {}
  );
  const [viewMode, setViewMode] = useState<ViewMode>("ALL");
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [answerFeedback, setAnswerFeedback] = useState<Record<string, PracticeAnswerFeedback>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [sessionScore, setSessionScore] = useState<number | null>(null);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const sessionStartedRef = useRef(false);
  const typeRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, error, isFetching } = useQbQuestions(programSlug, subtopicSlug, filters);
  const startSession = useStartPracticeSession();
  const saveAnswer = useSavePracticeAnswer();
  const submitSession = useSubmitPracticeSession();

  const program = data?.subtopic.topic.program;
  const topic = data?.subtopic.topic;

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "questionbank",
    resourceLabel: "Questionbank",
    resourceHref: ROUTES.subjectQuestionbank(programSlug),
    topicLabel: data?.subtopic.title,
  });

  useEffect(() => {
    if (!data?.questions.length || !isAuthenticated || sessionStartedRef.current) return;
    sessionStartedRef.current = true;
    void startSession
      .mutateAsync({
        programSlug,
        subtopicSlug,
        mode: examMode ? "EXAM" : "STUDY",
        difficulty: filters.difficulty,
        paper: filters.paper,
        questionType: filters.type,
        durationMinutes: examMode ? 60 : undefined,
      })
      .then((result) => {
        setSessionId(result.session.id);
        if (result.session.status === "SUBMITTED") {
          setExamSubmitted(true);
          setSessionScore(result.session.score ?? null);
        }
      })
      .catch((err: ApiError) => {
        setSessionError(err.message || "Could not start practice session");
        sessionStartedRef.current = false;
      });
  }, [
    data?.questions.length,
    isAuthenticated,
    examMode,
    filters.difficulty,
    filters.paper,
    filters.type,
    programSlug,
    subtopicSlug,
    startSession,
  ]);

  const handleSelectAnswer = async (questionId: string, letter: string) => {
    if (!sessionId || selectedAnswers[questionId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: letter }));
    setSavingQuestionId(questionId);
    try {
      const result = await saveAnswer.mutateAsync({
        sessionId,
        questionId,
        answer: letter,
        reveal: !examMode,
      });
      if (result.feedback) {
        setAnswerFeedback((prev) => ({ ...prev, [questionId]: result.feedback! }));
      }
    } catch (err) {
      setSessionError((err as ApiError).message || "Failed to save answer");
    } finally {
      setSavingQuestionId(null);
    }
  };

  const handleSubmitExam = async () => {
    if (!sessionId) return;
    try {
      const result = await submitSession.mutateAsync(sessionId);
      setExamSubmitted(true);
      setSessionScore(result.session.score ?? null);
      const nextFeedback: Record<string, PracticeAnswerFeedback> = {};
      for (const q of result.questions) {
        if (q.isCorrect != null && q.correctAnswer) {
          nextFeedback[q.id] = {
            isCorrect: Boolean(q.isCorrect),
            correctAnswer: q.correctAnswer,
            markScheme: q.markScheme,
            videoUrl: q.videoUrl,
          };
        }
      }
      setAnswerFeedback((prev) => ({ ...prev, ...nextFeedback }));
    } catch (err) {
      setSessionError((err as ApiError).message || "Failed to submit exam");
    }
  };

  useEffect(() => {
    if (!typeOpen) return;
    const onDown = (e: MouseEvent) => {
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setTypeOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [typeOpen]);

  const visibleQuestions = useMemo(() => {
    const list = data?.questions ?? [];
    if (viewMode === "COMPLETE") return list.filter((q) => completedIds.has(q.id));
    if (viewMode === "INCOMPLETE") return list.filter((q) => !completedIds.has(q.id));
    return list;
  }, [data?.questions, viewMode, completedIds]);

  const typeLabel =
    !filters.type?.length || filters.type.length === TYPE_OPTIONS.length
      ? "All"
      : filters.type.length === 1
        ? TYPE_OPTIONS.find((t) => t.value === filters.type![0])?.label ?? "All"
        : `${filters.type.length} selected`;

  const toggleComplete = (id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const goToQuestion = () => {
    const n = window.prompt("Go to question number:");
    if (!n) return;
    const el = document.getElementById(`q-${n}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading) return <PageLoader label="Loading questions..." />;

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Study set not found."}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={ROUTES.subjectQuestionbank(programSlug)}>Back to questionbank</Link>
        </Button>
      </div>
    );
  }

  const hasActiveFilters = Boolean(
    filters.difficulty?.length || filters.paper?.length || filters.type?.length
  );
  const solutionsUnlocked = !examMode || examSubmitted;

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title={`${program?.name ?? ""} - Questionbank`}
        subtitle={topic ? `${data.subtopic.title} — ${topic.title}` : data.subtopic.title}
        description={
          examMode
            ? "Exam mode is active. Mark schemes and video solutions remain locked until you submit."
            : (data.subtopic.description ?? undefined)
        }
        icon={<HelpCircle className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      />

      {/* Filter panel — PDF light-blue box */}
      <div className="sticky top-16 z-30 border-b border-primary/10 bg-primary-muted/40 lg:top-[4.5rem]">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary-muted/60"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden />
              Filters
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition",
                  filtersOpen ? "rotate-180" : "rotate-0"
                )}
                aria-hidden
              />
            </button>

            {!filtersOpen ? (
              <span className="flex-1 text-sm text-muted-foreground">
                {isFetching
                  ? "Updating…"
                  : `${visibleQuestions.length} of ${data.questions.length} questions`}
              </span>
            ) : null}

            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              onClick={goToQuestion}
            >
              <ListOrdered className="h-4 w-4" aria-hidden />
              Go to Question
            </button>
          </div>

          {filtersOpen ? (
            <div className="mt-3 rounded-xl border border-primary/15 bg-primary-muted/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-3">
                <div ref={typeRef} className="relative">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Question Type
                  </span>
                  <button
                    type="button"
                    className="inline-flex min-w-[8rem] items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/30"
                    onClick={() => setTypeOpen((v) => !v)}
                  >
                    <span className="truncate">{typeLabel}</span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-muted-foreground transition",
                        typeOpen && "rotate-180"
                      )}
                    />
                  </button>
                  {typeOpen ? (
                    <div className="absolute left-0 top-full z-40 mt-1.5 min-w-[15rem] rounded-xl border border-border bg-card p-2 shadow-[0_16px_40px_-12px_rgba(24,119,242,0.3)]">
                      {TYPE_OPTIONS.map((opt) => {
                        const checked = filters.type?.includes(opt.value) ?? false;
                        return (
                          <label
                            key={opt.value}
                            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-primary-muted"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
                              checked={checked}
                              onChange={() =>
                                setFilters((f) => ({
                                  ...f,
                                  type: toggleFilter(f.type, opt.value),
                                }))
                              }
                            />
                            {opt.label}
                          </label>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <FilterChecks label="Paper">
                  {(["PAPER_1", "PAPER_2"] as QbPaper[]).map((p) => (
                    <NativeCheck
                      key={p}
                      label={p === "PAPER_1" ? "Paper 1" : "Paper 2"}
                      checked={filters.paper?.includes(p) ?? false}
                      onChange={() =>
                        setFilters((f) => ({ ...f, paper: toggleFilter(f.paper, p) }))
                      }
                    />
                  ))}
                </FilterChecks>

                <FilterChecks label="Difficulty">
                  {(["EASY", "MEDIUM", "HARD"] as QbDifficulty[]).map((d) => (
                    <NativeCheck
                      key={d}
                      label={d.charAt(0) + d.slice(1).toLowerCase()}
                      checked={filters.difficulty?.includes(d) ?? false}
                      onChange={() =>
                        setFilters((f) => ({
                          ...f,
                          difficulty: toggleFilter(f.difficulty, d),
                        }))
                      }
                    />
                  ))}
                </FilterChecks>

                <FilterChecks label="View">
                  {(["ALL", "COMPLETE", "INCOMPLETE"] as ViewMode[]).map((mode) => (
                    <label
                      key={mode}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground"
                    >
                      <input
                        type="radio"
                        name="qb-view"
                        className="h-4 w-4 border-border text-primary accent-primary focus:ring-primary/30"
                        checked={viewMode === mode}
                        onChange={() => setViewMode(mode)}
                      />
                      {mode === "ALL" ? "All" : mode === "COMPLETE" ? "Complete" : "Incomplete"}
                    </label>
                  ))}
                </FilterChecks>

                {hasActiveFilters ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={() => setFilters({})}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-6">
        {!isAuthenticated ? (
          <div className="rounded-xl border border-primary/20 bg-primary-muted/60 px-4 py-3 text-sm text-foreground">
            <Link href={`${ROUTES.auth.login}?next=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`} className="font-semibold text-primary hover:underline">
              Sign in
            </Link>{" "}
            to check answers and track your practice session.
          </div>
        ) : null}
        {sessionError ? (
          <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
            {sessionError}
          </p>
        ) : null}
        {examMode ? (
          <div
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              examSubmitted
                ? "border-[var(--accent-green)]/40 bg-[var(--accent-green)]/10 text-foreground"
                : "border-primary/20 bg-primary-muted/60 text-foreground"
            )}
          >
            {examSubmitted ? (
              <p className="font-medium">
                Exam submitted{sessionScore != null ? ` — score ${sessionScore}%` : ""}. Mark scheme and
                video solutions are now unlocked.
              </p>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="inline-flex items-center gap-2 font-medium">
                  <Lock className="h-4 w-4 text-primary" />
                  Solutions are locked during exam mode.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-primary/30"
                  onClick={() =>
                    downloadQuestionPaperPdf({
                      title: `${program?.name ?? "Exam"} — ${data.subtopic.title}`,
                      subtitle: topic?.title,
                      questions: visibleQuestions,
                    })
                  }
                >
                  <FileText className="mr-1.5 h-4 w-4" />
                  Download full question paper (PDF)
                </Button>
              </div>
            )}
          </div>
        ) : null}

        {visibleQuestions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
            No questions match these filters.
          </p>
        ) : (
          visibleQuestions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              completed={completedIds.has(question.id)}
              onToggleComplete={() => toggleComplete(question.id)}
              solutionsUnlocked={solutionsUnlocked}
              examMode={examMode}
              selectedAnswer={selectedAnswers[question.id] ?? null}
              feedback={answerFeedback[question.id] ?? null}
              onSelectAnswer={(letter) => void handleSelectAnswer(question.id, letter)}
              saving={savingQuestionId === question.id}
            />
          ))
        )}

        {examMode ? (
          <div className="sticky bottom-4 z-20 flex flex-col gap-2 sm:flex-row sm:justify-end">
            {!examSubmitted ? (
              <Button
                type="button"
                size="pill"
                className="w-full sm:w-auto"
                disabled={!sessionId || submitSession.isPending}
                onClick={() => void handleSubmitExam()}
              >
                {submitSession.isPending ? "Submitting…" : "Submit exam and unlock solutions"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="pill"
                className="w-full sm:w-auto"
                onClick={() => {
                  setExamSubmitted(false);
                  setSessionId(null);
                  setSelectedAnswers({});
                  setAnswerFeedback({});
                  sessionStartedRef.current = false;
                }}
              >
                Start new exam
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
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
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
      if (parts[0] === "shorts" && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
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

function FilterChecks({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function NativeCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-border text-primary accent-primary focus:ring-primary/30"
        checked={checked}
        onChange={onChange}
      />
      {label}
    </label>
  );
}
