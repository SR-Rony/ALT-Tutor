"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeDollarSign,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import {
  useAdminQuestionbank,
  useAdminSubjectsTree,
  useAddQbPaper,
  useDeleteQbQuestion,
  useImportQbQuestions,
  useRemoveQbPaper,
  useUpdateQbPaperConfig,
  useUpdateQbQuestion,
} from "@/hooks";
import { normalizeAccessBadge } from "@/lib/access-tier";
import { formatMoney } from "@/lib/format";
import { richTextToPlain } from "@/lib/rich-text";
import { studySetPrice } from "@/lib/study-set-pricing";
import type { ApiError } from "@/types";
import type { QbImportResult } from "@/services/questionbank-admin.types";
import type { QbPaper, QbPaperKind, QbQuestion } from "@/types/qb.types";
import { cn } from "@/utils";
import { AdminQbStudySetPricingModal } from "./admin-qb-study-set-pricing-modal";
import { QbQuestionFormModal } from "./qb-question-form-modal";
import {
  AccessBadgePill,
  AdminQuestionDropdown,
  countByPaper,
  downloadExcelTemplate,
  downloadStudySetQuestions,
  isMcqPaper,
  kindForPaper,
  paperKey,
  paperShortLabel,
  parsePaperNumber,
  questionsForPaper,
  resolvePaperConfig,
  resolvePaperTabs,
} from "./qb-admin-shared";

type Props = { subtopicId: string };

