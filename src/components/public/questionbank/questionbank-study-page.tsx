"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  Expand,
  ExternalLink,
  Home,
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

const LETTERS = ["A", "B", "C", "D"] as const;

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
}: {
  question: QbQuestion;
  index: number;
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
            <button type="button" className="rounded-lg border border-border p-2 text-muted-foreground hover:text-primary">
              <Bookmark className="h-4 w-4" />
            </button>
            <button type="button" className="rounded-lg border border-border p-2 text-muted-foreground hover:text-accent-green">
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
  const [filters, setFilters] = useState<QbFilters>({});
  const { data, isLoading, error, isFetching } = useQbQuestions(programSlug, subtopicSlug, filters);

  const program = data?.subtopic.topic.program;
  const topic = data?.subtopic.topic;

  const stickyChoices = useMemo(() => LETTERS, []);

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

  return (
    <div className="bg-background pb-16">
      <div className="border-b border-border bg-gradient-to-b from-primary-muted/70 to-background">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Link href={ROUTES.home} className="hover:text-primary">
              <Home className="h-4 w-4" />
            </Link>
            <span>/</span>
            <span>{program?.subject.category.name}</span>
            <span>/</span>
            <span>{program?.subject.name}</span>
            <span>/</span>
            <Link href={ROUTES.subjectQuestionbank(programSlug)} className="hover:text-primary">
              Questionbank
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">{data.subtopic.title}</span>
          </nav>
          <p className="text-sm font-semibold text-primary">{program?.name} · Questionbank</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">
            {data.subtopic.title}
            {topic ? ` — ${topic.title}` : ""}
          </h1>
          {data.subtopic.description ? (
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{data.subtopic.description}</p>
          ) : null}
        </div>
      </div>

      <div className="sticky top-16 z-30 border-b border-border bg-primary-muted/80 backdrop-blur lg:top-[4.5rem]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            Filters
            <ChevronDown className={cn("h-4 w-4 transition", filtersOpen && "rotate-180")} />
          </button>

          {filtersOpen ? (
            <>
              <FilterGroup label="Difficulty">
                {(["EASY", "MEDIUM", "HARD"] as QbDifficulty[]).map((d) => (
                  <CheckChip
                    key={d}
                    label={d.charAt(0) + d.slice(1).toLowerCase()}
                    checked={filters.difficulty?.includes(d) ?? false}
                    onChange={() =>
                      setFilters((f) => ({ ...f, difficulty: toggleFilter(f.difficulty, d) }))
                    }
                  />
                ))}
              </FilterGroup>
              <FilterGroup label="Paper">
                {(["PAPER_1", "PAPER_2"] as QbPaper[]).map((p) => (
                  <CheckChip
                    key={p}
                    label={p.replace("_", " ")}
                    checked={filters.paper?.includes(p) ?? false}
                    onChange={() => setFilters((f) => ({ ...f, paper: toggleFilter(f.paper, p) }))}
                  />
                ))}
              </FilterGroup>
              <FilterGroup label="Type">
                {(["MULTIPLE_CHOICE", "SHORT_ANSWER", "DATA_BASED"] as QbQuestionType[]).map((t) => (
                  <CheckChip
                    key={t}
                    label={t.replaceAll("_", " ").toLowerCase()}
                    checked={filters.type?.includes(t) ?? false}
                    onChange={() => setFilters((f) => ({ ...f, type: toggleFilter(f.type, t) }))}
                  />
                ))}
              </FilterGroup>
            </>
          ) : null}

          <span className="ml-auto text-xs text-muted-foreground">
            {isFetching ? "Updating…" : `${data.questions.length} questions`}
          </span>
        </div>
      </div>

      <div className="sticky top-[7.5rem] z-20 hidden border-b border-border bg-card/95 px-4 py-2 backdrop-blur md:block lg:top-[8.25rem]">
        <div className="mx-auto flex max-w-7xl items-center gap-3 md:px-2">
          <span className="text-sm font-medium text-muted-foreground">Choose an answer</span>
          <div className="flex gap-2">
            {stickyChoices.map((letter) => (
              <span
                key={letter}
                className="inline-flex h-9 w-12 items-center justify-center rounded-lg border border-border bg-muted/40 text-sm font-bold"
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-6">
        {data.questions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
            No questions match these filters.
          </p>
        ) : (
          data.questions.map((question, index) => (
            <QuestionCard key={question.id} question={question} index={index} />
          ))
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function CheckChip({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary/40"
      )}
    >
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}
