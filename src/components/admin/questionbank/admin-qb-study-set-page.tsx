"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ROUTES } from "@/constants";
import {
  useAdminQuestionbank,
  useAdminSubjectsTree,
  useAddQbPaper,
  useCreateQbQuestion,
  useDeleteQbQuestion,
  useImportQbQuestions,
  useRemoveQbPaper,
  useUpdateQbQuestion,
} from "@/hooks";
import { normalizeAccessBadge } from "@/lib/access-tier";
import { isRichTextEmpty, serializeRichText } from "@/lib/rich-text";
import { uploadService } from "@/services/upload.service";
import type { ApiError } from "@/types";
import type { QbImportResult } from "@/services/questionbank-admin.types";
import type { QbDifficulty, QbPaper, QbQuestion, QbQuestionType } from "@/types/qb.types";
import { cn } from "@/utils";
import {
  AccessBadgePill,
  AdminQuestionDropdown,
  DIFFICULTIES,
  countByPaper,
  downloadExcelTemplate,
  downloadStudySetQuestions,
  isMcqPaper,
  kindForPaper,
  paperKey,
  paperShortLabel,
  papersForKind,
  parsePaperNumber,
  questionsForPaper,
  resolvePaperTabs,
} from "./qb-admin-shared";

type QuestionKind = "MCQ" | "WRITTEN";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;
const EMPTY_OPTIONS = ["", "", "", ""] as [string, string, string, string];

type Props = { subtopicId: string };

