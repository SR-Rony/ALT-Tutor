"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, PlayCircle, XCircle } from "lucide-react";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { isRichTextEmpty } from "@/lib/rich-text";
import { cn } from "@/utils";
import {
  STUDY_QUESTION_LETTERS,
  VideoEmbed,
  resolveStudyQuestionMcq,
} from "./study-question-helpers";

export type ResultReviewQuestionData = {
  id: string;
  number?: number | null;
  prompt: string;
  body?: string | null;
  diagramUrl?: string | null;
  paper?: string | null;
  questionType?: string | null;
  options: string[];
  marks?: number | null;
  correctAnswer?: string | null;
  markScheme?: string | null;
  videoUrl?: string | null;
  studentAnswer?: string | null;
  isCorrect?: boolean | null;
};

type Props = {
  question: ResultReviewQuestionData;
  index: number;
  /** Written papers are marked by an admin, so there is no per-question right/wrong. */
  written?: boolean;
};

export function ResultReviewQuestion({ question, index, written = false }: Props) {
  const [showVideo, setShowVideo] = useState(false);

  const label = `Q${question.number || index + 1}`;
  const isMcq = !written && resolveStudyQuestionMcq(question);
  const selected = question.studentAnswer?.trim().toUpperCase() || null;
  const correct = question.correctAnswer?.trim().toUpperCase() || null;
  const filledOptions = question.options
    .map((opt, i) => ({ opt, letter: STUDY_QUESTION_LETTERS[i] ?? String(i + 1) }))
    .filter(({ opt }) => !isRichTextEmpty(opt));
  const marks = question.marks ?? 1;
  const hasMarkScheme = !isRichTextEmpty(question.markScheme);
  const videoUrl = question.videoUrl?.trim() || null;

  return (
    <article className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-primary-muted px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
          {label}
        </span>
        {isMcq ? (
          question.isCorrect === true ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-green)]">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Correct
            </span>
          ) : question.isCorrect === false ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
              <XCircle className="h-3.5 w-3.5" aria-hidden /> Incorrect
            </span>
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">Unanswered</span>
          )
        ) : null}
        <span className="text-xs font-semibold text-muted-foreground">
          {marks} mark{marks === 1 ? "" : "s"}
        </span>
      </div>

      <RichTextContent
        html={question.prompt}
        className="w-full max-w-none text-[15px] leading-relaxed text-foreground"
      />
      {question.body ? (
        <RichTextContent
          html={question.body}
          className="mt-2 w-full max-w-none text-[15px] leading-relaxed text-foreground"
        />
      ) : null}

      {question.diagramUrl ? (
        <div className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.diagramUrl}
            alt={`Diagram for ${label}`}
            loading="lazy"
            className="mx-auto max-h-[28rem] w-auto max-w-full object-contain"
          />
        </div>
      ) : null}

      {isMcq && filledOptions.length >= 2 ? (
        <ul className="mt-4 space-y-1.5 text-[15px]">
          {filledOptions.map(({ opt, letter }) => {
            const isAnswer = correct === letter;
            const isWrongPick = selected === letter && !isAnswer;
            return (
              <li
                key={`${question.id}-${letter}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-transparent px-3 py-1.5 text-foreground",
                  isAnswer && "border-[var(--accent-green)]/30 bg-[#ecfdf3]",
                  isWrongPick && "border-accent/30 bg-accent/10"
                )}
              >
                <span
                  className={cn(
                    "w-5 shrink-0 font-semibold",
                    isAnswer && "text-[var(--accent-green)]",
                    isWrongPick && "text-accent"
                  )}
                >
                  {letter}.
                </span>
                <RichTextContent html={opt} inline className="min-w-0 flex-1" />
                {isAnswer ? (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-[var(--accent-green)]"
                    aria-label="Correct answer"
                  />
                ) : isWrongPick ? (
                  <XCircle className="h-4 w-4 shrink-0 text-accent" aria-label="Your answer" />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {isMcq ? (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span
            className={cn(
              "rounded-lg border px-3 py-1 font-medium",
              !selected
                ? "border-border bg-muted/40 text-muted-foreground"
                : question.isCorrect
                  ? "border-[var(--accent-green)]/30 bg-[#ecfdf3] text-[var(--accent-green)]"
                  : "border-accent/30 bg-accent/10 text-accent"
            )}
          >
            Your answer: <strong>{selected ?? "Not answered"}</strong>
          </span>
          {correct ? (
            <span className="rounded-lg border border-[var(--accent-green)]/30 bg-[#ecfdf3] px-3 py-1 font-medium text-[var(--accent-green)]">
              Correct answer: <strong>{correct}</strong>
            </span>
          ) : null}
        </div>
      ) : null}

      {hasMarkScheme ? (
        <div className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-foreground">Mark scheme</p>
          <RichTextContent
            html={question.markScheme}
            className="mt-2 w-full max-w-none text-sm leading-relaxed text-foreground"
          />
        </div>
      ) : null}

      {videoUrl ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowVideo((v) => !v)}
            aria-expanded={showVideo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-muted"
          >
            <PlayCircle className="h-4 w-4" aria-hidden />
            {showVideo ? "Hide video solution" : "Watch video solution"}
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", showVideo && "rotate-180")}
              aria-hidden
            />
          </button>
          {showVideo ? (
            <div className="mt-3">
              <VideoEmbed url={videoUrl} />
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
