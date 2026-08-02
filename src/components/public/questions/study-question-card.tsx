"use client";

import { useState, type ReactNode } from "react";
import {
  Bookmark,
  Check,
  CheckCircle2,
  Expand,
  ExternalLink,
  FileText,
  PlayCircle,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { Button } from "@/components/ui/button";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { richTextToPlain } from "@/lib/rich-text";
import { cn } from "@/utils";
import {
  DifficultyDots,
  STUDY_QUESTION_LETTERS,
  VideoEmbed,
  paperDisplayLabel,
} from "./study-question-helpers";

export type StudyQuestionView = {
  id: string;
  displayNumber: number;
  prompt: string;
  body?: string | null;
  diagramUrl?: string | null;
  difficulty?: string | null;
  paper?: string | null;
  calculatorAllowed?: boolean | null;
  marks?: number | null;
  options: string[];
  markScheme?: string | null;
  videoUrl?: string | null;
  correctAnswer?: string | null;
  isCorrect?: boolean | null;
  paperMarkSchemeUrl?: string | null;
};

export type StudyQuestionCardProps = {
  question: StudyQuestionView;
  contentMode?: "rich" | "plain";
  solutionsUnlocked?: boolean;
  examMode?: boolean;
  selectedAnswer?: string | null;
  onSelectAnswer?: (letter: string) => void;
  saving?: boolean;
  answerDisabled?: boolean;
  completed?: boolean;
  onToggleComplete?: () => void;
  footer?: ReactNode;
  formulaBookletHref?: string;
  /** DOM id prefix, e.g. "q", "pe-q", "pp-q" */
  idPrefix?: string;
  /** data-* attribute name without "data-", e.g. "pe-q" → data-pe-q */
  dataAttr?: string;
};

function ContentBlock({
  htmlOrText,
  contentMode,
  className,
}: {
  htmlOrText: string;
  contentMode: "rich" | "plain";
  className?: string;
}) {
  if (contentMode === "rich") {
    return <RichTextContent html={htmlOrText} className={className} />;
  }
  return <p className={cn("whitespace-pre-wrap", className)}>{htmlOrText}</p>;
}

export function StudyQuestionCard({
  question,
  contentMode = "rich",
  solutionsUnlocked = true,
  examMode = false,
  selectedAnswer,
  onSelectAnswer,
  saving = false,
  answerDisabled = false,
  completed,
  onToggleComplete,
  footer,
  formulaBookletHref = "#",
  idPrefix = "q",
  dataAttr,
}: StudyQuestionCardProps) {
  const [modal, setModal] = useState<"scheme" | "video" | null>(null);
  const [localCompleted, setLocalCompleted] = useState(false);
  const isCompleted = completed ?? localCompleted;
  const toggleComplete =
    onToggleComplete ?? (() => setLocalCompleted((v) => !v));

  const qLabel = `Question ${question.displayNumber}`;
  const isMcq = question.options.length >= 2;
  const selected = selectedAnswer ?? null;
  const answered = selected !== null;
  const correctAnswer = (question.correctAnswer ?? "").toUpperCase();
  const correct = question.isCorrect === true;
  const markScheme = question.markScheme;
  const videoUrl = question.videoUrl;
  const hasScheme = Boolean(markScheme) || Boolean(question.paperMarkSchemeUrl);
  const letters = STUDY_QUESTION_LETTERS.slice(0, question.options.length);

  const maxMarkMatch =
    contentMode === "rich"
      ? richTextToPlain(question.body ?? "").match(/\[Maximum mark:\s*(\d+)\]/i)
      : String(question.body ?? "").match(/\[Maximum mark:\s*(\d+)\]/i);
  const maxMarks = question.marks ?? (maxMarkMatch ? Number(maxMarkMatch[1]) : null);

  return (
    <section
      id={`${idPrefix}-${question.id}`}
      className="scroll-mt-28"
      data-q-num={question.displayNumber}
      data-pe-q={dataAttr === "pe-q" ? true : undefined}
      data-pp-q={dataAttr === "pp-q" ? true : undefined}
    >
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_10rem]">
        <article className="rounded-2xl border border-border bg-card p-4 shadow-[0_8px_28px_-16px_rgba(24,119,242,0.2)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {question.calculatorAllowed === true ? (
                <span className="rounded-md bg-primary-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                  Calculator
                </span>
              ) : question.calculatorAllowed === false ? (
                <span className="rounded-md bg-primary-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                  No calculator
                </span>
              ) : null}
              {question.difficulty ? (
                <DifficultyDots difficulty={String(question.difficulty)} />
              ) : null}
              {question.paper || isMcq ? (
                <span className="rounded-md border border-primary/15 bg-primary-muted/40 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                  {paperDisplayLabel(question.paper)}
                  {isMcq ? " · MCQ" : ""}
                </span>
              ) : null}
              {isMcq && question.marks != null && question.marks > 0 ? (
                <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-bold uppercase text-foreground">
                  [{question.marks}]
                </span>
              ) : null}
            </div>
            <Expand className="h-4 w-4 text-muted-foreground" />
          </div>

          {!isMcq && maxMarks != null && maxMarks > 0 ? (
            <p className="mb-3 text-sm font-semibold text-foreground">
              [Maximum mark: {maxMarks}]
            </p>
          ) : null}

          <ContentBlock
            htmlOrText={question.prompt}
            contentMode={contentMode}
            className="text-sm leading-relaxed text-foreground md:text-base"
          />
          {question.body ? (
            <ContentBlock
              htmlOrText={question.body}
              contentMode={contentMode}
              className={cn(
                "mt-2 text-sm",
                isMcq ? "text-muted-foreground" : "leading-relaxed text-foreground md:text-[15px]"
              )}
            />
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
            <>
              <ul className="mt-4 space-y-3 text-sm text-foreground">
                {question.options.map((opt, i) => (
                  <li key={`${question.id}-opt-${i}`} className="flex gap-2">
                    <span className="shrink-0 font-semibold">
                      {STUDY_QUESTION_LETTERS[i] ?? i + 1}.
                    </span>
                    {contentMode === "rich" ? (
                      <RichTextContent html={opt} className="min-w-0 flex-1" />
                    ) : (
                      <span className="min-w-0 flex-1">{opt}</span>
                    )}
                  </li>
                ))}
              </ul>

              {onSelectAnswer ? (
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
                          disabled={saving || answerDisabled || (examMode && solutionsUnlocked)}
                          onClick={() => onSelectAnswer(letter)}
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
            </>
          ) : null}

          {footer ? <div className="mt-4">{footer}</div> : null}
        </article>

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
              onClick={toggleComplete}
              className={cn(
                "rounded-lg border p-2 transition",
                isCompleted
                  ? "border-accent-green bg-[#ecfdf3] text-accent-green"
                  : "border-border text-muted-foreground hover:text-accent-green"
              )}
              aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            className="justify-start border-primary/40 text-primary hover:bg-primary-muted hover:text-primary"
            onClick={() => setModal("scheme")}
            disabled={!hasScheme || !solutionsUnlocked}
          >
            <FileText className="mr-1.5 h-4 w-4" />
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
          {question.paperMarkSchemeUrl ? (
            <a
              href={question.paperMarkSchemeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-1 text-sm text-muted-foreground hover:text-primary"
            >
              Mark scheme file <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <a
              href={formulaBookletHref}
              className="inline-flex items-center gap-1 px-1 text-sm text-muted-foreground hover:text-primary"
            >
              Formula Booklet <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            {question.paperMarkSchemeUrl ? (
              <a
                href={question.paperMarkSchemeUrl}
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
              {contentMode === "rich" ? (
                <RichTextContent html={markScheme} />
              ) : (
                <p className="whitespace-pre-wrap">{markScheme}</p>
              )}
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
