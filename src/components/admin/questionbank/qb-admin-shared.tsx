"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ImageIcon,
  Pencil,
  Trash2,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { tierBadgeClass, tierLabel } from "@/lib/access-tier";
import { richTextExcerpt } from "@/lib/rich-text";
import type { QbDifficulty, QbPaper, QbQuestion, QbTopic } from "@/types/qb.types";
import { cn } from "@/utils";

export const DIFFICULTIES: QbDifficulty[] = ["EASY", "MEDIUM", "HARD"];
/** Default papers before a study set grows via Add paper. */
export const PAPERS: QbPaper[] = ["PAPER_1", "PAPER_2", "PAPER_3"];

export function parsePaperNumber(paper: string | null | undefined): number {
  const key = String(paper ?? "PAPER_1").toUpperCase();
  const match =
    key.match(/^PAPER_(\d+)$/) ||
    key.match(/^P(\d+)$/) ||
    key.match(/^(\d+)$/) ||
    key.match(/PAPER_?(\d+)/);
  const n = match ? Number.parseInt(match[1], 10) : 1;
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function paperKey(n: number): QbPaper {
  return `PAPER_${Math.max(1, Math.floor(n))}`;
}

export function papersUpTo(count: number): QbPaper[] {
  const n = Math.max(1, Math.floor(count));
  return Array.from({ length: n }, (_, i) => paperKey(i + 1));
}

export function resolvePaperTabs(
  paperCount: number | null | undefined,
  questions: QbQuestion[] | undefined
): QbPaper[] {
  const fromQuestions = (questions ?? []).reduce(
    (max, q) => Math.max(max, parsePaperNumber(String(q.paper))),
    0
  );
  // Respect stored paperCount (default 3 for new sets). Do not force a minimum of 3
  // or deleted papers (e.g. Paper 3) will keep reappearing in the UI.
  return papersUpTo(Math.max(1, paperCount ?? 3, fromQuestions));
}

export function AccessBadgePill({ badge }: { badge?: string | null }) {
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
        tierBadgeClass(badge)
      )}
    >
      {tierLabel(badge)}
    </span>
  );
}

export function paperShortLabel(paper: string) {
  const n = parsePaperNumber(paper);
  return `Paper ${n}`;
}

/** Paper 1 = MCQ only; Paper 2+ = Written only. */
export function isMcqPaper(paper: string | null | undefined) {
  return parsePaperNumber(paper) <= 1;
}

export function kindForPaper(paper: string | null | undefined): "MCQ" | "WRITTEN" {
  return isMcqPaper(paper) ? "MCQ" : "WRITTEN";
}

export function papersForKind(kind: "MCQ" | "WRITTEN", tabs: QbPaper[]): QbPaper[] {
  return tabs.filter((p) => (kind === "MCQ" ? isMcqPaper(p) : !isMcqPaper(p)));
}

