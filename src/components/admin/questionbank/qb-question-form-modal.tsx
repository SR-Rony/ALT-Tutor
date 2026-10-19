"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useAddQbPaper, useCreateQbQuestion, useUpdateQbQuestion } from "@/hooks";
import { isRichTextEmpty, serializeRichText } from "@/lib/rich-text";
import { uploadService } from "@/services/upload.service";
import type { ApiError } from "@/types";
import type {
  QbDifficulty,
  QbPaper,
  QbPaperConfig,
  QbPaperKind,
  QbQuestion,
  QbQuestionType,
} from "@/types/qb.types";
import { DIFFICULTIES, kindForPaper, paperShortLabel, papersForKind } from "./qb-admin-shared";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
const EMPTY_OPTIONS = ["", "", "", ""] as [string, string, string, string];

export type QbSavedQuestion = { id: string; paper: QbPaper };

type Props = {
  open: boolean;
  onClose: () => void;
  /** Study set the question is saved into. */
  subtopicId: string;
  paperConfig: QbPaperConfig;
  paperTabs: QbPaper[];
  /** Paper selected when the form opens (defaults to the first paper of the allowed kind). */
  initialPaper?: QbPaper;
  /** Edit this question instead of creating a new one. */
  question?: QbQuestion | null;
  /** Only papers of this kind can be chosen, e.g. a practice exam's MCQ / Written mode. */
  lockedKind?: QbPaperKind;
  description?: string;
  /** Rendered above the fields, e.g. a study set picker. */
  header?: ReactNode;
  onSaved?: (saved: QbSavedQuestion) => void;
};

