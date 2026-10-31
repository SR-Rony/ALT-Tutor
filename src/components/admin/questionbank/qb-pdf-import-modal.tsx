"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  HelpCircle,
  ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useBulkCreateQbQuestions,
  useParseQbPdf,
} from "@/hooks";
import { uploadService } from "@/services/upload.service";
import type { ApiError } from "@/types";
import type {
  CreateQbQuestionInput,
  ParsedPdfQuestion,
} from "@/services/questionbank-admin.types";
import type { QbDifficulty, QbPaper, QbPaperConfig, QbPaperKind } from "@/types/qb.types";
import { cn } from "@/utils";
import { kindForPaper, paperShortLabel } from "./qb-admin-shared";
import { looksLikeHtml, normalizeRichTextContent } from "@/lib/rich-text";

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
  const [parseMode, setParseMode] = useState<"AUTO" | "MCQ" | "WRITTEN">("AUTO");
  const [answerKeyInput, setAnswerKeyInput] = useState("");
  const [extractedQuestions, setExtractedQuestions] = useState<ParsedPdfQuestion[]>([]);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [error, setError] = useState<string | null>(null);
  const [batchDifficulty, setBatchDifficulty] = useState<QbDifficulty>("EASY");
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync destination paper when modal opens
  useEffect(() => {
    if (open) {
      setTargetPaper(initialPaper);
      const paperKind = kindForPaper(initialPaper, paperConfig);
      // Default to AUTO so mixed questions work out of the box
      setParseMode("AUTO");
    }
  }, [open, initialPaper, paperConfig]);

  const onPaperChange = (paper: QbPaper) => {
    setTargetPaper(paper);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setAnswerKeyInput("");
    setExtractedQuestions([]);
    setStep("upload");
    setError(null);
    setUploadingImageIndex(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (bulkCreate.isPending || parsePdf.isPending || uploadingImageIndex !== null) return;
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
        kind: parseMode,
      });

      if (!result.questions?.length) {
        setError("No questions could be extracted. Please check the PDF formatting.");
        return;
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
      const current =
        copy[index].questionType === "MULTIPLE_CHOICE" ? "MCQ" : "WRITTEN";
      const next = current === "MCQ" ? "WRITTEN" : "MCQ";
      copy[index] = {
        ...copy[index],
        questionType: next === "MCQ" ? "MULTIPLE_CHOICE" : "SHORT_ANSWER",
        options:
          next === "MCQ"
            ? copy[index].options?.length
              ? copy[index].options
              : ["Option A", "Option B", "Option C", "Option D"]
            : [],
        correctAnswer:
          next === "MCQ"
            ? copy[index].correctAnswer || "A"
            : copy[index].markScheme?.trim() || "SEE_MARK_SCHEME",
      };
      return copy;
    });
  };

  const onUploadQuestionImage = async (qIndex: number, file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploadingImageIndex(qIndex);
    try {
      const res = await uploadService.upload(file, "questionbank");
      updateQuestionField(qIndex, "diagramUrl", res.url);
    } catch (err) {
      setError((err as ApiError)?.message || "Failed to upload question image");
    } finally {
      setUploadingImageIndex(null);
    }
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
            q.questionType === "SHORT_ANSWER" || q.questionType === "DATA_BASED";

          if (isWritten) {
            return {
              subtopicId,
              number: idx + 1,
              prompt: q.prompt,
              body: q.body ?? null,
              diagramUrl: q.diagramUrl ?? null,
              videoUrl: q.videoUrl ?? null,
              difficulty: q.difficulty || batchDifficulty,
              paper: targetPaper,
              questionType: "SHORT_ANSWER",
              calculatorAllowed: q.calculatorAllowed ?? true,
              marks: Number.isFinite(q.marks) && (q.marks ?? 0) >= 1 ? q.marks : 1,
              options: [],
              correctAnswer: q.markScheme?.trim() || "SEE_MARK_SCHEME",
              markScheme: q.markScheme ?? null,
              notes: q.notes ?? null,
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
            videoUrl: q.videoUrl ?? null,
            difficulty: q.difficulty || batchDifficulty,
            paper: targetPaper,
            questionType: "MULTIPLE_CHOICE",
            calculatorAllowed: q.calculatorAllowed ?? true,
            marks: 1,
            options: q.options?.length
              ? q.options
              : ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: (q.correctAnswer || "A").toUpperCase(),
            markScheme: q.markScheme ?? null,
            notes: q.notes ?? null,
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

  const isBusy = parsePdf.isPending || bulkCreate.isPending || uploadingImageIndex !== null;

  const counts = useMemo(() => {
    let mcq = 0;
    let written = 0;
    for (const q of extractedQuestions) {
      if (q.questionType === "SHORT_ANSWER" || q.questionType === "DATA_BASED") {
        written++;
      } else {
        mcq++;
      }
    }
    return { mcq, written, total: extractedQuestions.length };
  }, [extractedQuestions]);

  return (
    <AdminModal
      open={open}
      onClose={handleClose}
      title={
        step === "upload"
          ? "Create Questions from PDF (MCQ & Written)"
          : `Review & Customize (${counts.total} Questions)`
      }
      description={
        step === "upload"
          ? `Upload any examination or practice PDF to extract questions into ${paperShortLabel(
              targetPaper,
              paperConfig
            )}. Supports pure MCQ, pure Written, and mixed papers.`
          : "Review the extracted questions, upload or adjust diagrams, add video solution links or mark schemes, and click Import to save."
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
          {/* Destination Paper Selection */}
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

          {/* Mode Selector: AUTO vs MCQ vs WRITTEN */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Question Extraction Mode
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setParseMode("AUTO")}
                className={cn(
                  "flex flex-col items-start rounded-xl border p-3 text-left transition",
                  parseMode === "AUTO"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Smart Auto-Detect
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  Detects MCQ & Written questions individually in the same file
                </span>
              </button>

              <button
                type="button"
                onClick={() => setParseMode("MCQ")}
                className={cn(
                  "flex flex-col items-start rounded-xl border p-3 text-left transition",
                  parseMode === "MCQ"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <span className="text-sm font-semibold text-foreground">
                  MCQ Only
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  Treats all extracted items as 4-option multiple choice questions
                </span>
              </button>

              <button
                type="button"
                onClick={() => setParseMode("WRITTEN")}
                className={cn(
                  "flex flex-col items-start rounded-xl border p-3 text-left transition",
                  parseMode === "WRITTEN"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <span className="text-sm font-semibold text-foreground">
                  Written Only
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  Treats all extracted items as theory, structured questions & marks
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
                  Click to select or drag & drop your PDF question paper
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports Cambridge, Edexcel, NCTB, and standardized test papers
                </p>
              </div>
            )}
          </div>

          {/* Answer Key or Mark Scheme Input */}
          <div className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Answer Key / Mark Scheme (Optional)
              </label>
              <span className="text-[11px] text-muted-foreground">
                Auto-assigns solutions & answers
              </span>
            </div>
            <Input
              value={answerKeyInput}
              onChange={(e) => setAnswerKeyInput(e.target.value)}
              placeholder="e.g. 1:C 2:A 3:A 4:B ... or CADBCBACDA... or 1: Definition..."
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Tip: Paste the Mark Scheme letters (for MCQ) or solutions. You can also edit images, videos, and rubrics individually in the next step.
            </p>
          </div>
        </div>
      ) : (
        /* Review Step */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                Extracted:
              </span>
              <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                {counts.total} Questions
              </span>
              {counts.mcq > 0 ? (
                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  {counts.mcq} MCQ
                </span>
              ) : null}
              {counts.written > 0 ? (
                <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  {counts.written} Written
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">Set difficulty:</span>
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
                q.questionType === "SHORT_ANSWER" || q.questionType === "DATA_BASED";

              return (
                <div
                  key={q.number || qIndex}
                  className="space-y-3.5 rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                        {qIndex + 1}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        Question {q.number || qIndex + 1}
                      </span>

                      {/* Interactive Format Switcher Badge */}
                      <button
                        type="button"
                        onClick={() => toggleQuestionKind(qIndex)}
                        className={cn(
                          "cursor-pointer rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider transition",
                          isWritten
                            ? "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-950/60 dark:text-purple-300"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-950/60 dark:text-blue-300"
                        )}
                        title="Click to toggle between MCQ and Written format"
                      >
                        {isWritten ? "Written" : "MCQ"} (Click to flip)
                      </button>

                      {/* Marks field for Written Questions */}
                      {isWritten ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-medium text-muted-foreground">Marks:</span>
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
                            className="h-6 w-12 rounded border border-border bg-background px-1 text-center text-xs font-bold text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                      ) : null}
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

                  {/* Question Stem / Subparts Prompt */}
                  <div>
                    <label className="text-[11px] font-semibold uppercase text-muted-foreground">
                      {isWritten
                        ? "Question Problem / Stem & Sub-parts (a, b, c)"
                        : "Question Prompt / Stem"}
                    </label>
                    <textarea
                      rows={Math.max(2, Math.min(8, (q.prompt.match(/\n/g) || []).length + 2))}
                      value={q.prompt}
                      onChange={(e) =>
                        updateQuestionField(qIndex, "prompt", e.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 font-mono text-xs sm:text-sm leading-relaxed text-foreground whitespace-pre focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Interactive Image / Diagram Section */}
                  <div className="space-y-2 rounded-xl border border-border/70 bg-muted/15 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        <span>Question Diagram / Graph / Stimulus Image</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground shadow-sm transition hover:border-primary/60 hover:bg-muted">
                          {uploadingImageIndex === qIndex ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          ) : (
                            <Upload className="h-3.5 w-3.5 text-primary" />
                          )}
                          <span>{q.diagramUrl ? "Replace image" : "Upload image"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingImageIndex !== null}
                            onChange={(e) =>
                              void onUploadQuestionImage(qIndex, e.target.files?.[0])
                            }
                          />
                        </label>
                        {q.diagramUrl ? (
                          <button
                            type="button"
                            onClick={() => updateQuestionField(qIndex, "diagramUrl", null)}
                            className="rounded-lg border border-accent/20 bg-accent/5 px-2 py-1 text-xs font-medium text-accent hover:bg-accent/15"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {q.diagramUrl ? (
                      <div className="space-y-1.5">
                        <div className="relative overflow-hidden rounded-lg border border-border bg-background/80 p-2 text-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={q.diagramUrl}
                            alt={`Q${qIndex + 1} diagram`}
                            className="mx-auto max-h-56 rounded object-contain shadow-xs"
                          />
                        </div>
                        <input
                          type="text"
                          value={q.diagramUrl}
                          onChange={(e) =>
                            updateQuestionField(qIndex, "diagramUrl", e.target.value.trim() || null)
                          }
                          className="w-full truncate rounded-md border border-border/80 bg-background px-2 py-1 text-[11px] text-muted-foreground focus:border-primary focus:outline-none"
                          title="Image URL"
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={q.diagramUrl ?? ""}
                        onChange={(e) =>
                          updateQuestionField(qIndex, "diagramUrl", e.target.value.trim() || null)
                        }
                        placeholder="Paste image URL (https://...) or click 'Upload image' above"
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    )}
                  </div>

                  {/* MCQ Options Grid */}
                  {!isWritten ? (
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
                  ) : null}

                  {/* Mark Scheme / Expected Answer */}
                  <div>
                    <div className="flex items-center justify-between pb-1">
                      <label className="text-[11px] font-semibold uppercase text-muted-foreground">
                        {isWritten
                          ? "Mark Scheme / Model Answer & Rubric"
                          : "Explanation / Mark Scheme (Optional)"}
                      </label>
                      <span className="text-[10px] text-muted-foreground">
                        Revealed to students in solutions
                      </span>
                    </div>
                    <textarea
                      rows={isWritten ? 3 : 2}
                      value={q.markScheme ?? ""}
                      onChange={(e) =>
                        updateQuestionField(qIndex, "markScheme", e.target.value)
                      }
                      placeholder={
                        isWritten
                          ? "Key formulas, calculation steps, acceptable answers and marks distribution..."
                          : "Explanation for why this answer is correct..."
                      }
                      className="w-full rounded-xl border border-border bg-background p-2.5 text-xs leading-relaxed text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Video Solution Link */}
                  <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/15 px-3 py-2 text-xs">
                    <Video className="h-4 w-4 shrink-0 text-primary" />
                    <span className="shrink-0 font-medium text-muted-foreground">
                      Video Solution URL:
                    </span>
                    <input
                      type="text"
                      value={q.videoUrl ?? ""}
                      onChange={(e) =>
                        updateQuestionField(qIndex, "videoUrl", e.target.value.trim() || null)
                      }
                      placeholder="e.g. https://www.youtube.com/watch?v=... or MP4 URL (optional)"
                      className="min-w-0 flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    {q.videoUrl ? (
                      <a
                        href={q.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary underline"
                      >
                        <span>Preview</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>

                  {/* Question Notes / Theory (Optional) */}
                  <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/15 px-3 py-2 text-xs">
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-muted-foreground">
                          Question Notes / Key Concepts (Optional):
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Visible via student &quot;Notes&quot; button
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={q.notes ?? ""}
                        onChange={(e) =>
                          updateQuestionField(qIndex, "notes", e.target.value.trim() || null)
                        }
                        placeholder="Key formulas, definitions, revision tips, or theory explanation for students..."
                        className="w-full bg-transparent text-xs leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>
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