export function AdminQbStudySetPage({ subtopicId }: Props) {
  const searchParams = useSearchParams();
  const programId = searchParams.get("programId") ?? "";
  const { data: subjectsTree = [] } = useAdminSubjectsTree();
  const { data: topics = [], isLoading, error, refetch } = useAdminQuestionbank(
    programId || undefined
  );

  const updateQuestion = useUpdateQbQuestion();
  const deleteQuestion = useDeleteQbQuestion();
  const importQuestions = useImportQbQuestions();
  const addPaperMutation = useAddQbPaper();
  const updatePaperConfigMutation = useUpdateQbPaperConfig();
  const removePaperMutation = useRemoveQbPaper();
  const [pricingOpen, setPricingOpen] = useState(false);

  const [activePaper, setActivePaper] = useState<QbPaper>("PAPER_1");
  const [questionForm, setQuestionForm] = useState<
    null | { paper: QbPaper; question?: QbQuestion }
  >(null);
  const [modal, setModal] = useState<
    | null
    | { kind: "import"; paper: QbPaper }
    | { kind: "addPaper" }
    | { kind: "editPaper"; paper: QbPaper }
  >(null);
  const [importResult, setImportResult] = useState<QbImportResult | null>(null);
  const [newPaperLabel, setNewPaperLabel] = useState("");
  const [newPaperKind, setNewPaperKind] = useState<QbPaperKind>("MCQ");
  const [editPaperLabel, setEditPaperLabel] = useState("");
  const [editPaperKind, setEditPaperKind] = useState<QbPaperKind>("MCQ");
  const [actionError, setActionError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const paperConfig = useMemo(
    () => resolvePaperConfig(located?.sub.paperCount, located?.sub.paperConfig),
    [located?.sub.paperCount, located?.sub.paperConfig]
  );
  const paperTabs = resolvePaperTabs(located?.sub.paperCount, questions);
  const paperCounts = countByPaper(questions);
  const visibleQuestions = questionsForPaper(questions, activePaper);
  const nextPaperNumber = useMemo(() => {
    const fromQuestions = questions.reduce(
      (max, q) => Math.max(max, parsePaperNumber(String(q.paper))),
      0
    );
    return Math.max(located?.sub.paperCount ?? 3, fromQuestions, paperTabs.length) + 1;
  }, [located?.sub.paperCount, paperTabs.length, questions]);

  const busy =
    deleteQuestion.isPending ||
    importQuestions.isPending ||
    addPaperMutation.isPending ||
    updatePaperConfigMutation.isPending ||
    removePaperMutation.isPending;

  const backHref = programId
    ? `${ROUTES.admin.questionbank}?programId=${encodeURIComponent(programId)}`
    : ROUTES.admin.questionbank;

  const openAddQuestion = (forPaper: QbPaper = activePaper) => {
    setActionError(null);
    setQuestionForm({ paper: forPaper });
  };

  const activePaperIsMcq = isMcqPaper(activePaper, paperConfig);

  const openAddPaperModal = () => {
    setActionError(null);
    setNewPaperLabel("");
    setNewPaperKind("MCQ");
    setModal({ kind: "addPaper" });
  };

  const submitAddPaper = async () => {
    if (modal?.kind !== "addPaper") return;
    const label = newPaperLabel.trim();
    if (!label) {
      setActionError("Paper name is required.");
      return;
    }
    setActionError(null);
    try {
      const updated = await addPaperMutation.mutateAsync({
        subtopicId,
        payload: { label, questionKind: newPaperKind },
      });
      const nextPaper = paperKey(updated.paperCount ?? nextPaperNumber);
      setActivePaper(nextPaper);
      setModal(null);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Could not add paper");
    }
  };

  const openEditPaperModal = (paper: QbPaper = activePaper) => {
    setActionError(null);
    setActivePaper(paper);
    setEditPaperLabel(paperShortLabel(paper, paperConfig));
    setEditPaperKind(kindForPaper(paper, paperConfig));
    setModal({ kind: "editPaper", paper });
  };

  const submitEditPaper = async () => {
    if (modal?.kind !== "editPaper") return;
    const label = editPaperLabel.trim();
    if (!label) {
      setActionError("Paper name is required.");
      return;
    }
    setActionError(null);
    try {
      await updatePaperConfigMutation.mutateAsync({
        subtopicId,
        paper: modal.paper,
        payload: { label, questionKind: editPaperKind },
      });
      setModal(null);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Could not update paper settings");
    }
  };

  const handleRemovePaper = async () => {
    if (paperTabs.length <= 1) return;
    const count = paperCounts[activePaper] ?? 0;
    const label = paperShortLabel(activePaper, paperConfig);
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
    setQuestionForm({ paper: (question.paper as QbPaper) || "PAPER_1", question });
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
                title={richTextToPlain(sub.title) || sub.title}
                description={`${richTextToPlain(topic.title) || topic.title}${programMeta ? ` · ${programMeta.program.name}` : ""}`}
                className="mb-0"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <AccessBadgePill badge={badge} />
                {badge !== "FREE" ? (
                  <button
                    type="button"
                    onClick={() => setPricingOpen(true)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold transition",
                      studySetPrice(sub) != null
                        ? "border-[#d4a017]/50 bg-[#fffbeb] text-[#92400e] hover:bg-[#fef3c7]"
                        : "border-accent/40 text-accent hover:bg-accent/5"
                    )}
                  >
                    <BadgeDollarSign className="h-3.5 w-3.5" />
                    {studySetPrice(sub) != null
                      ? `${formatMoney(studySetPrice(sub)!)} · Pricing & access`
                      : "Set price"}
                  </button>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  {questions.length} questions ·{" "}
                  {paperTabs.map((p, i) => (
                    <span key={p}>
                      {i > 0 ? " · " : ""}
                      {paperShortLabel(p, paperConfig)} {paperCounts[p] ?? 0}
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
                onClick={openAddPaperModal}
              >
                <Plus className="h-4 w-4" />
                Add paper
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-border px-5">
          <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto" role="tablist" aria-label="Papers">
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
                  {paperShortLabel(p, paperConfig)}
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
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => openEditPaperModal(activePaper)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit paper
          </Button>
        </div>

        <div className="space-y-3 px-5 py-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Managing <strong className="text-foreground">{paperShortLabel(activePaper, paperConfig)}</strong> —{" "}
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
                    `${sub.title} — ${paperShortLabel(activePaper, paperConfig)}`,
                    visibleQuestions
                  )
                }
              >
                <Download className="h-4 w-4" />
                Download {paperShortLabel(activePaper, paperConfig)}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => openImportForPaper(activePaper)}
              >
                <Upload className="h-4 w-4" />
                Upload {paperShortLabel(activePaper, paperConfig)}
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
                No {paperShortLabel(activePaper, paperConfig)} {activePaperIsMcq ? "MCQ" : "written"} questions
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
                  paperLabel={paperShortLabel(String(q.paper), paperConfig)}
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
            ? `Upload ${paperShortLabel(modal.paper, paperConfig)}`
            : modal?.kind === "addPaper"
              ? "Add paper"
              : "Edit paper"
        }
        description={
          modal?.kind === "import"
            ? `Bulk-add questions to ${paperShortLabel(modal.paper, paperConfig)}. Use the Template button above for the Excel format. All rows import into this paper.`
            : modal?.kind === "addPaper"
              ? "Choose a custom paper name and whether students see MCQ or written questions in this paper."
              : "Change the paper name or switch between MCQ and written questions."
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
          ) : modal?.kind === "addPaper" ? (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button type="button" disabled={busy} onClick={() => void submitAddPaper()}>
                {busy ? "Adding…" : "Add paper"}
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button type="button" disabled={busy} onClick={() => void submitEditPaper()}>
                {busy ? "Saving…" : "Save changes"}
              </Button>
            </div>
          )
        }
      >
        {actionError ? <p className="mb-3 text-sm text-accent">{actionError}</p> : null}

        {modal?.kind === "addPaper" ? (
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Paper name</span>
              <Input
                value={newPaperLabel}
                onChange={(e) => setNewPaperLabel(e.target.value)}
                placeholder="e.g. Mock Exam, Section A, Chapter Test…"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This name appears on tabs and downloads — use any label you want.
              </p>
            </label>
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">Question type</legend>
              <div className="flex flex-wrap gap-2">
                {(["MCQ", "WRITTEN"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setNewPaperKind(kind)}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                      newPaperKind === kind
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                    )}
                  >
                    {kind === "MCQ" ? "MCQ questions" : "Written questions"}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        ) : null}

        {modal?.kind === "editPaper" ? (
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Paper name</span>
              <Input
                value={editPaperLabel}
                onChange={(e) => setEditPaperLabel(e.target.value)}
                placeholder="Custom paper name"
                autoFocus
              />
            </label>
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">Question type</legend>
              <div className="flex flex-wrap gap-2">
                {(["MCQ", "WRITTEN"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setEditPaperKind(kind)}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                      editPaperKind === kind
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground hover:border-primary/40"
                    )}
                  >
                    {kind === "MCQ" ? "MCQ questions" : "Written questions"}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        ) : null}

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

      </AdminModal>

      <QbQuestionFormModal
        open={questionForm !== null}
        onClose={() => setQuestionForm(null)}
        subtopicId={subtopicId}
        paperConfig={paperConfig}
        paperTabs={paperTabs}
        initialPaper={questionForm?.paper}
        question={questionForm?.question ?? null}
        onSaved={(saved) => setActivePaper(saved.paper)}
      />

      <AdminQbStudySetPricingModal
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        subtopic={sub}
        displayTitle={richTextToPlain(sub.title) || sub.title}
      />
    </>
  );
}
