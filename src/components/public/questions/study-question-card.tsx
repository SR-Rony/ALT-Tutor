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
import { isRichTextEmpty, richTextToPlain } from "@/lib/rich-text";
import { cn } from "@/utils";
import {
  DifficultyDots,
  STUDY_QUESTION_LETTERS,
  VideoEmbed,
  mcqAnswerLetters,
  paperDisplayLabel,
  resolveStudyQuestionMcq,
} from "./study-question-helpers";

export type StudyQuestionView = {
  id: string;
  displayNumber: number;
  prompt: string;
  body?: string | null;
  diagramUrl?: string | null;
  difficulty?: string | null;
  paper?: string | null;
  /** Custom paper name from study-set config (e.g. Paper-11). */
  paperLabel?: string | null;
  calculatorAllowed?: boolean | null;
  marks?: number | null;
  options: string[];
  markScheme?: string | null;
  videoUrl?: string | null;
  correctAnswer?: string | null;
  isCorrect?: boolean | null;
  paperMarkSchemeUrl?: string | null;
  questionType?: string | null;
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
  /** Formula Booklet link is hidden for now; kept so callers don't need to change. */
  formulaBookletHref?: string;
  /** DOM id prefix, e.g. "q", "pe-q", "pp-q" */
  idPrefix?: string;
  /** data-* attribute name without "data-", e.g. "pe-q" → data-pe-q */
  dataAttr?: string;
};

const SIDE_ACTION_CLASS =
  "flex h-9 min-w-[8.5rem] flex-1 basis-0 items-center gap-2 whitespace-nowrap rounded-md bg-primary-muted/70 px-3 text-sm font-medium text-primary transition hover:bg-primary-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary-muted/70 lg:w-full lg:flex-none";

