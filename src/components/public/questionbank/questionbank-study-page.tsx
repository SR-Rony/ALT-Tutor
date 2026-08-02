"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, forwardRef, type ReactNode } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  HelpCircle,
  Info,
  ListOrdered,
  Lock,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared";
import { StudyQuestionCard } from "@/components/public/questions";
import { ROUTES } from "@/constants";
import {
  ResourceHero,
  SubjectBreadcrumbNav,
  useSubjectBreadcrumbs,
} from "@/components/public/subjects";
import { useQbProgram, useQbQuestions, useSavePracticeAnswer, useStartPracticeSession, useSubmitPracticeSession } from "@/hooks/use-questionbank";
import { GoldUnlockModal } from "@/components/public/questionbank/gold-unlock-modal";
import { useAppSelector } from "@/store";
import { questionbankService } from "@/services/questionbank.service";
import { normalizeAccessBadge, tierLabel } from "@/lib/access-tier";
import type { ApiError } from "@/types";
import type {
  PracticeAnswerFeedback,
  PracticeHistoryItem,
  QbDifficulty,
  QbFilters,
  QbPaper,
  QbQuestion,
  QbQuestionType,
} from "@/types/qb.types";
import { cn } from "@/utils";
import { downloadQuestionPaperPdf } from "@/utils/qb-pdf-export";

type Props = {
  programSlug: string;
  subtopicSlug: string;
  examMode?: boolean;
  initialPaper?: QbPaper;
};
type ViewMode = "ALL" | "COMPLETE" | "INCOMPLETE";