export function countByPaper(questions: QbQuestion[] | undefined) {
  const counts: Record<string, number> = {};
  for (const q of questions ?? []) {
    const key = paperKey(parsePaperNumber(String(q.paper)));
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function questionsForPaper(questions: QbQuestion[] | undefined, paper: QbPaper) {
  const target = paperKey(parsePaperNumber(paper));
  return (questions ?? []).filter(
    (q) => paperKey(parsePaperNumber(String(q.paper))) === target
  );
}

const EXCEL_TEMPLATE_HEADERS = [
  "number",
  "prompt",
  "body",
  "diagramUrl",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "correctAnswer",
  "difficulty",
  "paper",
  "questionType",
  "marks",
  "yearHint",
  "sourceLabel",
  "markScheme",
  "videoUrl",
  "calculatorAllowed",
] as const;

const EXCEL_TEMPLATE_SAMPLE = [
  "1",
  "The diagram below shows a car of mass m descending a slope. The magnitude of the acceleration is given by",
  "Choose the correct acceleration.",
  "https://example.com/car-slope-diagram.png",
  "3.0 m s^-2",
  "6.0 m s^-2",
  "9.0 m s^-2",
  "81 m s^-2",
  "B",
  "EASY",
  "PAPER_1",
  "MULTIPLE_CHOICE",
  "1",
  "2023",
  "SSC-style 2023",
  "Correct answer B. Use s = ut + 1/2 at^2 with u=0.",
  "https://www.youtube.com/watch?v=example",
  "TRUE",
];

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function downloadExcelFile(filename: string, headers: string[], dataRows: string[][]) {
  const rows = [headers, ...dataRows];
  const sheetRows = rows
    .map(
      (row) =>
        `<Row>${row
          .map((value) => `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`)
          .join("")}</Row>`
    )
    .join("");
  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Questions"><Table>${sheetRows}</Table></Worksheet>
</Workbook>`;
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function questionToExcelRow(question: QbQuestion, serial: number): string[] {
  return [
    String(serial),
    question.prompt,
    question.body ?? "",
    question.diagramUrl ?? "",
    question.options[0] ?? "",
    question.options[1] ?? "",
    question.options[2] ?? "",
    question.options[3] ?? "",
    question.correctAnswer,
    String(question.difficulty),
    String(question.paper),
    String(question.questionType),
    String(question.marks ?? 1),
    question.yearHint != null ? String(question.yearHint) : "",
    question.sourceLabel ?? "",
    question.markScheme ?? "",
    question.videoUrl ?? "",
    question.calculatorAllowed ? "TRUE" : "FALSE",
  ];
}

function safeExcelFilename(value: string) {
  const safe = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return safe || "questionbank";
}

export function downloadExcelTemplate() {
  downloadExcelFile(
    "questionbank-import-template.xls",
    [...EXCEL_TEMPLATE_HEADERS],
    [[...EXCEL_TEMPLATE_SAMPLE]]
  );
}

export function downloadStudySetQuestions(title: string, questions: QbQuestion[]) {
  downloadExcelFile(
    `${safeExcelFilename(title)}-questions.xls`,
    [...EXCEL_TEMPLATE_HEADERS],
    questions.map((question, index) => questionToExcelRow(question, index + 1))
  );
}

export function downloadProgramQuestions(programName: string, topics: QbTopic[]) {
  const rows: string[][] = [];
  let serial = 1;
  for (const topic of topics) {
    for (const subtopic of topic.subtopics) {
      for (const question of subtopic.questions ?? []) {
        rows.push(questionToExcelRow(question, serial));
        serial += 1;
      }
    }
  }
  downloadExcelFile(
    `${safeExcelFilename(programName)}-all-questions.xls`,
    [...EXCEL_TEMPLATE_HEADERS],
    rows
  );
}

const OPTION_LABELS = ["A1", "A2", "A3", "A4"] as const;
const LETTERS = ["A", "B", "C", "D"] as const;

export function AdminQuestionDropdown({
  question,
  displayNumber,
  onDelete,
  onEdit,
  onToggleHide,
  togglePending,
}: {
  question: QbQuestion;
  displayNumber: number;
  onDelete: () => void;
  onEdit: () => void;
  onToggleHide: () => void;
  togglePending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(-1);
  const maxStep = Math.max(question.options.length - 1, -1);
  const optionLetter = step >= 0 ? (LETTERS[step] ?? String(step + 1)) : null;
  const isCorrect =
    optionLetter !== null &&
    optionLetter.toUpperCase() === question.correctAnswer.toUpperCase();

  const goPrev = () => setStep((s) => Math.max(-1, s - 1));
  const goNext = () => setStep((s) => Math.min(maxStep, s + 1));

  return (
    <li
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-card",
        !question.isActive && "border-dashed opacity-70"
      )}
    >
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setStep(-1);
          }}
          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-muted/40"
          aria-expanded={open}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-primary transition",
              open ? "rotate-0" : "-rotate-90"
            )}
          />
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-muted-foreground">
            <span className="font-semibold text-foreground">Q{displayNumber}</span>
            <span className="text-xs uppercase">
              {String(question.difficulty).toLowerCase()} ·{" "}
              {String(question.paper).replace("_", " ")}
              {question.marks != null ? ` · [${question.marks}]` : ""}
            </span>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {String(question.questionType).toUpperCase() === "MULTIPLE_CHOICE" ||
              ((question.options?.length ?? 0) >= 2 &&
                String(question.questionType).toUpperCase() !== "SHORT_ANSWER" &&
                String(question.questionType).toUpperCase() !== "DATA_BASED")
                ? "MCQ"
                : "Written"}
            </span>
            {question.yearHint != null ? (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {question.yearHint}
              </span>
            ) : null}
            {question.sourceLabel ? (
              <span
                className="max-w-[8rem] truncate rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                title={question.sourceLabel}
              >
                {question.sourceLabel}
              </span>
            ) : null}
            <span className="truncate text-muted-foreground">
              — {richTextExcerpt(question.prompt, 72)}
            </span>
            {question.diagramUrl ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                <ImageIcon className="h-3 w-3" /> Img
              </span>
            ) : null}
            {question.videoUrl ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                <Video className="h-3 w-3" /> Video
              </span>
            ) : null}
            {question.markScheme ? (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Scheme
              </span>
            ) : null}
            {!question.isActive ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#fff1ee] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                <EyeOff className="h-3 w-3" /> Hidden
              </span>
            ) : null}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-0.5 pr-2">
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-primary-muted hover:text-primary"
            title="Edit question"
            aria-label="Edit question"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
            title={question.isActive ? "Hide from students" : "Show to students"}
            aria-label={question.isActive ? "Hide question" : "Show question"}
            disabled={togglePending}
            onClick={onToggleHide}
          >
            {question.isActive ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-accent" />
            )}
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 text-accent transition hover:bg-[#fff1ee]"
            title="Delete question"
            aria-label="Delete question"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-muted/20 px-3 py-3">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(-1)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
                step === -1
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              )}
            >
              Problem
            </button>
            {question.options.map((_, i) => (
              <button
                key={OPTION_LABELS[i] ?? i}
                type="button"
                onClick={() => setStep(i)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
                  step === i
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                )}
              >
                {OPTION_LABELS[i] ?? `A${i + 1}`}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={step <= -1}
                onClick={goPrev}
                className="h-8 px-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={step >= maxStep}
                onClick={goNext}
                className="h-8 px-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {step === -1 ? (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Full problem
              </p>
              <RichTextContent
                html={question.prompt}
                className="text-sm leading-relaxed text-foreground"
              />
              {question.body ? (
                <RichTextContent
                  html={question.body}
                  className="text-sm text-muted-foreground"
                />
              ) : null}
              {question.diagramUrl ? (
                <div className="overflow-hidden rounded-lg border border-border bg-muted/30 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={question.diagramUrl}
                    alt={`Q${displayNumber} stimulus`}
                    className="mx-auto max-h-56 object-contain"
                  />
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>
                  Answer:{" "}
                  <strong className="text-foreground">{question.correctAnswer.toUpperCase()}</strong>
                </span>
                {question.markScheme ? <span>Mark scheme available</span> : null}
                {question.videoUrl ? <span>Video solution available</span> : null}
              </div>
              <Button type="button" size="sm" onClick={() => setStep(0)} disabled={maxStep < 0}>
                Next: A1
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Option {OPTION_LABELS[step] ?? `A${step + 1}`}{" "}
                  <span className="text-muted-foreground">({optionLetter})</span>
                </p>
                {isCorrect ? (
                  <span className="rounded-md bg-[#ecfdf3] px-2 py-0.5 text-[11px] font-bold uppercase text-accent-green">
                    Correct answer
                  </span>
                ) : null}
              </div>
              <RichTextContent
                html={question.options[step]}
                className="text-sm leading-relaxed text-foreground"
              />
              {question.markScheme && isCorrect ? (
                <div className="rounded-lg border border-primary/20 bg-primary-muted/40 p-3 text-sm text-foreground">
                  <p className="mb-1 text-xs font-semibold uppercase text-primary">Mark scheme</p>
                  <RichTextContent html={question.markScheme} />
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </li>
  );
}
