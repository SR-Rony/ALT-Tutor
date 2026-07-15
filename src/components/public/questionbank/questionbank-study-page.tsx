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
  Home,
  ListOrdered,
  SlidersHorizontal,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared";
import { ROUTES } from "@/constants";
import { useQbQuestions } from "@/hooks/use-questionbank";
import type { ApiError } from "@/types";
import type { QbDifficulty, QbFilters, QbPaper, QbQuestion, QbQuestionType } from "@/types/qb.types";
import { cn } from "@/utils";

type Props = { programSlug: string; subtopicSlug: string };
type ViewMode = "ALL" | "COMPLETE" | "INCOMPLETE";

const LETTERS = ["A", "B", "C", "D"] as const;

const TYPE_OPTIONS: { value: QbQuestionType; label: string }[] = [
  { value: "DATA_BASED", label: "Data-based Questions" },
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice Questions" },
  { value: "SHORT_ANSWER", label: "Short Answer Questions" },
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

function QuestionCard({
  question,
  index,
  completed,
  onToggleComplete,
}: {
  question: QbQuestion;
  index: number;
  completed?: boolean;
  onToggleComplete?: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showScheme, setShowScheme] = useState(false);
  const answered = selected !== null;
  const correct = selected?.toUpperCase() === question.correctAnswer.toUpperCase();

  return (
    <section id={`q-${question.number}`} className="scroll-mt-28">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">Question {question.number || index + 1}</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          <ThumbsUp className="h-4 w-4" />
          <ThumbsDown className="h-4 w-4" />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_10rem]">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_28px_-16px_rgba(24,119,242,0.2)]">
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

          <ul className="mt-4 space-y-1.5 text-sm text-foreground">
            {question.options.map((opt, i) => (
              <li key={opt}>
                <span className="font-semibold">{LETTERS[i] ?? i + 1}.</span> {opt}
              </li>
            ))}
          </ul>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Choose an answer
            </p>
            <div className="grid grid-cols-4 gap-2">
              {LETTERS.slice(0, question.options.length).map((letter) => {
                const isSelected = selected === letter;
                const isCorrectChoice = letter === question.correctAnswer.toUpperCase();
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => setSelected(letter)}
                    className={cn(
                      "relative flex h-12 items-center justify-center rounded-xl border text-sm font-bold transition",
                      !answered && "border-border bg-muted/40 hover:border-primary hover:bg-primary-muted",
                      answered && isCorrectChoice && "border-accent-green bg-[#ecfdf3] text-accent-green",
                      answered && isSelected && !correct && "border-accent bg-accent/10 text-accent",
                      answered && !isSelected && !isCorrectChoice && "opacity-50"
                    )}
                  >
                    {letter}
                    {answered && isCorrectChoice ? (
                      <CheckCircle2 className="absolute right-2 h-4 w-4" />
                    ) : null}
                    {answered && isSelected && !correct ? (
                      <XCircle className="absolute right-2 h-4 w-4" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {showScheme && question.markScheme ? (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary-muted/40 p-4 text-sm text-foreground">
              <p className="mb-1 font-semibold text-primary">Mark scheme</p>
              {question.markScheme}
            </div>
          ) : null}
        </article>

        <aside className="flex flex-row gap-2 lg:flex-col">
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
            className={cn("justify-start", showScheme && "border-primary bg-primary-muted text-primary")}
            onClick={() => setShowScheme((v) => !v)}
          >
            Mark Scheme
          </Button>
          <Button type="button" variant="outline" className="justify-start">
            Video Solutions
            {question.videoUrl ? (
              <span className="ml-auto rounded-full bg-primary px-1.5 text-[10px] text-white">1</span>
            ) : null}
          </Button>
          <a
            href="#"
            className="inline-flex items-center gap-1 px-1 text-sm text-muted-foreground hover:text-primary"
          >
            Formula Booklet <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </aside>
      </div>
    </section>
  );
}

export function QuestionbankStudyPage({ programSlug, subtopicSlug }: Props) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [typeOpen, setTypeOpen] = useState(false);
  const [filters, setFilters] = useState<QbFilters>({});
  const [viewMode, setViewMode] = useState<ViewMode>("ALL");
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const typeRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, error, isFetching } = useQbQuestions(programSlug, subtopicSlug, filters);

  const program = data?.subtopic.topic.program;
  const topic = data?.subtopic.topic;

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

  return (
    <div className="bg-background pb-16">
      {/* Hero — light primary wash */}
      <div className="bg-primary-muted/80">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Link
              href={ROUTES.home}
              className="inline-flex items-center rounded-full bg-card/80 px-2 py-1 hover:text-primary"
            >
              <Home className="h-3.5 w-3.5" />
            </Link>
            <span className="text-border">/</span>
            <span className="rounded-full bg-card/80 px-2.5 py-1">{program?.subject.category.name}</span>
            <span className="text-border">/</span>
            <span className="rounded-full bg-card/80 px-2.5 py-1">{program?.subject.name}</span>
            <span className="text-border">/</span>
            <Link
              href={ROUTES.subjectQuestionbank(programSlug)}
              className="rounded-full bg-card/80 px-2.5 py-1 hover:text-primary"
            >
              Questionbank
            </Link>
            <span className="text-border">/</span>
            <span className="rounded-full bg-card px-2.5 py-1 font-medium text-foreground">
              {data.subtopic.title}
            </span>
          </nav>
          <h1 className="max-w-3xl text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl">
            {program?.name} - Questionbank
            <span className="mt-1 block text-xl font-bold md:text-2xl lg:text-3xl">
              {data.subtopic.title}
              {topic ? ` - ${topic.title}` : ""}
            </span>
          </h1>
          {data.subtopic.description ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {data.subtopic.description}
            </p>
          ) : null}
        </div>
      </div>

      {/* Seamless filter seam — white bar bridging hero → content */}
      <div className="sticky top-16 z-30 border-y border-border/60 bg-card shadow-[0_1px_0_rgba(24,119,242,0.06)] lg:top-[4.5rem]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3 md:px-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/30 hover:bg-primary-muted/50"
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

          {filtersOpen ? (
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
              <div ref={typeRef} className="relative">
                <span className="sr-only">Question Type</span>
                <button
                  type="button"
                  className="inline-flex min-w-[6.5rem] items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/30"
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

              <FilterDivider />

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

              <FilterDivider />

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

              <FilterDivider />

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
          ) : (
            <span className="flex-1 text-sm text-muted-foreground">
              {isFetching
                ? "Updating…"
                : `${visibleQuestions.length} of ${data.questions.length} questions`}
            </span>
          )}

          <button
            type="button"
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            onClick={goToQuestion}
          >
            <ListOrdered className="h-4 w-4" aria-hidden />
            Go to Question
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-6">
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
            />
          ))
        )}
      </div>
    </div>
  );
}

function FilterDivider() {
  return <span aria-hidden className="hidden h-6 w-px shrink-0 bg-border sm:block" />;
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