function formatTimer(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const TYPE_OPTIONS: { value: QbQuestionType; label: string }[] = [
  { value: "DATA_BASED", label: "Data-based Questions" },
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice Questions" },
  { value: "SHORT_ANSWER", label: "Short Answer Questions" },
];

const QUESTION_COUNT_OPTIONS = [10, 20, 30] as const;
type QuestionCountLimit = (typeof QUESTION_COUNT_OPTIONS)[number];
/** Default browse page size when not using a Paper 2/3 exam pack filter. */
const STUDY_PAGE_SIZE = 10;

function isMcqPaper(paper: string) {
  return String(paper).toUpperCase() === "PAPER_1";
}

function isTheoryPaper(paper: string) {
  return !isMcqPaper(paper);
}

function isMcqQuestion(question: { questionType?: string | null; paper?: string | null; options?: string[] }) {
  const type = String(question.questionType ?? "").toUpperCase();
  if (type === "SHORT_ANSWER" || type === "DATA_BASED") return false;
  if (type === "MULTIPLE_CHOICE") return true;
  if ((question.options?.length ?? 0) >= 2) return true;
  // Legacy rows: Paper 1 was MCQ by convention.
  return isMcqPaper(String(question.paper ?? "PAPER_1"));
}

function toggleFilter<T extends string>(list: T[] | undefined, value: T): T[] {
  const current = list ?? [];
  return current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}

function filterSelectionLabel<T extends string>(
  selected: T[] | undefined,
  options: { value: T; label: string }[],
  allLabel = "All"
) {
  if (!selected?.length || selected.length === options.length) return allLabel;
  if (selected.length === 1) {
    return options.find((option) => option.value === selected[0])?.label ?? allLabel;
  }
  return `${selected.length} selected`;
}

function QuestionCard({
  question,
  displayNumber,
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
  displayNumber: number;
  completed?: boolean;
  onToggleComplete?: () => void;
  solutionsUnlocked?: boolean;
  examMode?: boolean;
  selectedAnswer?: string | null;
  feedback?: PracticeAnswerFeedback | null;
  onSelectAnswer?: (letter: string) => void;
  saving?: boolean;
}) {
  const mcq = isMcqQuestion(question);
  return (
    <StudyQuestionCard
      contentMode="rich"
      solutionsUnlocked={solutionsUnlocked}
      examMode={examMode}
      selectedAnswer={selectedAnswer}
      onSelectAnswer={mcq ? onSelectAnswer : undefined}
      saving={saving}
      completed={completed}
      onToggleComplete={onToggleComplete}
      idPrefix="q"
      question={{
        id: question.id,
        displayNumber,
        prompt: question.prompt,
        body: question.body,
        diagramUrl: question.diagramUrl,
        difficulty: question.difficulty,
        paper: question.paper,
        calculatorAllowed: question.calculatorAllowed,
        marks: question.marks,
        options: mcq ? question.options ?? [] : [],
        markScheme: feedback?.markScheme ?? question.markScheme,
        videoUrl: feedback?.videoUrl ?? question.videoUrl,
        correctAnswer: feedback?.correctAnswer ?? question.correctAnswer,
        isCorrect: feedback ? feedback.isCorrect : null,
      }}
    />
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
  const [questionCountLimit, setQuestionCountLimit] = useState<QuestionCountLimit>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [answerFeedback, setAnswerFeedback] = useState<Record<string, PracticeAnswerFeedback>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [sessionScore, setSessionScore] = useState<number | null>(null);
  const [sessionCorrectCount, setSessionCorrectCount] = useState<number | null>(null);
  const [sessionTotalQuestions, setSessionTotalQuestions] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistoryItem[]>([]);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionBooting, setSessionBooting] = useState(false);
  const sessionStartedRef = useRef(false);
  const typeRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, error, isFetching } = useQbQuestions(programSlug, subtopicSlug, filters);
  const { data: programOverview } = useQbProgram(programSlug);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const startSession = useStartPracticeSession();
  const saveAnswer = useSavePracticeAnswer();
  const submitSession = useSubmitPracticeSession();

  const program = data?.subtopic.topic.program;
  const topic = data?.subtopic.topic;

  const paperFilterOptions = useMemo(() => {
    const count = Math.max(1, data?.subtopic.paperCount ?? 3);
    return Array.from({ length: count }, (_, i) => {
      const value = `PAPER_${i + 1}` as QbPaper;
      return { value, label: `Paper ${i + 1}` };
    });
  }, [data?.subtopic.paperCount]);

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated || !examMode) return;
    try {
      setPracticeHistory(await questionbankService.getPracticeHistory("EXAM"));
    } catch {
      // History is supplementary; the active exam remains usable if this request fails.
    }
  }, [isAuthenticated, examMode]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const applySessionResult = useCallback(
    (result: {
      session: {
        id: string;
        status: string;
        score?: number | null;
        correctCount?: number | null;
        totalQuestions?: number | null;
        expiresAt?: string | null;
      };
      questions: Array<{
        id: string;
        studentAnswer?: string | null;
        isCorrect?: boolean | null;
        correctAnswer?: string;
        markScheme?: string | null;
        videoUrl?: string | null;
      }>;
    }) => {
      setSessionId(result.session.id);
      setExpiresAt(result.session.expiresAt ?? null);
      setSessionTotalQuestions(result.session.totalQuestions ?? null);
      setSessionCorrectCount(result.session.correctCount ?? null);
      if (result.session.expiresAt && result.session.status !== "SUBMITTED") {
        setRemainingSeconds(
          Math.max(
            0,
            Math.floor((new Date(result.session.expiresAt).getTime() - Date.now()) / 1000)
          )
        );
      } else if (result.session.status === "SUBMITTED") {
        setRemainingSeconds(0);
      }

      const restoredAnswers: Record<string, string> = {};
      for (const question of result.questions) {
        if (question.studentAnswer) restoredAnswers[question.id] = question.studentAnswer;
      }
      setSelectedAnswers(restoredAnswers);

      if (result.session.status === "SUBMITTED") {
        setExamSubmitted(true);
        setSessionScore(result.session.score ?? null);
        const restoredFeedback: Record<string, PracticeAnswerFeedback> = {};
        for (const question of result.questions) {
          if (question.isCorrect != null && question.correctAnswer) {
            restoredFeedback[question.id] = {
              isCorrect: question.isCorrect,
              correctAnswer: question.correctAnswer,
              markScheme: question.markScheme,
              videoUrl: question.videoUrl,
            };
          }
        }
        setAnswerFeedback(restoredFeedback);
      } else {
        setExamSubmitted(false);
        setSessionScore(null);
        setAnswerFeedback({});
      }
    },
    []
  );

  const bootSession = useCallback(
    async (forceNew = false) => {
      if (!data?.questions.length || !isAuthenticated) return;
      setSessionError(null);
      setSessionBooting(true);
      try {
        const result = await startSession.mutateAsync({
          programSlug,
          subtopicSlug,
          mode: examMode ? "EXAM" : "STUDY",
          difficulty: filters.difficulty,
          paper: filters.paper,
          questionType: filters.type,
          durationMinutes: examMode ? 60 : undefined,
          forceNew,
        });
        applySessionResult(result);
        sessionStartedRef.current = true;
        void loadHistory();
      } catch (err) {
        setSessionError((err as ApiError).message || "Could not start practice session");
        sessionStartedRef.current = false;
      } finally {
        setSessionBooting(false);
      }
    },
    [
      applySessionResult,
      data?.questions.length,
      examMode,
      filters.difficulty,
      filters.paper,
      filters.type,
      isAuthenticated,
      loadHistory,
      programSlug,
      startSession,
      subtopicSlug,
    ]
  );

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
    void bootSession(false);
  }, [data?.questions.length, isAuthenticated, bootSession]);

  const filtersFrozen = examMode && Boolean(sessionId) && !examSubmitted;

  const changeFilters = useCallback(
    (updater: (prev: QbFilters) => QbFilters) => {
      if (filtersFrozen) return;
      setFilters((prev) => updater(prev));
      sessionStartedRef.current = false;
      setSessionId(null);
      setSelectedAnswers({});
      setAnswerFeedback({});
      setExamSubmitted(false);
      setSessionScore(null);
      setSessionCorrectCount(null);
      setSessionTotalQuestions(null);
      setExpiresAt(null);
      setRemainingSeconds(null);
    },
    [filtersFrozen]
  );

  const reviewIncorrect = () => {
    const firstWrong = (data?.questions ?? []).find((q) => answerFeedback[q.id]?.isCorrect === false);
    const target = firstWrong
      ? document.getElementById(`q-${firstWrong.id}`)
      : document.getElementById(`q-${data?.questions[0]?.id ?? ""}`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openHistorySession = async (item: PracticeHistoryItem) => {
    setSessionError(null);
    setSessionBooting(true);
    try {
      if (item.status === "IN_PROGRESS") {
        sessionStartedRef.current = false;
        await bootSession(false);
      } else {
        const result = await questionbankService.getPracticeSession(item.id);
        applySessionResult(result);
        sessionStartedRef.current = true;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setSessionError((err as ApiError).message || "Could not open that attempt");
    } finally {
      setSessionBooting(false);
    }
  };

  useEffect(() => {
    if (!examMode || examSubmitted || !expiresAt) return;
    const update = () => {
      setRemainingSeconds(
        Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      );
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [examMode, examSubmitted, expiresAt]);

  const handleSelectAnswer = async (questionId: string, letter: string) => {
    if (!sessionId || examSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: letter }));
    setSavingQuestionId(questionId);
    try {
      const result = await saveAnswer.mutateAsync({
        sessionId,
        questionId,
        answer: letter,
        reveal: !examMode,
      });
      if (result.expired && result.result) {
        setExamSubmitted(true);
        setSessionScore(result.result.session.score ?? null);
        setSessionCorrectCount(result.result.session.correctCount ?? null);
        setSessionTotalQuestions(result.result.session.totalQuestions ?? null);
        setRemainingSeconds(0);
        const expiredFeedback: Record<string, PracticeAnswerFeedback> = {};
        const expiredAnswers: Record<string, string> = {};
        for (const question of result.result.questions) {
          if (question.studentAnswer) expiredAnswers[question.id] = question.studentAnswer;
          if (question.isCorrect != null && question.correctAnswer) {
            expiredFeedback[question.id] = {
              isCorrect: question.isCorrect,
              correctAnswer: question.correctAnswer,
              markScheme: question.markScheme,
              videoUrl: question.videoUrl,
            };
          }
        }
        setSelectedAnswers(expiredAnswers);
        setAnswerFeedback(expiredFeedback);
        void loadHistory();
        return;
      }
      if (result.feedback) {
        setAnswerFeedback((prev) => ({ ...prev, [questionId]: result.feedback! }));
      }
    } catch (err) {
      setSessionError((err as ApiError).message || "Failed to save answer");
    } finally {
      setSavingQuestionId(null);
    }
  };

  const handleSubmitExam = async (automatic = false) => {
    if (!sessionId) return;
    const unanswered = Math.max(0, (data?.questions.length ?? 0) - Object.keys(selectedAnswers).length);
    if (
      !automatic &&
      !window.confirm(
        unanswered > 0
          ? `Submit now? ${unanswered} question${unanswered === 1 ? "" : "s"} remain unanswered.`
          : "Submit this exam now? You will not be able to change your answers."
      )
    ) {
      return;
    }
    try {
      const result = await submitSession.mutateAsync(sessionId);
      setExamSubmitted(true);
      setSessionScore(result.session.score ?? null);
      setSessionCorrectCount(result.session.correctCount ?? null);
      setSessionTotalQuestions(result.session.totalQuestions ?? null);
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
      setRemainingSeconds(0);
      void loadHistory();
    } catch (err) {
      setSessionError((err as ApiError).message || "Failed to submit exam");
    }
  };

  useEffect(() => {
    if (
      examMode &&
      !examSubmitted &&
      sessionId &&
      remainingSeconds === 0 &&
      !submitSession.isPending
    ) {
      void handleSubmitExam(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, examMode, examSubmitted, sessionId, submitSession.isPending]);

  useEffect(() => {
    if (!typeOpen) return;
    const onDown = (event: MouseEvent) => {
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) setTypeOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [typeOpen]);

  const filteredQuestions = useMemo(() => {
    const list = data?.questions ?? [];
    if (viewMode === "COMPLETE") return list.filter((q) => completedIds.has(q.id));
    if (viewMode === "INCOMPLETE") return list.filter((q) => !completedIds.has(q.id));
    return list;
  }, [data?.questions, viewMode, completedIds]);

  const showTheoryPaperTools = useMemo(() => {
    if (filters.paper?.length) {
      return filters.paper.some((paper) => isTheoryPaper(paper));
    }
    if (initialPaper && isTheoryPaper(initialPaper)) return true;
    return (
      filteredQuestions.length > 0 &&
      filteredQuestions.every((question) => isTheoryPaper(String(question.paper)))
    );
  }, [filters.paper, filteredQuestions, initialPaper]);

  const theoryPackQuestions = useMemo(() => {
    if (!showTheoryPaperTools) return [];
    return filteredQuestions
      .filter((question) => !isMcqQuestion(question))
      .slice(0, questionCountLimit);
  }, [filteredQuestions, questionCountLimit, showTheoryPaperTools]);

  const visibleQuestions = useMemo(() => {
    if (!showTheoryPaperTools) return filteredQuestions;
    const mcqAlongside = filteredQuestions.filter((question) => isMcqQuestion(question));
    return [...theoryPackQuestions, ...mcqAlongside];
  }, [filteredQuestions, showTheoryPaperTools, theoryPackQuestions]);

  /**
   * Paper 2/3 exam pack (10/20/30 filter): one page with the full pack for download.
   * Otherwise browse with 10 questions per page. Exam mode keeps the full set on one screen.
   */
  const useSinglePagePack = Boolean(showTheoryPaperTools && !examMode);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, viewMode, questionCountLimit, showTheoryPaperTools, subtopicSlug, examMode]);

  const totalPages = useMemo(() => {
    if (examMode || useSinglePagePack || visibleQuestions.length === 0) return 1;
    return Math.max(1, Math.ceil(visibleQuestions.length / STUDY_PAGE_SIZE));
  }, [examMode, useSinglePagePack, visibleQuestions.length]);

  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const pagedQuestions = useMemo(() => {
    if (examMode || useSinglePagePack) return visibleQuestions;
    const start = (safePage - 1) * STUDY_PAGE_SIZE;
    return visibleQuestions.slice(start, start + STUDY_PAGE_SIZE);
  }, [examMode, useSinglePagePack, visibleQuestions, safePage]);

  const pageRangeLabel = useMemo(() => {
    if (visibleQuestions.length === 0) return null;
    if (examMode || useSinglePagePack) {
      return `1–${visibleQuestions.length}`;
    }
    const start = (safePage - 1) * STUDY_PAGE_SIZE + 1;
    const end = Math.min(safePage * STUDY_PAGE_SIZE, visibleQuestions.length);
    return `${start}–${end}`;
  }, [examMode, useSinglePagePack, visibleQuestions.length, safePage]);

  /** Serial number restarts at 1 inside each paper (Paper 1: 1..n, Paper 2: 1..n, …). */
  const displayNumberById = useMemo(() => {
    const counters: Record<string, number> = {};
    const map: Record<string, number> = {};
    for (const question of visibleQuestions) {
      const paper = String(question.paper).toUpperCase();
      counters[paper] = (counters[paper] ?? 0) + 1;
      map[question.id] = counters[paper];
    }
    return map;
  }, [visibleQuestions]);

  const typeLabel = filterSelectionLabel(filters.type, TYPE_OPTIONS);

  const handleDownloadQuestions = () => {
    const pack = theoryPackQuestions.length > 0 ? theoryPackQuestions : visibleQuestions;
    downloadQuestionPaperPdf({
      title: `${program?.name ?? "Questionbank"} — ${data?.subtopic.title ?? "Questions"}`,
      subtitle: `${topic?.title ?? ""} · ${pack.length} questions`,
      questions: pack,
    });
  };

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
    const num = Number.parseInt(n, 10);
    if (!Number.isFinite(num)) return;
    const match = visibleQuestions.find((q) => displayNumberById[q.id] === num);
    if (match && !examMode && !useSinglePagePack) {
      const idx = visibleQuestions.findIndex((q) => q.id === match.id);
      if (idx >= 0) {
        setCurrentPage(Math.floor(idx / STUDY_PAGE_SIZE) + 1);
      }
      window.setTimeout(() => {
        document.getElementById(`q-${match.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      return;
    }
    const el = match
      ? document.getElementById(`q-${match.id}`)
      : document.querySelector(`[data-q-num="${num}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading && !data) return <PageLoader label="Loading questions..." />;

  if (error || !data) {
    const apiError = error as unknown as ApiError | undefined;
    const isLocked = apiError?.status === 403;
    const studyNext = ROUTES.subjectQuestionbankStudy(programSlug, subtopicSlug);
    const unlockHref = `${ROUTES.subjectQuestionbank(programSlug)}?unlock=1`;
    const lockedSub = programOverview?.qbTopics
      .flatMap((topic) => topic.subtopics)
      .find((sub) => sub.slug === subtopicSlug);
    const requiredTier = normalizeAccessBadge(lockedSub?.badge ?? "GOLD");
    const lockedTitle =
      requiredTier === "FREE" ? "Paid study set" : `${tierLabel(requiredTier)} study set`;

    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        {isLocked ? (
          <>
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#fff8ef] text-[#d4a017]">
              <Lock className="h-6 w-6" aria-hidden />
            </span>
            <h1 className="mt-4 text-xl font-extrabold text-foreground">{lockedTitle}</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {apiError?.message ||
                "This study set requires a Practice Pass or enrollment in a linked course."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {programOverview ? (
                <Button type="button" size="pill" onClick={() => setUnlockOpen(true)}>
                  Unlock {tierLabel(requiredTier)}
                </Button>
              ) : (
                <Button asChild size="pill">
                  <Link href={unlockHref}>Unlock with Practice Pass</Link>
                </Button>
              )}
              {!isAuthenticated ? (
                <Button asChild variant="outline" size="pill">
                  <Link href={`${ROUTES.auth.login}?next=${encodeURIComponent(studyNext)}`}>
                    Sign in
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" size="pill">
                  <Link href={ROUTES.courses}>Browse courses</Link>
                </Button>
              )}
            </div>
            <Button asChild variant="ghost" className="mt-4">
              <Link href={ROUTES.subjectQuestionbank(programSlug)}>Back to questionbank</Link>
            </Button>
            {programOverview ? (
              <GoldUnlockModal
                open={unlockOpen}
                onClose={() => setUnlockOpen(false)}
                programId={programOverview.id}
                programName={programOverview.name}
                programSlug={programSlug}
                subtopicTitle={lockedSub?.title ?? subtopicSlug}
                requiredTier={requiredTier}
              />
            ) : null}
          </>
        ) : (
          <>
            <p className="text-sm text-accent">
              {apiError?.message || "Study set not found."}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={ROUTES.subjectQuestionbank(programSlug)}>Back to questionbank</Link>
            </Button>
          </>
        )}
      </div>
    );
  }

  const hasActiveFilters = Boolean(
    filters.difficulty?.length || filters.paper?.length || filters.type?.length
  );
  const canViewSolutions = Boolean(data.access?.canViewSolutions);
  const solutionsUnlocked = canViewSolutions && (!examMode || examSubmitted);

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

      {/* Filter panel */}
      <div className="border-b border-primary/10 bg-primary-muted/30">
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
                  : pageRangeLabel
                    ? `Showing ${pageRangeLabel} of ${visibleQuestions.length} questions`
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
            <div className="mt-3 rounded-lg border border-[#c5d9ef] bg-[#e8f0fa] px-3 py-3 md:px-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:divide-x lg:divide-[#c5d9ef]">
                <QuestionTypeDropdown
                  ref={typeRef}
                  open={typeOpen}
                  onOpenChange={setTypeOpen}
                  displayLabel={typeLabel}
                  selected={filters.type}
                  disabled={filtersFrozen}
                  onSelectAll={() => changeFilters((f) => ({ ...f, type: undefined }))}
                  onToggle={(value) =>
                    changeFilters((f) => {
                      const current = f.type?.length
                        ? f.type
                        : TYPE_OPTIONS.map((option) => option.value);
                      const next = current.includes(value)
                        ? current.filter((item) => item !== value)
                        : [...current, value];
                      if (next.length === 0 || next.length === TYPE_OPTIONS.length) {
                        return { ...f, type: undefined };
                      }
                      return { ...f, type: next };
                    })
                  }
                />

                <FilterInlineGroup label="Paper">
                  {paperFilterOptions.map((paper) => (
                    <NativeCheck
                      key={paper.value}
                      label={paper.label}
                      checked={filters.paper?.includes(paper.value) ?? false}
                      onChange={() =>
                        changeFilters((f) => ({
                          ...f,
                          paper: toggleFilter(f.paper, paper.value),
                        }))
                      }
                      disabled={filtersFrozen}
                    />
                  ))}
                </FilterInlineGroup>

                <FilterInlineGroup label="Difficulty">
                  {(["EASY", "MEDIUM", "HARD"] as QbDifficulty[]).map((difficulty) => (
                    <NativeCheck
                      key={difficulty}
                      label={difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
                      checked={filters.difficulty?.includes(difficulty) ?? false}
                      onChange={() =>
                        changeFilters((f) => ({
                          ...f,
                          difficulty: toggleFilter(f.difficulty, difficulty),
                        }))
                      }
                      disabled={filtersFrozen}
                    />
                  ))}
                </FilterInlineGroup>

                <FilterInlineGroup label="View">
                  {(["ALL", "COMPLETE", "INCOMPLETE"] as ViewMode[]).map((mode) => (
                    <label
                      key={mode}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground"
                    >
                      <input
                        type="radio"
                        name="qb-view"
                        className="h-3.5 w-3.5 border-foreground/60 text-primary accent-primary focus:ring-primary/30"
                        checked={viewMode === mode}
                        onChange={() => setViewMode(mode)}
                      />
                      {mode === "ALL" ? "All" : mode === "COMPLETE" ? "Complete" : "Incomplete"}
                    </label>
                  ))}
                </FilterInlineGroup>

                {showTheoryPaperTools ? (
                  <FilterInlineGroup label="Questions">
                    {QUESTION_COUNT_OPTIONS.map((count) => (
                      <label
                        key={count}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-foreground"
                      >
                        <input
                          type="radio"
                          name="qb-question-count"
                          className="h-3.5 w-3.5 border-foreground/60 text-primary accent-primary focus:ring-primary/30"
                          checked={questionCountLimit === count}
                          disabled={filtersFrozen}
                          onChange={() => setQuestionCountLimit(count)}
                        />
                        {count}
                      </label>
                    ))}
                  </FilterInlineGroup>
                ) : null}

                {hasActiveFilters ? (
                  <div className="flex items-end lg:pl-4">
                    <button
                      type="button"
                      disabled={filtersFrozen}
                      className="text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => changeFilters(() => ({}))}
                    >
                      Clear
                    </button>
                  </div>
                ) : null}
              </div>
              {filtersFrozen ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Filters are locked during an active exam. Submit first to change them.
                </p>
              ) : null}
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
            to check answers, unlock mark schemes, and track your practice session.
          </div>
        ) : !canViewSolutions ? (
          <div className="rounded-xl border border-[#f5d0a8] bg-[#fff8ef] px-4 py-3 text-sm text-[#9a3412]">
            Mark schemes and video solutions stay locked until you unlock this set with a{" "}
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={() => setUnlockOpen(true)}
            >
              Practice Pass
            </button>{" "}
            or linked course enrollment.
          </div>
        ) : null}
        {sessionError ? (
          <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
            {sessionError}
          </p>
        ) : null}

        {showTheoryPaperTools ? (
          <div className="rounded-xl border border-[#c5d9ef] bg-[#e8f0fa] px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Paper 2 / Paper 3 exam pack
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Showing {theoryPackQuestions.length} question
                  {theoryPackQuestions.length === 1 ? "" : "s"}
                  {filteredQuestions.filter((q) => isTheoryPaper(String(q.paper))).length >
                  theoryPackQuestions.length
                    ? ` of ${filteredQuestions.filter((q) => isTheoryPaper(String(q.paper))).length} matched`
                    : ""}
                  . Download the set to practise offline.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-primary/30 bg-card"
                  disabled={theoryPackQuestions.length === 0}
                  onClick={handleDownloadQuestions}
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  Download questions
                </Button>
              </div>
            </div>
          </div>
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    Exam submitted
                    {sessionCorrectCount != null && sessionTotalQuestions != null
                      ? ` — ${sessionCorrectCount}/${sessionTotalQuestions} correct`
                      : ""}
                    {sessionScore != null ? ` (${sessionScore}%)` : ""}. Mark schemes and video
                    solutions are now unlocked.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={reviewIncorrect}>
                  Review answers
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-2 font-medium">
                    <Lock className="h-4 w-4 text-primary" />
                    Solutions are locked during exam mode.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {Object.keys(selectedAnswers).length}/{data.questions.length} answered
                  </p>
                </div>
                {remainingSeconds != null ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-lg font-bold",
                      remainingSeconds < 300
                        ? "bg-accent/10 text-accent"
                        : "bg-card text-primary"
                    )}
                  >
                    <Clock className="h-4 w-4" />
                    {formatTimer(remainingSeconds)}
                  </span>
                ) : null}
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
          <>
            {pagedQuestions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                displayNumber={displayNumberById[question.id] ?? index + 1}
                completed={completedIds.has(question.id)}
                onToggleComplete={() => toggleComplete(question.id)}
                solutionsUnlocked={solutionsUnlocked}
                examMode={examMode}
                selectedAnswer={selectedAnswers[question.id] ?? null}
                feedback={answerFeedback[question.id] ?? null}
                onSelectAnswer={(letter) => void handleSelectAnswer(question.id, letter)}
                saving={savingQuestionId === question.id}
              />
            ))}

            {!examMode && !useSinglePagePack && totalPages > 1 ? (
              <nav
                className="flex flex-col items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row"
                aria-label="Question pagination"
              >
                <p className="text-sm text-muted-foreground">
                  Showing {pageRangeLabel} of {visibleQuestions.length}
                  <span className="mx-1.5 text-border">·</span>
                  Page {safePage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={safePage <= 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={safePage >= totalPages}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </nav>
            ) : null}
          </>
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
                {submitSession.isPending
                  ? "Submitting…"
                  : `Submit exam (${Math.max(
                      0,
                      data.questions.length - Object.keys(selectedAnswers).length
                    )} unanswered)`}
              </Button>
            ) : (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button type="button" variant="outline" size="pill" onClick={reviewIncorrect}>
                  Review answers
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="pill"
                  className="w-full sm:w-auto"
                  disabled={sessionBooting || startSession.isPending}
                  onClick={() => {
                    setExamSubmitted(false);
                    setSessionId(null);
                    setSelectedAnswers({});
                    setAnswerFeedback({});
                    setSessionScore(null);
                    setSessionCorrectCount(null);
                    setSessionTotalQuestions(null);
                    setExpiresAt(null);
                    setRemainingSeconds(null);
                    sessionStartedRef.current = false;
                    void bootSession(true);
                  }}
                >
                  {sessionBooting || startSession.isPending ? "Starting…" : "Start new exam"}
                </Button>
              </div>
            )}
          </div>
        ) : null}

        {examMode && practiceHistory.length ? (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">Practice exam history</h2>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[40rem] text-sm">
                <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Started</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Answered</th>
                    <th className="px-4 py-3 text-left">Score</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {practiceHistory
                    .filter((item) => !item.subtopicId || item.subtopicId === data.subtopic.id)
                    .map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="px-4 py-3">{new Date(item.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          {item.status === "SUBMITTED" ? "Submitted" : "In progress"}
                        </td>
                        <td className="px-4 py-3">
                          {item.answeredCount}/{item.totalQuestions}
                        </td>
                        <td className="px-4 py-3">
                          {item.status === "SUBMITTED" ? `${item.score ?? 0}%` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={sessionBooting}
                            onClick={() => void openHistorySession(item)}
                          >
                            {item.status === "IN_PROGRESS" ? "Resume" : "Review"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>

      {programOverview ? (
        <GoldUnlockModal
          open={unlockOpen}
          onClose={() => setUnlockOpen(false)}
          programId={programOverview.id}
          programName={programOverview.name}
          programSlug={programSlug}
          subtopicTitle={data.subtopic.title}
          requiredTier={data.subtopic.badge}
        />
      ) : null}
    </div>
  );
}

const QuestionTypeDropdown = forwardRef<
  HTMLDivElement,
  {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    displayLabel: string;
    selected: QbQuestionType[] | undefined;
    disabled?: boolean;
    onSelectAll: () => void;
    onToggle: (value: QbQuestionType) => void;
  }
>(function QuestionTypeDropdown(
  { open, onOpenChange, displayLabel, selected, disabled, onSelectAll, onToggle },
  ref
) {
  const allSelected = !selected?.length || selected.length === TYPE_OPTIONS.length;

  return (
    <div ref={ref} className="relative min-w-[10.5rem] px-0 lg:pr-5">
      <p
        className={cn(
          "mb-2 text-sm font-medium",
          open ? "text-primary" : "text-[#5a7a9a]"
        )}
      >
        Question Type
      </p>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        className={cn(
          "inline-flex min-w-[6.5rem] items-center justify-between gap-3 rounded border border-foreground/80 bg-white px-2.5 py-1 text-sm font-medium text-foreground transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60",
          open && "border-primary/70 ring-1 ring-primary/20"
        )}
        onClick={() => onOpenChange(!open)}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-foreground/70 transition",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-40 mt-1 min-w-[15.5rem] border border-foreground/85 bg-white py-1 shadow-[0_4px_14px_rgba(15,23,42,0.08)]">
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-[#f4f8fc]",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded-none border-foreground/70 text-primary accent-primary focus:ring-primary/30"
              checked={allSelected}
              disabled={disabled}
              onChange={onSelectAll}
            />
            <span className="flex-1">All</span>
            <span
              className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-white"
              title="Show all question types"
              aria-label="Show all question types"
            >
              <Info className="h-2.5 w-2.5" aria-hidden />
            </span>
          </label>

          {TYPE_OPTIONS.map((option) => {
            const checked = selected?.includes(option.value) ?? allSelected;
            return (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-[#f4f8fc]",
                  disabled && "cursor-not-allowed opacity-60"
                )}
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded-none border-foreground/70 text-primary accent-primary focus:ring-primary/30"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onToggle(option.value)}
                />
                {option.label}
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
});

function FilterInlineGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-[8.5rem] px-0 lg:px-5">
      <p className="mb-2 text-sm font-medium text-[#5a7a9a]">{label}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">{children}</div>
    </div>
  );
}

function NativeCheck({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-foreground",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      )}
    >
      <input
        type="checkbox"
        className="h-3.5 w-3.5 rounded-none border-foreground/70 text-primary accent-primary focus:ring-primary/30"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      {label}
    </label>
  );
}
