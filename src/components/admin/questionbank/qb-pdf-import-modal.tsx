"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  HelpCircle,
  ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useBulkCreateQbQuestions,
  useParseQbPdf,
} from "@/hooks";
import type { ApiError } from "@/types";
import type {
  CreateQbQuestionInput,
  ParsedPdfQuestion,
} from "@/services/questionbank-admin.types";
import type { QbDifficulty, QbPaper, QbPaperConfig, QbPaperKind } from "@/types/qb.types";
import { cn } from "@/utils";
import { kindForPaper, paperShortLabel } from "./qb-admin-shared";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  subtopicId: string;
  initialPaper: QbPaper;
  paperTabs: QbPaper[];
  paperConfig: QbPaperConfig;
  onSuccess: (count: number) => void;
};

export function QbPdfImportModal({
  open,
  onClose,
  subtopicId,
  initialPaper,
  paperTabs,
  paperConfig,
  onSuccess,
}: Props) {
  const parsePdf = useParseQbPdf();
  const bulkCreate = useBulkCreateQbQuestions();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetPaper, setTargetPaper] = useState<QbPaper>(initialPaper);
  const [questionKind, setQuestionKind] = useState<QbPaperKind>(() =>
    kindForPaper(initialPaper, paperConfig)
  );
  const [answerKeyInput, setAnswerKeyInput] = useState("");
  const [extractedQuestions, setExtractedQuestions] = useState<ParsedPdfQuestion[]>([]);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [error, setError] = useState<string | null>(null);
  const [batchDifficulty, setBatchDifficulty] = useState<QbDifficulty>("EASY");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync default kind when initialPaper changes
  useEffect(() => {
    if (open) {
      setTargetPaper(initialPaper);
      setQuestionKind(kindForPaper(initialPaper, paperConfig));
    }
  }, [open, initialPaper, paperConfig]);

  const onPaperChange = (paper: QbPaper) => {
    setTargetPaper(paper);
    setQuestionKind(kindForPaper(paper, paperConfig));
  };

  const resetForm = () => {
    setSelectedFile(null);
    setAnswerKeyInput("");
    setExtractedQuestions([]);
    setStep("upload");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (bulkCreate.isPending || parsePdf.isPending) return;
    resetForm();
    onClose();
  };

  const onSelectFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF file.");
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file first.");
      return;
    }
    setError(null);
    try {
      const result = await parsePdf.mutateAsync({
        file: selectedFile,
        paper: targetPaper,
        answerKey: answerKeyInput.trim() || undefined,
        kind: questionKind,
      });

      if (!result.questions?.length) {
        setError("No questions could be extracted. Please check the PDF formatting.");
        return;
      }

      // If backend detected another kind and user was in AUTO, sync it
      if (result.detectedKind && result.detectedKind !== questionKind) {
        setQuestionKind(result.detectedKind);
      }

      setExtractedQuestions(result.questions);
      setStep("review");
    } catch (err) {
      setError((err as ApiError)?.message || "Failed to extract questions from PDF.");
    }
  };

  const updateQuestionField = (
    index: number,
    field: keyof ParsedPdfQuestion,
    value: unknown
  ) => {
    setExtractedQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    setExtractedQuestions((prev) => {
      const copy = [...prev];
      const opts = [...(copy[qIndex].options ?? ["", "", "", ""])];
      opts[optIndex] = text;
      copy[qIndex] = { ...copy[qIndex], options: opts };
      return copy;
    });
  };

  const toggleQuestionKind = (index: number) => {
    setExtractedQuestions((prev) => {
      const copy = [...prev];
      const current = copy[index].questionType === "MULTIPLE_CHOICE" ? "MCQ" : "WRITTEN";
      const next = current === "MCQ" ? "WRITTEN" : "MCQ";
      copy[index] = {
        ...copy[index],
        questionType: next === "MCQ" ? "MULTIPLE_CHOICE" : "SHORT_ANSWER",
        options:
          next === "MCQ"
            ? (copy[index].options?.length ? copy[index].options : ["Option A", "Option B", "Option C", "Option D"])
            : [],
        correctAnswer:
          next === "MCQ"
            ? copy[index].correctAnswer || "A"
            : copy[index].markScheme?.trim() || "SEE_MARK_SCHEME",
      };
      return copy;
    });
  };

  const deleteExtractedQuestion = (index: number) => {
    setExtractedQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImportAll = async () => {
    if (!extractedQuestions.length) return;
    setError(null);
    try {
      const dtos: Partial<CreateQbQuestionInput>[] = extractedQuestions.map(
        (q, idx) => {
          const isWritten =
            q.questionType === "SHORT_ANSWER" ||
            q.questionType === "DATA_BASED" ||
            questionKind === "WRITTEN";

          if (isWritten) {
            return {
              subtopicId,
              number: idx + 1,
              prompt: q.prompt,
              body: q.body ?? null,
              diagramUrl: q.diagramUrl ?? null,
              difficulty: q.difficulty || batchDifficulty,
              paper: targetPaper,
              questionType: "SHORT_ANSWER",
              calculatorAllowed: q.calculatorAllowed ?? true,
              marks: Number.isFinite(q.marks) && (q.marks ?? 0) >= 1 ? q.marks : 1,
              options: [],
              correctAnswer: q.markScheme?.trim() || "SEE_MARK_SCHEME",
              markScheme: q.markScheme ?? null,
              order: idx,
              isActive: true,
            };
          }

          return {
            subtopicId,
            number: idx + 1,
            prompt: q.prompt,
            body: q.body ?? null,
            diagramUrl: q.diagramUrl ?? null,
            difficulty: q.difficulty || batchDifficulty,
            paper: targetPaper,
            questionType: "MULTIPLE_CHOICE",
            calculatorAllowed: q.calculatorAllowed ?? true,
            marks: 1,
            options: q.options?.length ? q.options : ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: (q.correctAnswer || "A").toUpperCase(),
            markScheme: q.markScheme ?? null,
            order: idx,
            isActive: true,
          };
        }
      );

      const res = await bulkCreate.mutateAsync({
        subtopicId,
        questions: dtos,
        paper: targetPaper,
      });

      onSuccess(res.imported);
      handleClose();
    } catch (err) {
      setError((err as ApiError)?.message || "Failed to import questions.");
    }
  };

  const isBusy = parsePdf.isPending || bulkCreate.isPending;

  return (
    <AdminModal
      open={open}
      onClose={handleClose}
      title={
        step === "upload"
          ? `Create ${questionKind === "MCQ" ? "MCQ" : "Written"} Questions from PDF`
          : `Review & Import (${extractedQuestions.length} ${
              questionKind === "MCQ" ? "MCQ" : "Written"
            } Questions)`
      }
      description={
        step === "upload"
          ? `Upload an exam paper PDF to automatically extract ${
              questionKind === "MCQ" ? "Multiple Choice" : "Written / Structured"
            } questions into ${paperShortLabel(targetPaper, paperConfig)}.`
          : "Review the extracted questions, adjust marks, prompts, options or mark schemes, and save to your study set."
      }
      className={step === "review" ? "sm:max-w-5xl" : "sm:max-w-2xl"}
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          {step === "review" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => setStep("upload")}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Upload different PDF
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={handleClose}
            >
              Cancel
            </Button>

            {step === "upload" ? (
              <Button
                type="button"
                disabled={isBusy || !selectedFile}
                onClick={handleExtract}
              >
                {parsePdf.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting questions…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Extract & Preview Questions
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={isBusy || extractedQuestions.length === 0}
                onClick={handleImportAll}
              >
                {bulkCreate.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving {extractedQuestions.length} questions…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Import All {extractedQuestions.length} Questions
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {error ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-4 py-2.5 text-sm text-accent">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {step === "upload" ? (
        <div className="space-y-5">
          {/* Paper destination selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Destination Paper
            </label>
            <div className="flex flex-wrap gap-2">
              {paperTabs.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPaperChange(p)}
                  className={cn(
                    "rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition",
                    targetPaper === p
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  )}
                >
                  {paperShortLabel(p, paperConfig)}
                </button>
              ))}
            </div>
          </div>

          {/* Question Type Selector: MCQ vs Written */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Question Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setQuestionKind("MCQ")}
                className={cn(
                  "flex flex-col items-start rounded-xl border p-3 text-left transition",
                  questionKind === "MCQ"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <span className="font-semibold text-sm text-foreground">
                  Multiple Choice (MCQ)
                </span>
                <span className="text-xs text-muted-foreground">
                  Questions with 4 options (A, B, C, D) and answer keys
                </span>
              </button>

              <button
                type="button"
                onClick={() => setQuestionKind("WRITTEN")}
                className={cn(
                  "flex flex-col items-start rounded-xl border p-3 text-left transition",
                  questionKind === "WRITTEN"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <span className="font-semibold text-sm text-foreground">
                  Written / Structured Question
                </span>
                <span className="text-xs text-muted-foreground">
                  Theory questions, sub-parts (a, b, c), marks [m] and mark schemes
                </span>
              </button>
            </div>
          </div>

          {/* PDF Drag & Drop / File Input */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border px-6 py-9 text-center transition hover:border-primary/60 hover:bg-muted/30",
              selectedFile && "border-primary bg-primary/5"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => onSelectFile(e.target.files?.[0])}
            />

            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-7 w-7" />
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Click to change file
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Click to select or drag & drop your {questionKind === "MCQ" ? "MCQ" : "Written"} PDF paper
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports Cambridge, Edexcel, and Board examination papers
                </p>
              </div>
            )}
          </div>

          {/* Answer Key or Mark Scheme Input */}
          <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {questionKind === "MCQ" ? "Answer Key (Optional)" : "Mark Scheme / Model Answers (Optional)"}
              </label>
              <span className="text-[11px] text-muted-foreground">
                {questionKind === "MCQ" ? "Auto-assigns correct letters" : "Auto-populates solutions"}
              </span>
            </div>
            <Input
              value={answerKeyInput}
              onChange={(e) => setAnswerKeyInput(e.target.value)}
              placeholder={
                questionKind === "MCQ"
                  ? "e.g. 1:C 2:A 3:A 4:B ... or CADBCBACDA..."
                  : "e.g. 1: Newton second law definition... 2: F = ma calculation..."
              }
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              {questionKind === "MCQ"
                ? "Tip: Paste the Mark Scheme letters or comma-separated pairs. You can also review and change answers individually in the next step."
                : "Tip: Paste model answers or solutions. You can also review and refine each question's rubric in the review step."}
            </p>
          </div>
        </div>
      ) : (
        /* Review Step */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                Total Extracted:
              </span>
              <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                {extractedQuestions.length} {questionKind === "MCQ" ? "MCQ" : "Written"} Questions
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">Default difficulty:</span>
              {(["EASY", "MEDIUM", "HARD"] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => {
                    setBatchDifficulty(diff);
                    setExtractedQuestions((prev) =>
                      prev.map((q) => ({ ...q, difficulty: diff }))
                    );
                  }}
                  className={cn(
                    "rounded-md border px-2 py-0.5 font-medium transition",
                    batchDifficulty === diff
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Question List */}
          <div className="max-h-[62vh] space-y-4 overflow-y-auto pr-1">
            {extractedQuestions.map((q, qIndex) => {
              const isWritten =
                q.questionType === "SHORT_ANSWER" ||
                q.questionType === "DATA_BASED" ||
                questionKind === "WRITTEN";

              return (
                <div
                  key={q.number || qIndex}
                  className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                        {qIndex + 1}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        Question {q.number || qIndex + 1}
                      </span>

                      {/* Format Pill / Switcher */}
                      <button
                        type="button"
                        onClick={() => toggleQuestionKind(qIndex)}
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition",
                          isWritten
                            ? "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-950/60 dark:text-purple-300"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-950/60 dark:text-blue-300"
                        )}
                        title="Click to toggle between MCQ and Written"
                      >
                        {isWritten ? "Written" : "MCQ"}
                      </button>

                      {/* Marks field */}
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-muted-foreground">Marks:</span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={q.marks ?? 1}
                          onChange={(e) =>
                            updateQuestionField(
                              qIndex,
                              "marks",
                              Math.max(1, Number.parseInt(e.target.value, 10) || 1)
                            )
                          }
                          className="h-6 w-12 rounded border border-border bg-background px-1.5 text-center text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isWritten ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-muted-foreground">
                            Correct:
                          </span>
                          <div className="flex items-center gap-1">
                            {OPTION_LETTERS.map((letter) => {
                              const isSelected =
                                (q.correctAnswer || "").toUpperCase() === letter;
                              return (
                                <button
                                  key={letter}
                                  type="button"
                                  onClick={() =>
                                    updateQuestionField(qIndex, "correctAnswer", letter)
                                  }
                                  className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-md border text-xs font-bold transition",
                                    isSelected
                                      ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                                      : "border-border bg-muted/40 text-muted-foreground hover:border-primary/60 hover:text-foreground"
                                  )}
                                >
                                  {letter}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => deleteExtractedQuestion(qIndex)}
                        className="ml-2 rounded-md p-1.5 text-accent hover:bg-accent/10"
                        title="Remove question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Prompt */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase text-muted-foreground">
                      {isWritten ? "Question Problem / Stem & Sub-parts (a, b, c)" : "Question Prompt / Stem"}
                    </label>
                    <textarea
                      rows={Math.max(2, Math.min(8, (q.prompt.match(/\n/g) || []).length + 2))}
                      value={q.prompt}
                      onChange={(e) =>
                        updateQuestionField(qIndex, "prompt", e.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-sm leading-relaxed text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Written Question: Mark Scheme & Solutions */}
                  {isWritten ? (
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold uppercase text-muted-foreground">
                          Mark Scheme / Rubric / Expected Answer
                        </label>
                        <span className="text-[10px] text-muted-foreground">
                          Shown to students after submission
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={q.markScheme ?? ""}
                        onChange={(e) =>
                          updateQuestionField(qIndex, "markScheme", e.target.value)
                        }
                        placeholder="Expected answer points, formulas, or marking scheme..."
                        className="mt-1 w-full rounded-xl border border-border bg-background p-2 text-xs leading-relaxed text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  ) : (
                    /* MCQ Options grid */
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {OPTION_LETTERS.map((letter, optIndex) => {
                        const isSelected =
                          (q.correctAnswer || "").toUpperCase() === letter;
                        return (
                          <div
                            key={letter}
                            className={cn(
                              "flex items-center gap-2 rounded-xl border bg-background p-2 transition",
                              isSelected
                                ? "border-emerald-500/70 bg-emerald-50/40 dark:bg-emerald-950/20"
                                : "border-border"
                            )}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                updateQuestionField(qIndex, "correctAnswer", letter)
                              }
                              className={cn(
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition",
                                isSelected
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-border bg-muted/60 text-muted-foreground hover:bg-muted"
                              )}
                              title="Click to mark as correct answer"
                            >
                              {letter}
                            </button>
                            <input
                              type="text"
                              value={q.options[optIndex] ?? ""}
                              onChange={(e) =>
                                updateOptionText(qIndex, optIndex, e.target.value)
                              }
                              placeholder={`Option ${letter} text`}
                              className="min-w-0 flex-1 bg-transparent text-sm text-foreground focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Diagram URL input */}
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Diagram / Image URL:</span>
                    <input
                      type="text"
                      value={q.diagramUrl ?? ""}
                      onChange={(e) =>
                        updateQuestionField(qIndex, "diagramUrl", e.target.value)
                      }
                      placeholder="https://... (optional image for stimulus or graph)"
                      className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                    {q.diagramUrl ? (
                      <a
                        href={q.diagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary underline"
                      >
                        View
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminModal>
  );
}