export function AdminQbStudySetPage({ subtopicId }: Props) {
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId") ?? "";
  const { data: subjectsTree = [] } = useAdminSubjectsTree();
  const { data: topics = [], isLoading, error, refetch } = useAdminQuestionbank(
    programId || undefined
  );

  const createQuestion = useCreateQbQuestion();
  const updateQuestion = useUpdateQbQuestion();
  const deleteQuestion = useDeleteQbQuestion();
  const importQuestions = useImportQbQuestions();
  const addPaperMutation = useAddQbPaper();
  const removePaperMutation = useRemoveQbPaper();

  const [activePaper, setActivePaper] = useState<QbPaper>("PAPER_1");
  const [modal, setModal] = useState<
    null | { kind: "question"; editId?: string } | { kind: "import"; paper: QbPaper }
  >(null);
  const [importResult, setImportResult] = useState<QbImportResult | null>(null);
  const [prompt, setPrompt] = useState("");
  const [questionKind, setQuestionKind] = useState<QuestionKind>("MCQ");
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
  const [actionError, setActionError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const diagramUploadRef = useRef<HTMLInputElement>(null);
  const videoUploadRef = useRef<HTMLInputElement>(null);

  const located = useMemo(() => {
    for (const topic of topics) {
      const sub = topic.subtopics.find((s) => s.id === subtopicId);
      if (sub) return { topic, sub };
    }
    return null;
  }, [topics, subtopicId]);

  const programMeta = useMemo(() => {
    for (const category of subjectsTree) {
      for (const subject of category.subjects) {
        const program = subject.programs.find((p) => p.id === programId);
        if (program) return { program, subject, category };
      }
    }
    return null;
  }, [subjectsTree, programId]);

  const questions = located?.sub.questions ?? [];
  const paperTabs = resolvePaperTabs(located?.sub.paperCount, questions);
  const paperCounts = countByPaper(questions);
  const visibleQuestions = questionsForPaper(questions, activePaper);

  const busy =
    createQuestion.isPending ||
    updateQuestion.isPending ||
    deleteQuestion.isPending ||
    importQuestions.isPending ||
    addPaperMutation.isPending ||
    removePaperMutation.isPending ||
    uploadingField !== null;

  const backHref = programId
    ? `${ROUTES.admin.questionbank}?programId=${encodeURIComponent(programId)}`
    : ROUTES.admin.questionbank;

  const resetQuestionForm = (defaultPaper: QbPaper = activePaper, kind: QuestionKind = "MCQ") => {
    setPrompt("");
    setQuestionKind(kind);
    setOptionHtmls([...EMPTY_OPTIONS] as [string, string, string, string]);
    setCorrectAnswer(kind === "MCQ" ? "A" : "");
    setBodyText("");
    setDifficulty("EASY");
    setPaper(defaultPaper);
    setMarkScheme("");
    setDiagramUrl("");
    setVideoUrl("");
    setMarks("1");
    setYearHint("");
    setSourceLabel("");
  };

  const openAddQuestion = (forPaper: QbPaper = activePaper) => {
    const kind = kindForPaper(forPaper);
    setActionError(null);
    resetQuestionForm(forPaper, kind);
    setModal({ kind: "question" });
  };

  const activePaperIsMcq = isMcqPaper(activePaper);

  const handleAddPaper = async () => {
    setActionError(null);
    try {
      const updated = await addPaperMutation.mutateAsync(subtopicId);
      const nextPaper = `PAPER_${updated.paperCount}` as QbPaper;
      setActivePaper(nextPaper);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Could not add paper");
    }
  };

  const handleRemovePaper = async () => {
    if (paperTabs.length <= 1) return;
    const count = paperCounts[activePaper] ?? 0;
    const label = paperShortLabel(activePaper);
    const ok = window.confirm(
      count > 0
        ? `Delete ${label}? This permanently removes its ${count} question${count === 1 ? "" : "s"}. Higher papers will be renumbered.`
        : `Delete ${label}? Higher papers will be renumbered.`
    );
    if (!ok) return;
    setActionError(null);
    try {
      const updated = await removePaperMutation.mutateAsync({
        subtopicId,
        paper: activePaper,
      });
      const removedN = parsePaperNumber(activePaper);
      const nextActive =
        removedN > 1 ? paperKey(removedN - 1) : paperKey(1);
      // Prefer previous paper; clamp to new paperCount after delete.
      const maxLeft = updated.paperCount ?? Math.max(1, paperTabs.length - 1);
      setActivePaper(paperKey(Math.min(parsePaperNumber(nextActive), maxLeft)));
    } catch (err) {
      setActionError((err as ApiError)?.message || "Could not delete paper");
    }
  };

  const openEditQuestion = (question: QbQuestion) => {
    setActionError(null);
    setModal({ kind: "question", editId: question.id });
    const questionPaper = (question.paper as QbPaper) || "PAPER_1";
    // Paper rules win: P1 = MCQ, P2+ = Written (fixes mixed legacy rows in the form).
    const kind = kindForPaper(questionPaper);
    setQuestionKind(kind);
    setPrompt(question.prompt);
    const opts = [...(question.options ?? [])];
    while (opts.length < 4) opts.push("");
    setOptionHtmls([opts[0] ?? "", opts[1] ?? "", opts[2] ?? "", opts[3] ?? ""]);
    setCorrectAnswer(
      kind === "MCQ"
        ? (question.correctAnswer || "A").toUpperCase()
        : question.correctAnswer ?? ""
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
  };

  const toggleQuestionVisibility = (question: QbQuestion) => {
    if (
      question.isActive &&
      !window.confirm(
        "Hide this question from students? You can show it again anytime from the eye icon."
      )
    ) {
      return;
    }
    void updateQuestion.mutateAsync({
      id: question.id,
      payload: { isActive: !question.isActive },
    });
  };

  const onUploadMedia = async (field: "diagram" | "video", file: File | undefined) => {
    if (!file) return;
    setActionError(null);
    setUploadingField(field);
    try {
      const result = await uploadService.upload(file, "questionbank");
      if (field === "diagram") setDiagramUrl(result.url);
      else setVideoUrl(result.url);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Upload failed. You can still paste a URL.");
    } finally {
      setUploadingField(null);
      if (field === "diagram" && diagramUploadRef.current) diagramUploadRef.current.value = "";
      if (field === "video" && videoUploadRef.current) videoUploadRef.current.value = "";
    }
  };

  const openImportForPaper = (forPaper: QbPaper = activePaper) => {
    setImportResult(null);
    setActionError(null);
    setModal({ kind: "import", paper: forPaper });
  };

  const onImportFile = async (file: File | undefined) => {
    if (!file || modal?.kind !== "import") return;
    setActionError(null);
    setImportResult(null);
    try {
      const result = await importQuestions.mutateAsync({
        subtopicId,
        file,
        paper: modal.paper,
      });
      setImportResult(result);
      setActivePaper(modal.paper);
      void refetch();
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to import Excel");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSaveQuestion = async () => {
    if (modal?.kind !== "question") return;
    setActionError(null);
    try {
      const isMcq = questionKind === "MCQ";
      const options = isMcq
        ? optionHtmls.map((html) => serializeRichText(html)).filter((html) => !isRichTextEmpty(html))
        : [];
      if (isMcq && options.length < 2) {
        setActionError("MCQ needs at least 2 options.");
        return;
      }
      if (isRichTextEmpty(prompt)) {
        setActionError("Prompt is required.");
        return;
      }
      const expectedKind = kindForPaper(paper);
      if (questionKind !== expectedKind) {
        setActionError(
          expectedKind === "MCQ"
            ? "Paper 1 only accepts MCQ questions."
            : "Paper 2 and above only accept written questions."
        );
        return;
      }
      const parsedMarks = Number.parseInt(marks, 10);
      const parsedYear = yearHint.trim() ? Number.parseInt(yearHint.trim(), 10) : undefined;
      const questionType: QbQuestionType = isMcq ? "MULTIPLE_CHOICE" : "SHORT_ANSWER";
      const questionPayload = {
        prompt: serializeRichText(prompt),
        body: serializeRichText(bodyText) || undefined,
        options,
        correctAnswer: isMcq
          ? correctAnswer.trim().toUpperCase() || "A"
          : correctAnswer.trim() || "SEE_MARK_SCHEME",
        questionType,
        difficulty,
        paper,
        marks: Number.isFinite(parsedMarks) && parsedMarks >= 1 ? parsedMarks : 1,
        yearHint:
          parsedYear != null && Number.isFinite(parsedYear) && parsedYear >= 1900
            ? parsedYear
            : undefined,
        sourceLabel: sourceLabel.trim() || undefined,
        markScheme: serializeRichText(markScheme) || undefined,
        diagramUrl: diagramUrl.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
      };
      if (modal.editId) {
        await updateQuestion.mutateAsync({ id: modal.editId, payload: questionPayload });
      } else {
        await createQuestion.mutateAsync({
          subtopicId,
          number: Date.now() % 1000,
          ...questionPayload,
          calculatorAllowed: true,
        });
      }
      setModal(null);
      setActivePaper(paper);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save");
    }
  };

  if (!programId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-accent">Missing program. Open this study set from Questionbank.</p>
        <Button asChild variant="outline">
          <Link href={ROUTES.admin.questionbank}>Back to Questionbank</Link>
        </Button>
      </div>
    );
  }

  if (isLoading && topics.length === 0) {
    return <PageLoader label="Loading study set..." />;
  }

  if (error || !located) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Study set not found"}
        </p>
        <Button asChild variant="outline">
          <Link href={backHref}>Back to Questionbank</Link>
        </Button>
      </div>
    );
  }

  const { topic, sub } = located;
  const badge = normalizeAccessBadge(sub.badge);

  return (
    <>
      {actionError && !modal ? (
        <p className="mb-3 text-sm text-accent">{actionError}</p>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-5">
          <Link
            href={backHref}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to topics
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <PageHeader
                title={sub.title}
                description={`${topic.title}${programMeta ? ` · ${programMeta.program.name}` : ""}`}
                className="mb-0"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <AccessBadgePill badge={badge} />
                <span className="text-xs text-muted-foreground">
                  {questions.length} questions ·{" "}
                  {paperTabs.map((p, i) => (
                    <span key={p}>
                      {i > 0 ? " · " : ""}
                      P{p.replace("PAPER_", "")} {paperCounts[p] ?? 0}
                    </span>
                  ))}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {programMeta?.program.slug ? (
                <Button asChild size="sm" variant="outline">
                  <Link
                    href={ROUTES.subjectQuestionbankStudy(programMeta.program.slug, sub.slug)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Preview
                  </Link>
                </Button>
              ) : null}
              <Button type="button" size="sm" variant="outline" onClick={downloadExcelTemplate}>
                <FileSpreadsheet className="h-4 w-4" />
                Template
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={questions.length === 0}
                onClick={() => downloadStudySetQuestions(sub.title, questions)}
              >
                <Download className="h-4 w-4" />
                Download all
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={() => void handleAddPaper()}
              >
                <Plus className="h-4 w-4" />
                Add paper
              </Button>
            </div>
          </div>
        </div>

        <div className="border-b border-border px-5">
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Papers">
            {paperTabs.map((p) => {
              const active = activePaper === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActivePaper(p)}
                  className={cn(
                    "relative shrink-0 px-4 py-3 text-sm font-semibold transition",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {paperShortLabel(p)}
                  <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                    ({paperCounts[p] ?? 0})
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary transition",
                      active ? "opacity-100" : "opacity-0"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Managing <strong className="text-foreground">{paperShortLabel(activePaper)}</strong> —{" "}
              {activePaperIsMcq ? "MCQ only" : "Written only"} · {visibleQuestions.length} question
              {visibleQuestions.length === 1 ? "" : "s"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={visibleQuestions.length === 0}
                onClick={() =>
                  downloadStudySetQuestions(
                    `${sub.title} — ${paperShortLabel(activePaper)}`,
                    visibleQuestions
                  )
                }
              >
                <Download className="h-4 w-4" />
                Download {paperShortLabel(activePaper)}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => openImportForPaper(activePaper)}
              >
                <Upload className="h-4 w-4" />
                Upload {paperShortLabel(activePaper)}
              </Button>
              {activePaperIsMcq ? (
                <Button type="button" size="sm" onClick={() => openAddQuestion(activePaper)}>
                  <Plus className="h-4 w-4" />
                  Add MCQ
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={() => openAddQuestion(activePaper)}>
                  <Plus className="h-4 w-4" />
                  Add written
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-accent hover:text-accent"
                disabled={busy || paperTabs.length <= 1}
                onClick={() => void handleRemovePaper()}
              >
                <Trash2 className="h-4 w-4" />
                Delete paper
              </Button>
            </div>
          </div>

          {visibleQuestions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No {paperShortLabel(activePaper)} {activePaperIsMcq ? "MCQ" : "written"} questions
                yet.
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => openImportForPaper(activePaper)}>
                  <Upload className="h-4 w-4" />
                  Upload Excel
                </Button>
                <Button type="button" size="sm" onClick={() => openAddQuestion(activePaper)}>
                  <Plus className="h-4 w-4" />
                  {activePaperIsMcq ? "Add MCQ" : "Add written"}
                </Button>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {visibleQuestions.map((q, index) => (
                <AdminQuestionDropdown
                  key={q.id}
                  question={q}
                  displayNumber={index + 1}
                  onEdit={() => openEditQuestion(q)}
                  onToggleHide={() => toggleQuestionVisibility(q)}
                  togglePending={updateQuestion.isPending}
                  onDelete={() => {
                    if (window.confirm("Delete question?")) {
                      void deleteQuestion.mutateAsync(q.id);
                    }
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      <AdminModal
        open={Boolean(modal)}
        title={
          modal?.kind === "import"
            ? `Upload ${paperShortLabel(modal.paper)}`
            : modal?.kind === "question" && modal.editId
              ? "Edit question"
              : "Add question"
        }
        description={
          modal?.kind === "import"
            ? `Bulk-add questions to ${paperShortLabel(modal.paper)}. Use the Template button above for the Excel format. All rows import into this paper.`
            : "Questions appear on the student study page for this paper."
        }
        onClose={() => !busy && setModal(null)}
        className="sm:max-w-3xl"
        footer={
          modal?.kind === "import" ? (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => setModal(null)}>
                Close
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button type="button" disabled={busy} onClick={() => void onSaveQuestion()}>
                {busy ? "Saving…" : "Save"}
              </Button>
            </div>
          )
        }
      >
        {actionError ? <p className="mb-3 text-sm text-accent">{actionError}</p> : null}

        {modal?.kind === "import" ? (
          <div className="space-y-4">
            <Button type="button" variant="outline" size="sm" onClick={downloadExcelTemplate}>
              <FileSpreadsheet className="h-4 w-4" />
              Download template
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx,.csv"
              className="block w-full text-sm"
              onChange={(e) => void onImportFile(e.target.files?.[0])}
            />
            {importResult ? (
              <p className="text-sm text-muted-foreground">
                Imported {importResult.imported} · skipped {importResult.skipped}
                {importResult.errors?.length
                  ? ` · ${importResult.errors.length} error(s)`
                  : ""}
              </p>
            ) : null}
          </div>
        ) : null}

        {modal?.kind === "question" ? (
          <div className="space-y-4">
            <div
              className={cn(
                "rounded-xl border px-4 py-3",
                questionKind === "MCQ"
                  ? "border-primary/25 bg-primary-muted/40"
                  : "border-[#d4a017]/40 bg-[#fff8ef]"
              )}
            >
              <p className="text-sm font-bold text-foreground">
                {questionKind === "MCQ" ? "MCQ question" : "Written question"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {questionKind === "MCQ"
                  ? "Paper 1 only — written questions go on Paper 2 or Paper 3."
                  : "Paper 2 / Paper 3 only — MCQ questions go on Paper 1."}
              </p>
            </div>

            <div className="block space-y-1.5">
              <span className="text-sm font-semibold">Prompt</span>
              <RichTextEditor
                value={prompt}
                onChange={setPrompt}
                placeholder="Question stem — text, math, and diagrams…"
                minHeight="140px"
                disabled={busy}
              />
            </div>

            {questionKind === "WRITTEN" ? (
              <div className="block space-y-1.5">
                <span className="text-sm font-semibold">Body / parts (optional)</span>
                <RichTextEditor
                  value={bodyText}
                  onChange={setBodyText}
                  placeholder="(a) … [2]  (b) … [3]"
                  minHeight="160px"
                  disabled={busy}
                />
              </div>
            ) : null}

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
                <span className="text-sm font-semibold">Options (text and/or images)</span>
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
                  value={paper}
                  onChange={(e) => {
                    const next = e.target.value as QbPaper;
                    setPaper(next);
                    const nextKind = kindForPaper(next);
                    setQuestionKind(nextKind);
                    if (nextKind === "MCQ") {
                      if (!correctAnswer || correctAnswer.length > 1) setCorrectAnswer("A");
                    } else if (correctAnswer.length <= 1) {
                      setCorrectAnswer("");
                    }
                  }}
                  className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                >
                  {papersForKind(questionKind, [...new Set([...paperTabs, paper])]).map((p) => (
                    <option key={p} value={p}>
                      {paperShortLabel(p)}
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
        ) : null}
      </AdminModal>
    </>
  );
}