const SIDE_LINK_CLASS =
  "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-primary";

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
  idPrefix = "q",
  dataAttr,
}: StudyQuestionCardProps) {
  const [modal, setModal] = useState<"scheme" | "video" | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(false);
  const isCompleted = completed ?? localCompleted;
  const toggleComplete =
    onToggleComplete ?? (() => setLocalCompleted((v) => !v));

  const qLabel = `Question ${question.displayNumber}`;
  const isMcq = resolveStudyQuestionMcq(question);
  const filledOptions = question.options
    .map((opt, index) => ({ opt, index }))
    .filter(({ opt }) => !isRichTextEmpty(opt));
  const hasOptionList = filledOptions.length >= 2;
  const selected = selectedAnswer ?? null;
  const answered = selected !== null;
  const correctAnswer = (question.correctAnswer ?? "").toUpperCase();
  const correct = question.isCorrect === true;
  const markScheme = question.markScheme;
  const videoUrl = question.videoUrl;
  const hasScheme = Boolean(markScheme) || Boolean(question.paperMarkSchemeUrl);
  const letters = mcqAnswerLetters(question.options.length, isMcq);

  const maxMarkMatch =
    contentMode === "rich"
      ? richTextToPlain(question.body ?? "").match(/\[Maximum mark:\s*(\d+)\]/i)
      : String(question.body ?? "").match(/\[Maximum mark:\s*(\d+)\]/i);
  const maxMarks = question.marks ?? (maxMarkMatch ? Number(maxMarkMatch[1]) : null);
  const hasAnswerBar = isMcq && Boolean(onSelectAnswer);
  const badgeClass =
    "rounded bg-primary-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary";

  const questionContent = (
    <>
      {!isMcq && maxMarks != null && maxMarks > 0 ? (
        <p className="mb-3 text-base text-foreground">[Maximum mark: {maxMarks}]</p>
      ) : null}

      <ContentBlock
        htmlOrText={question.prompt}
        contentMode={contentMode}
        className="w-full max-w-none text-base leading-relaxed text-foreground"
      />
      {question.body ? (
        <ContentBlock
          htmlOrText={question.body}
          contentMode={contentMode}
          className="mt-2 w-full max-w-none text-base leading-relaxed text-foreground"
        />
      ) : null}

      {question.diagramUrl ? (
        <div className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={question.diagramUrl}
            alt={`Diagram for ${qLabel}`}
            className="mx-auto max-h-[28rem] w-auto max-w-full object-contain"
          />
        </div>
      ) : null}

      {isMcq && hasOptionList ? (
        <ul className="mt-6 space-y-3.5 pl-1 text-base text-foreground sm:pl-4">
          {filledOptions.map(({ opt, index }) => (
            <li key={`${question.id}-opt-${index}`} className="flex items-center gap-x-4 sm:gap-x-5">
              <span className="w-5 shrink-0 self-center text-base leading-none">
                {STUDY_QUESTION_LETTERS[index] ?? index + 1}.
              </span>
              {contentMode === "rich" ? (
                <RichTextContent html={opt} inline className="min-w-0 flex-1 text-base" />
              ) : (
                <span className="min-w-0 text-base leading-relaxed">{opt}</span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );

  return (
    <section
      id={`${idPrefix}-${question.id}`}
      className="scroll-mt-28"
      data-q-num={question.displayNumber}
      data-pe-q={dataAttr === "pe-q" ? true : undefined}
      data-pp-q={dataAttr === "pp-q" ? true : undefined}
    >
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">{qLabel}</h2>
        <div className="flex items-center gap-1.5 text-muted-foreground">
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
              <ThumbsUp className="h-3.5 w-3.5" />
              <ThumbsDown className="h-3.5 w-3.5" />
            </>
          )}
        </div>
      </div>

      {/* Text column = 1232px (max-w-7xl − px-6) − 2px border − 13rem aside − 2×24px padding = 974px.
          The admin question editor is sized to the same width; keep them in sync. */}
      <div className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-xl border border-border/70 bg-card shadow-[0_8px_30px_-14px_rgba(15,23,42,0.16)] lg:grid-cols-[minmax(0,1fr)_13rem]">
        <article className="flex min-w-0 flex-col">
          <header className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-border/70 px-4 py-2.5 sm:px-6">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {question.calculatorAllowed === true ? (
                <span className={badgeClass}>Calculator</span>
              ) : question.calculatorAllowed === false ? (
                <span className={badgeClass}>No calculator</span>
              ) : null}
              {question.paper ? (
                <span className={cn(badgeClass, "bg-muted text-muted-foreground")}>
                  {question.paperLabel?.trim() || paperDisplayLabel(question.paper)}
                  {isMcq ? " · MCQ" : ""}
                </span>
              ) : isMcq ? (
                <span className={cn(badgeClass, "bg-muted text-muted-foreground")}>MCQ</span>
              ) : null}
              {isMcq && question.marks != null && question.marks > 0 ? (
                <span className={cn(badgeClass, "bg-muted text-foreground")}>[{question.marks}]</span>
              ) : null}
            </div>
            <div className="justify-self-center">
              {question.difficulty ? (
                <DifficultyDots difficulty={String(question.difficulty)} size="sm" />
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="justify-self-end rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-primary"
              aria-label={`Expand ${qLabel}`}
            >
              <Expand className="h-4 w-4" />
            </button>
          </header>

          <div className="qb-question-font flex-1 px-4 py-5 sm:px-6 sm:py-6">{questionContent}</div>

          {hasAnswerBar ? (
            <div className="flex flex-col gap-3 border-t border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-6">
              <p className="shrink-0 text-sm text-muted-foreground">Choose an answer</p>
              <div
                className="grid min-w-0 flex-1 gap-2 sm:gap-3"
                style={{ gridTemplateColumns: `repeat(${letters.length}, minmax(0, 1fr))` }}
              >
                {letters.map((letter) => {
                  const isSelected = selected === letter;
                  const isCorrectChoice = correctAnswer ? letter === correctAnswer : false;
                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={saving || answerDisabled || (examMode && solutionsUnlocked)}
                      onClick={() => onSelectAnswer?.(letter)}
                      className={cn(
                        "relative flex h-11 items-center justify-center rounded-lg border text-sm font-semibold transition disabled:cursor-not-allowed",
                        !answered &&
                          "border-border bg-card text-foreground hover:border-primary hover:bg-primary-muted/60 hover:text-primary",
                        answered && "border-border bg-card text-foreground",
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

          {footer ? (
            <div className="border-t border-border/70 px-4 py-4 sm:px-6">{footer}</div>
          ) : null}
        </article>

        <aside className="flex min-w-0 flex-wrap items-center gap-2 border-t border-border/70 px-4 py-3 lg:flex-col lg:flex-nowrap lg:items-stretch lg:border-l lg:border-t-0 lg:px-3 lg:pb-4 lg:pt-1.5">
          <div className="order-3 flex items-center divide-x divide-border lg:order-none lg:justify-center lg:pb-1">
            <button
              type="button"
              className="px-4 py-1.5 text-muted-foreground transition hover:text-primary"
              aria-label="Bookmark"
            >
              <Bookmark className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={toggleComplete}
              className={cn(
                "px-4 py-1.5 transition",
                isCompleted ? "text-accent-green" : "text-muted-foreground hover:text-accent-green"
              )}
              aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
              aria-pressed={isCompleted}
            >
              {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="button"
            className={SIDE_ACTION_CLASS}
            onClick={() => setModal("scheme")}
            disabled={!hasScheme || !solutionsUnlocked}
          >
            <FileText className="h-4 w-4 shrink-0" />
            Mark Scheme
          </button>
          <button
            type="button"
            className={SIDE_ACTION_CLASS}
            onClick={() => setModal("video")}
            disabled={!videoUrl || !solutionsUnlocked}
          >
            <PlayCircle className="h-4 w-4 shrink-0" />
            Video Solutions
            {videoUrl ? (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-card px-1 text-[11px] font-semibold text-primary">
                1
              </span>
            ) : null}
          </button>

          {question.paperMarkSchemeUrl ? (
            <div className="order-4 ml-auto flex flex-wrap gap-x-1 lg:order-none lg:ml-0 lg:mt-auto lg:flex-col lg:pt-4">
              <a
                href={question.paperMarkSchemeUrl}
                target="_blank"
                rel="noreferrer"
                className={SIDE_LINK_CLASS}
              >
                Mark scheme file <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </div>
          ) : null}
          {examMode && !solutionsUnlocked ? (
            <p className="order-5 w-full px-3 text-xs font-medium text-muted-foreground lg:order-none">
              Locked until exam submission
            </p>
          ) : null}
        </aside>
      </div>

      <AdminModal
        open={expanded}
        title={qLabel}
        onClose={() => setExpanded(false)}
        className="sm:max-w-5xl"
      >
        <div className="qb-question-font">{questionContent}</div>
      </AdminModal>

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
            <div className="rounded-xl border border-border bg-muted/20 p-4 text-base leading-relaxed text-foreground">
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
