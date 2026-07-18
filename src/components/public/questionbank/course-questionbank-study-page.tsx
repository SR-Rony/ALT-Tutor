"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Home,
  Lightbulb,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared";
import { ROUTES } from "@/constants";
import { getQuestionbankStudySet } from "@/data/mock/questionbank.mock";
import { useCourseDetail } from "@/hooks";
import type { QuestionbankStudyQuestion } from "@/types/questionbank.types";
import { cn } from "@/utils";

type Props = { slug: string; subtopicId: string };

const LETTERS = ["A", "B", "C", "D"] as const;

function difficultyMeta(d: QuestionbankStudyQuestion["difficulty"]) {
  if (d === "hard") return { label: "Hard", text: "text-accent", dot: "bg-accent", filled: 3 };
  if (d === "medium")
    return { label: "Medium", text: "text-[#f59e0b]", dot: "bg-[#f59e0b]", filled: 2 };
  return { label: "Easy", text: "text-accent-green", dot: "bg-accent-green", filled: 1 };
}

function DifficultyDots({ difficulty }: { difficulty: QuestionbankStudyQuestion["difficulty"] }) {
  const meta = difficultyMeta(difficulty);
  return (
    <span className={cn("inline-flex items-center gap-2 text-xs font-semibold", meta.text)}>
      {meta.label}
      <span className="inline-flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <span
            key={i}
            className={cn("h-1.5 w-1.5 rounded-full", i < meta.filled ? meta.dot : "bg-border")}
          />
        ))}
      </span>
    </span>
  );
}

function QuestionCard({
  question,
  selected,
  onSelect,
}: {
  question: QuestionbankStudyQuestion;
  selected: number | null;
  onSelect: (index: number) => void;
}) {
  const [showExplanation, setShowExplanation] = useState(false);
  const answered = selected !== null;
  const isCorrect = answered && selected === question.correctIndex;

  return (
    <article className="rounded-2xl border border-border bg-card shadow-[0_8px_24px_-16px_rgba(24,119,242,0.2)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-muted text-sm font-bold text-primary">
            {question.number}
          </span>
          <DifficultyDots difficulty={question.difficulty} />
        </div>
        {answered ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold",
              isCorrect ? "bg-accent-green/10 text-accent-green" : "bg-accent/10 text-accent"
            )}
          >
            {isCorrect ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Correct
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" aria-hidden /> Incorrect
              </>
            )}
          </span>
        ) : null}
      </div>

      <div className="px-5 py-5">
        <p className="text-base font-medium leading-relaxed text-foreground">{question.prompt}</p>

        <div className="mt-4 space-y-2.5">
          {question.options.map((option, index) => {
            const isPicked = selected === index;
            const isAnswer = index === question.correctIndex;
            return (
              <button
                key={index}
                type="button"
                disabled={answered}
                onClick={() => onSelect(index)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                  !answered && "border-border bg-background hover:border-primary/50 hover:bg-primary-muted/40",
                  answered && isAnswer && "border-accent-green bg-accent-green/10",
                  answered && isPicked && !isAnswer && "border-accent bg-accent/10",
                  answered && !isPicked && !isAnswer && "border-border bg-background opacity-60"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold",
                    answered && isAnswer
                      ? "border-accent-green bg-accent-green text-white"
                      : answered && isPicked
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-card text-foreground"
                  )}
                >
                  {answered && isAnswer ? <Check className="h-3.5 w-3.5" aria-hidden /> : LETTERS[index]}
                </span>
                <span className="leading-relaxed text-foreground">{option}</span>
              </button>
            );
          })}
        </div>

        {answered ? (
          <div className="mt-4">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              onClick={() => setShowExplanation((v) => !v)}
            >
              <Lightbulb className="h-4 w-4" aria-hidden />
              {showExplanation ? "Hide explanation" : "Show explanation"}
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", showExplanation && "rotate-180")}
                aria-hidden
              />
            </button>
            {showExplanation ? (
              <p className="mt-3 rounded-xl bg-primary-muted/50 px-4 py-3 text-sm leading-relaxed text-foreground">
                {question.explanation}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function CourseQuestionbankStudyPage({ slug, subtopicId }: Props) {
  const { data: course, isLoading } = useCourseDetail(slug, true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [resetKey, setResetKey] = useState(0);

  const studySet = useMemo(
    () => getQuestionbankStudySet(slug, subtopicId, course?.title),
    [slug, subtopicId, course?.title]
  );

  if (isLoading && !course) {
    return <PageLoader label="Loading study set..." />;
  }

  if (!studySet) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-foreground">Study set not found</h1>
        <p className="mt-2 text-muted-foreground">
          This study set does not exist for this course.
        </p>
        <Button asChild size="pill" className="mt-6">
          <Link href={ROUTES.questionbank(slug)}>Back to Questionbank</Link>
        </Button>
      </div>
    );
  }

  const { bank, topic, subtopic, questions } = studySet;
  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter((q) => answers[q.id] === q.correctIndex).length;
  const allAnswered = answeredCount === questions.length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-gradient-to-b from-primary-muted/60 to-background">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
          >
            <Link href={ROUTES.home} className="inline-flex items-center hover:text-primary">
              <Home className="h-4 w-4" aria-hidden />
              <span className="sr-only">Home</span>
            </Link>
            <span aria-hidden>/</span>
            <Link href={ROUTES.courseDetail(slug)} className="hover:text-primary">
              {bank.courseTitle}
            </Link>
            <span aria-hidden>/</span>
            <Link href={ROUTES.questionbank(slug)} className="hover:text-primary">
              Questionbank
            </Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-foreground">{subtopic.title}</span>
          </nav>

          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Topic {topic.number} · {topic.title}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {subtopic.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {subtopic.description}
          </p>

          {/* Progress */}
          <div className="mt-6 max-w-md">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                {answeredCount}/{questions.length} answered
              </span>
              <span className="text-muted-foreground">
                {correctCount} correct
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 md:px-6">
        {questions.map((question) => (
          <QuestionCard
            key={`${question.id}-${resetKey}`}
            question={question}
            selected={answers[question.id] ?? null}
            onSelect={(index) =>
              setAnswers((prev) => ({ ...prev, [question.id]: index }))
            }
          />
        ))}

        {/* Summary */}
        {allAnswered ? (
          <div className="rounded-2xl border border-primary/20 bg-primary-muted/40 px-6 py-6 text-center">
            <h2 className="text-xl font-bold text-foreground">
              Study set complete
            </h2>
            <p className="mt-1 text-muted-foreground">
              You scored {correctCount} out of {questions.length}.
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button asChild variant="outline" size="pill">
            <Link href={ROUTES.questionbank(slug)}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to Questionbank
            </Link>
          </Button>
          <Button
            variant="outline"
            size="pill"
            onClick={() => {
              setAnswers({});
              setResetKey((k) => k + 1);
            }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Restart set
          </Button>
        </div>
      </div>
    </div>
  );
}