export function QbQuestionFormModal({
  open,
  onClose,
  subtopicId,
  paperConfig,
  paperTabs,
  initialPaper,
  question,
  lockedKind,
  description = "Questions appear on the student study page for this paper.",
  header,
  onSaved,
}: Props) {
  const createQuestion = useCreateQbQuestion();
  const updateQuestion = useUpdateQbQuestion();
  const addPaper = useAddQbPaper();

  const [prompt, setPrompt] = useState("");
  const [optionHtmls, setOptionHtmls] = useState<[string, string, string, string]>(EMPTY_OPTIONS);
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [bodyText, setBodyText] = useState("");
  const [difficulty, setDifficulty] = useState<QbDifficulty>("EASY");
  const [paper, setPaper] = useState<QbPaper>("PAPER_1");
  const [markScheme, setMarkScheme] = useState("");
  const [diagramUrl, setDiagramUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [marks, setMarks] = useState("1");
  const [yearHint, setYearHint] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [uploadingField, setUploadingField] = useState<"diagram" | "video" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const diagramUploadRef = useRef<HTMLInputElement>(null);
  const videoUploadRef = useRef<HTMLInputElement>(null);

  const editId = question?.id ?? null;
  const questionKind: QbPaperKind = lockedKind ?? kindForPaper(paper, paperConfig);
  const paperOptions = useMemo(
    () =>
      papersForKind(
        questionKind,
        [...new Set(editId ? [...paperTabs, paper] : paperTabs)],
        paperConfig
      ),
    [questionKind, paperTabs, paper, paperConfig, editId]
  );
  const noMatchingPaper = paperOptions.length === 0;

  const busy =
    createQuestion.isPending ||
    updateQuestion.isPending ||
    addPaper.isPending ||
    uploadingField !== null;

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (question) {
      const questionPaper = (question.paper as QbPaper) || "PAPER_1";
      const kind = kindForPaper(questionPaper, paperConfig);
      const opts = [...(question.options ?? [])];
      while (opts.length < 4) opts.push("");
      setPrompt(question.prompt);
      setOptionHtmls([opts[0] ?? "", opts[1] ?? "", opts[2] ?? "", opts[3] ?? ""]);
      setCorrectAnswer(
        kind === "MCQ" ? (question.correctAnswer || "A").toUpperCase() : question.correctAnswer ?? ""
      );
      setBodyText(question.body ?? "");
      setDifficulty((question.difficulty as QbDifficulty) || "EASY");
      setPaper(questionPaper);
      setMarkScheme(question.markScheme ?? "");
      setDiagramUrl(question.diagramUrl ?? "");
      setVideoUrl(question.videoUrl ?? "");
      setMarks(String(question.marks ?? 1));
      setYearHint(question.yearHint != null ? String(question.yearHint) : "");
      setSourceLabel(question.sourceLabel ?? "");
      return;
    }
    const startPaper =
      initialPaper ??
      (lockedKind ? papersForKind(lockedKind, paperTabs, paperConfig)[0] : paperTabs[0]) ??
      "PAPER_1";
    const kind = lockedKind ?? kindForPaper(startPaper, paperConfig);
    setPrompt("");
    setOptionHtmls([...EMPTY_OPTIONS] as [string, string, string, string]);
    setCorrectAnswer(kind === "MCQ" ? "A" : "");
    setBodyText("");
    setDifficulty("EASY");
    setPaper(startPaper);
    setMarkScheme("");
    setDiagramUrl("");
    setVideoUrl("");
    setMarks("1");
    setYearHint("");
    setSourceLabel("");
    // Reset only when the form opens or switches question; later paper-list changes keep typed content.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editId]);

  // A different study set (or a newly added paper) can make the chosen paper invalid.
  useEffect(() => {
    if (!open || editId || paperOptions.length === 0) return;
    if (!paperOptions.includes(paper)) setPaper(paperOptions[0]);
  }, [open, editId, paperOptions, paper]);

  const onUploadMedia = async (field: "diagram" | "video", file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploadingField(field);
    try {
      const result = await uploadService.upload(file, "questionbank");
      if (field === "diagram") setDiagramUrl(result.url);
      else setVideoUrl(result.url);
    } catch (err) {
      setError((err as ApiError)?.message || "Upload failed. You can still paste a URL.");
    } finally {
      setUploadingField(null);
      if (field === "diagram" && diagramUploadRef.current) diagramUploadRef.current.value = "";
      if (field === "video" && videoUploadRef.current) videoUploadRef.current.value = "";
    }
  };

  const onAddMatchingPaper = async () => {
    if (!lockedKind || !subtopicId) return;
    setError(null);
    try {
      await addPaper.mutateAsync({
        subtopicId,
        payload: {
          label: lockedKind === "MCQ" ? "MCQ paper" : "Written paper",
          questionKind: lockedKind,
        },
      });
    } catch (err) {
      setError((err as ApiError)?.message || "Could not add paper");
    }
  };

  const onSave = async () => {
    setError(null);
    if (!subtopicId) {
      setError("Choose a study set to save this question in.");
      return;
    }
    if (noMatchingPaper) {
      setError(
        `This study set has no ${questionKind === "MCQ" ? "MCQ" : "written"} paper. Add one first.`
      );
      return;
    }
    if (isRichTextEmpty(prompt)) {
      setError("Prompt is required.");
      return;
    }
    const expectedKind = kindForPaper(paper, paperConfig);
    if (questionKind !== expectedKind) {
      setError(
        expectedKind === "MCQ"
          ? `${paperShortLabel(paper, paperConfig)} only accepts MCQ questions.`
          : `${paperShortLabel(paper, paperConfig)} only accepts written questions.`
      );
      return;
    }

    const isMcq = questionKind === "MCQ";
    const parsedMarks = Number.parseInt(marks, 10);
    const parsedYear = yearHint.trim() ? Number.parseInt(yearHint.trim(), 10) : undefined;
    const questionType: QbQuestionType = isMcq ? "MULTIPLE_CHOICE" : "SHORT_ANSWER";
    // Cleared fields must be sent as null: undefined is dropped from the JSON body,
    // so the backend would keep the previously saved value.
    const questionPayload = {
      prompt: serializeRichText(prompt),
      body: serializeRichText(bodyText) || null,
      options: isMcq ? optionHtmls.map((html) => serializeRichText(html)) : [],
      correctAnswer: isMcq
        ? correctAnswer.trim().toUpperCase() || "A"
        : correctAnswer.trim() || "SEE_MARK_SCHEME",
      questionType,
      difficulty,
      paper,
      marks: Number.isFinite(parsedMarks) && parsedMarks >= 1 ? parsedMarks : 1,
      yearHint:
        parsedYear != null && Number.isFinite(parsedYear) && parsedYear >= 1900 ? parsedYear : null,
      sourceLabel: sourceLabel.trim() || null,
      markScheme: serializeRichText(markScheme) || null,
      diagramUrl: diagramUrl.trim() || null,
      videoUrl: videoUrl.trim() || null,
    };

    try {
      if (editId) {
        await updateQuestion.mutateAsync({ id: editId, payload: questionPayload });
        onSaved?.({ id: editId, paper });
      } else {
        const created = await createQuestion.mutateAsync({
          subtopicId,
          number: Date.now() % 1000,
          ...questionPayload,
          calculatorAllowed: true,
        });
        onSaved?.({ id: created.id, paper });
      }
      onClose();
    } catch (err) {
      setError((err as ApiError)?.message || "Failed to save");
    }
  };

  const title = editId
    ? "Edit question"
    : lockedKind
      ? `Add ${lockedKind === "MCQ" ? "MCQ" : "written"} question`
      : "Add question";

  return (
    <AdminModal
      open={open}
      title={title}
      description={description}
      onClose={() => !busy && onClose()}
      className="h-dvh max-h-dvh rounded-none sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)] sm:max-w-[min(96vw,70rem)] sm:rounded-2xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={busy || noMatchingPaper} onClick={() => void onSave()}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      }
    >
      {error ? <p className="mb-3 text-sm text-accent">{error}</p> : null}

      {/* 63rem = the public study card's text column (974px) + editor padding/border, and
          qb-question-editors = the card's font, so line breaks land exactly where students see them. */}
      <div className="qb-question-editors mx-auto w-full max-w-[63rem] space-y-4 [--qb-prompt-h:calc(100dvh-24rem)] [--rte-sticky-top:-1rem] sm:[--qb-prompt-h:calc(100dvh-20rem)]">
        {header}

        {noMatchingPaper && subtopicId ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              This study set has no {questionKind === "MCQ" ? "MCQ" : "written"} paper yet.
            </p>
            {lockedKind ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => void onAddMatchingPaper()}
              >
                <Plus className="h-4 w-4" />
                {addPaper.isPending
                  ? "Adding…"
                  : `Add ${lockedKind === "MCQ" ? "MCQ" : "written"} paper`}
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="block space-y-1.5">
          <span className="text-sm font-semibold">Prompt</span>
          <RichTextEditor
            value={prompt}
            onChange={setPrompt}
            placeholder="Question stem — text, math, and diagrams…"
            minHeight="max(240px, var(--qb-prompt-h))"
            fullHeight
            disabled={busy}
          />
        </div>

        <div className="block space-y-1.5">
          <span className="text-sm font-semibold">
            {questionKind === "WRITTEN" ? "Body / parts (optional)" : "Body (optional)"}
          </span>
          <RichTextEditor
            value={bodyText}
            onChange={setBodyText}
            placeholder={
              questionKind === "WRITTEN"
                ? "(a) … [2]  (b) … [3]"
                : "Extra text or images shown below the prompt…"
            }
            minHeight={questionKind === "WRITTEN" ? "300px" : "120px"}
            fullHeight={questionKind === "WRITTEN"}
            disabled={busy}
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold">Cover diagram URL (optional)</span>
          <div className="flex flex-wrap gap-2">
            <Input
              value={diagramUrl}
              onChange={(e) => setDiagramUrl(e.target.value)}
              placeholder="https://… — or insert images in the editor above"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => diagramUploadRef.current?.click()}
            >
              {uploadingField === "diagram" ? "Uploading…" : "Upload"}
            </Button>
            <input
              ref={diagramUploadRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onUploadMedia("diagram", e.target.files?.[0])}
            />
          </div>
        </div>

        {questionKind === "MCQ" ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-sm font-semibold">Options (text and/or images)</span>
              <p className="text-xs text-muted-foreground">
                Optional when options are already shown in the prompt, body, or a diagram/table
                image. Set the correct letter below.
              </p>
            </div>
            {OPTION_LETTERS.map((letter, index) => (
              <div key={letter} className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Option {letter}</span>
                <RichTextEditor
                  value={optionHtmls[index]}
                  onChange={(html) =>
                    setOptionHtmls((prev) => {
                      const next = [...prev] as [string, string, string, string];
                      next[index] = html;
                      return next;
                    })
                  }
                  placeholder={`Option ${letter}`}
                  minHeight="72px"
                  disabled={busy}
                />
              </div>
            ))}
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Correct option</span>
              <select
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                className="flex h-10 w-full max-w-[8rem] rounded-xl border border-border bg-card px-3 text-sm"
              >
                {OPTION_LETTERS.map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Model answer key (optional)</span>
            <Input
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="Short key — full answer goes in Mark scheme"
            />
          </label>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as QbDifficulty)}
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Paper</span>
            <select
              value={paperOptions.includes(paper) ? paper : ""}
              disabled={noMatchingPaper}
              onChange={(e) => setPaper(e.target.value as QbPaper)}
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm disabled:opacity-60"
            >
              {noMatchingPaper ? <option value="">No matching paper</option> : null}
              {paperOptions.map((p) => (
                <option key={p} value={p}>
                  {paperShortLabel(p, paperConfig)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Marks</span>
            <Input value={marks} onChange={(e) => setMarks(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Year</span>
            <Input value={yearHint} onChange={(e) => setYearHint(e.target.value)} />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Source</span>
            <Input value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} />
          </label>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold">Video URL</span>
          <div className="flex flex-wrap gap-2">
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://…"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => videoUploadRef.current?.click()}
            >
              {uploadingField === "video" ? "Uploading…" : "Upload"}
            </Button>
            <input
              ref={videoUploadRef}
              type="file"
              accept="video/*,.mp4,.webm"
              className="hidden"
              onChange={(e) => void onUploadMedia("video", e.target.files?.[0])}
            />
          </div>
        </div>

        <div className="block space-y-1.5">
          <span className="text-sm font-semibold">Mark scheme</span>
          <RichTextEditor
            value={markScheme}
            onChange={setMarkScheme}
            placeholder="Worked solution / marking notes…"
            minHeight="120px"
            disabled={busy}
          />
        </div>
      </div>
    </AdminModal>
  );
}
