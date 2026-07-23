"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Eye, EyeOff, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import {
  useAdminPastPapers,
  useAdminQuestionbank,
  useAdminSubjectsTree,
  useCreatePastPaper,
  useDeletePastPaper,
  useUpdatePastPaper,
} from "@/hooks";
import { normalizeAccessBadge, tierLabel } from "@/lib/access-tier";
import { slugify } from "@/lib/slugify";
import type { ApiError } from "@/types";
import type { PastPaper, PastPaperSourceType } from "@/types/past-paper.types";
import type { QbAccessBadge } from "@/types/qb.types";
import { cn } from "@/utils";

type WizardStep = 0 | 1 | 2;

const STEPS = ["Basics", "Fixed questions", "Preview & publish"] as const;
const SOURCE_TYPES: PastPaperSourceType[] = ["INTERACTIVE", "PDF", "HYBRID"];
const TIERS: QbAccessBadge[] = ["FREE", "SILVER", "GOLD", "DIAMOND"];
const PAPER_CODES = ["P1", "P2"];

function sourceLabel(type: PastPaperSourceType) {
  if (type === "PDF") return "PDF";
  if (type === "HYBRID") return "Hybrid";
  return "Interactive";
}

export function AdminPastPapersPage() {
  const { data: subjectsTree = [] } = useAdminSubjectsTree();
  const [categoryId, setCategoryId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [programId, setProgramId] = useState("");

  const effectiveCategoryId = categoryId || subjectsTree[0]?.id || "";
  const subjects = useMemo(() => {
    return subjectsTree.find((c) => c.id === effectiveCategoryId)?.subjects ?? [];
  }, [subjectsTree, effectiveCategoryId]);
  const effectiveSubjectId = subjectId || subjects[0]?.id || "";
  const programs = useMemo(() => {
    return subjects.find((s) => s.id === effectiveSubjectId)?.programs ?? [];
  }, [subjects, effectiveSubjectId]);
  const effectiveProgramId = programId || programs[0]?.id || "";
  const selectedProgram = programs.find((p) => p.id === effectiveProgramId);

  const { data, isLoading, error, refetch, isFetching } = useAdminPastPapers(
    effectiveProgramId || undefined
  );
  const { data: qbTopics = [] } = useAdminQuestionbank(effectiveProgramId || undefined);
  const createPaper = useCreatePastPaper();
  const updatePaper = useUpdatePastPaper();
  const deletePaper = useDeletePastPaper();

  const papers = data?.papers ?? [];

  const qbQuestions = useMemo(() => {
    return qbTopics.flatMap((topic) =>
      (topic.subtopics ?? []).flatMap((sub) =>
        (sub.questions ?? []).map((q) => ({
          ...q,
          subtopicTitle: sub.title,
          topicTitle: topic.title,
        }))
      )
    );
  }, [qbTopics]);

  const papersByYear = useMemo(() => {
    const map = new Map<number, PastPaper[]>();
    for (const paper of papers) {
      if (!map.has(paper.year)) map.set(paper.year, []);
      map.get(paper.year)!.push(paper);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [papers]);

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [editMeta, setEditMeta] = useState<{ isPublished: boolean; attemptCount: number }>({
    isPublished: false,
    attemptCount: 0,
  });
  const [initialQuestionIds, setInitialQuestionIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const [year, setYear] = useState(String(new Date().getFullYear() - 1));
  const [session, setSession] = useState("Annual");
  const [paperCode, setPaperCode] = useState("P1");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [durationMin, setDurationMin] = useState("60");
  const [sourceType, setSourceType] = useState<PastPaperSourceType>("INTERACTIVE");
  const [pdfUrl, setPdfUrl] = useState("");
  const [accessTier, setAccessTier] = useState<QbAccessBadge>("FREE");
  const [sectionTitle, setSectionTitle] = useState("Section A");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);

  const busy = createPaper.isPending || updatePaper.isPending || deletePaper.isPending;
  const questionsChanged =
    editId &&
    (selectedQuestionIds.length !== initialQuestionIds.length ||
      selectedQuestionIds.some((id, i) => id !== initialQuestionIds[i]));

  useEffect(() => {
    if (!modalOpen || editId) return;
    if (!title.trim()) return;
    setSlug(slugify(title));
  }, [title, modalOpen, editId]);

  const resetForm = () => {
    setStep(0);
    setEditId(null);
    setEditMeta({ isPublished: false, attemptCount: 0 });
    setInitialQuestionIds([]);
    setYear(String(new Date().getFullYear() - 1));
    setSession("Annual");
    setPaperCode("P1");
    setTitle("");
    setSlug("");
    setDescription("");
    setDurationMin("60");
    setSourceType("INTERACTIVE");
    setPdfUrl("");
    setAccessTier("FREE");
    setSectionTitle("Section A");
    setSelectedQuestionIds([]);
    setIsPublished(false);
    setActionError(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (item: PastPaper) => {
    const orderedIds =
      item.sections
        ?.slice()
        .sort((a, b) => a.order - b.order)
        .flatMap((section) =>
          [...(section.items ?? [])]
            .sort((a, b) => a.order - b.order)
            .map((i) => i.questionId)
        ) ?? [];

    setEditId(item.id);
    setEditMeta({
      isPublished: Boolean(item.isPublished),
      attemptCount: item.attemptCount ?? 0,
    });
    setInitialQuestionIds(orderedIds);
    setStep(0);
    setYear(String(item.year));
    setSession(item.session);
    setPaperCode(item.paperCode);
    setTitle(item.title);
    setSlug(item.slug);
    setDescription(item.description ?? "");
    setDurationMin(String(item.durationMin));
    setSourceType(item.sourceType);
    setPdfUrl(item.pdfUrl ?? "");
    setAccessTier(normalizeAccessBadge(item.accessTier));
    setSectionTitle(item.sections?.[0]?.title ?? "Section A");
    setSelectedQuestionIds(orderedIds);
    setIsPublished(Boolean(item.isPublished));
    setActionError(null);
    setModalOpen(true);
  };

  const toggleQuestion = (questionId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const validateStep = (current: WizardStep): string | null => {
    if (current === 0) {
      if (!title.trim() || !slug.trim()) return "Title and slug are required";
      if (!year.trim() || Number.parseInt(year, 10) < 1990) return "Enter a valid year";
      if (!session.trim() || !paperCode.trim()) return "Session and paper code are required";
      if (!Number.parseInt(durationMin, 10) || Number.parseInt(durationMin, 10) < 1) {
        return "Duration must be at least 1 minute";
      }
    }
    if (current === 1) {
      if (selectedQuestionIds.length < 1) return "Select at least one question";
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      setActionError(err);
      return;
    }
    setActionError(null);
    setStep((s) => Math.min(2, s + 1) as WizardStep);
  };

  const onSave = async () => {
    for (const s of [0, 1] as WizardStep[]) {
      const err = validateStep(s);
      if (err) {
        setStep(s);
        setActionError(err);
        return;
      }
    }
    if (!effectiveProgramId) {
      setActionError("Select a program first");
      return;
    }

    if (
      editId &&
      editMeta.isPublished &&
      (editMeta.attemptCount > 0 || questionsChanged) &&
      !window.confirm(
        "This paper is published and may have student attempts. Changing the fixed question set can break score consistency for past attempts. Continue?"
      )
    ) {
      return;
    }

    setActionError(null);
    const sections = [
      {
        title: sectionTitle.trim() || "Section A",
        code: "A",
        order: 0,
        items: selectedQuestionIds.map((questionId, order) => ({ questionId, order })),
      },
    ];

    const payload = {
      year: Number.parseInt(year, 10),
      session: session.trim(),
      paperCode: paperCode.trim(),
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      durationMin: Number.parseInt(durationMin, 10),
      sourceType,
      pdfUrl: pdfUrl.trim() || undefined,
      accessTier,
      isPublished,
      sections,
    };

    try {
      if (editId) {
        await updatePaper.mutateAsync({ id: editId, payload });
      } else {
        await createPaper.mutateAsync({ programId: effectiveProgramId, ...payload });
      }
      setModalOpen(false);
      resetForm();
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save past paper");
    }
  };

  if (isLoading && papers.length === 0 && programs.length > 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Past Papers"
          description="Year/session archive with fixed Questionbank sets."
          className="mb-0"
        />
        <PageLoader label="Loading past papers..." />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="Past Papers"
              description="Archive by year and session. Each paper uses a fixed ordered QB set — student attempts snapshot it."
              className="mb-0"
            />
            <div className="flex flex-wrap gap-2">
              <AdminIconAction
                label="Refresh"
                icon={RefreshCw}
                tone="primary"
                disabled={isFetching}
                onClick={() => void refetch()}
                className={isFetching ? "animate-spin" : undefined}
              />
              <Button
                type="button"
                size="sm"
                disabled={!effectiveProgramId || qbQuestions.length === 0}
                onClick={openCreate}
              >
                <Plus className="h-4 w-4" />
                New paper
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Category
              </span>
              <select
                value={effectiveCategoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubjectId("");
                  setProgramId("");
                }}
                className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                {subjectsTree.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Subject
              </span>
              <select
                value={effectiveSubjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setProgramId("");
                }}
                className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Program
              </span>
              <select
                value={effectiveProgramId}
                onChange={(e) => setProgramId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <p className="mt-2 text-sm text-accent">
              {(error as unknown as ApiError)?.message}
            </p>
          ) : null}
          {selectedProgram ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Student hub:{" "}
              <Link
                href={ROUTES.subjectResource(selectedProgram.slug, "past-papers")}
                className="font-semibold text-primary hover:underline"
                target="_blank"
              >
                /subjects/{selectedProgram.slug}/past-papers
              </Link>
            </p>
          ) : null}
        </div>

        <div className="space-y-6 p-5">
          {papers.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No past papers yet. Create one with the year/session wizard.
            </p>
          ) : null}

          {papersByYear.map(([yr, yearPapers]) => (
            <div key={yr}>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                {yr}
              </h3>
              <div className="space-y-3">
                {yearPapers.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3",
                      !item.isActive && "border-dashed opacity-70"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <span className="rounded-md bg-primary-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                          {item.paperCode}
                        </span>
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                          {sourceLabel(item.sourceType)}
                        </span>
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                          {tierLabel(normalizeAccessBadge(item.accessTier))}
                        </span>
                        {item.isPublished ? (
                          <span className="rounded-md bg-[#ecfdf3] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--accent-green)]">
                            Published
                          </span>
                        ) : (
                          <span className="rounded-md bg-[#fff8ef] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#9a3412]">
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.session} · {item.totalQuestions}Q · {item.totalMarks} marks ·{" "}
                        {item.durationMin} min · {item.slug}
                        {(item.attemptCount ?? 0) > 0
                          ? ` · ${item.attemptCount} attempt(s)`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded-md p-2 text-muted-foreground hover:bg-primary-muted hover:text-primary"
                        title="Edit"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                        title={item.isPublished ? "Unpublish" : "Publish"}
                        disabled={busy}
                        onClick={() =>
                          void updatePaper.mutateAsync({
                            id: item.id,
                            payload: { isPublished: !item.isPublished },
                          })
                        }
                      >
                        {item.isPublished ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-accent" />
                        )}
                      </button>
                      <button
                        type="button"
                        className="rounded-md p-2 text-accent hover:bg-[#fff1ee]"
                        title="Delete"
                        onClick={() => {
                          const msg =
                            (item.attemptCount ?? 0) > 0
                              ? `"${item.title}" has ${item.attemptCount} student attempt(s). Delete anyway?`
                              : `Delete "${item.title}"?`;
                          if (window.confirm(msg)) void deletePaper.mutateAsync(item.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AdminModal
        open={modalOpen}
        title={editId ? "Edit past paper" : "New past paper"}
        description={`Step ${step + 1} of 3 — ${STEPS[step]}`}
        onClose={() => !busy && setModalOpen(false)}
        className="sm:max-w-2xl"
        footer={
          <div className="flex flex-wrap justify-between gap-2">
            <div className="flex gap-2">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setStep((s) => Math.max(0, s - 1) as WizardStep)}
                >
                  Back
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              {step < 2 ? (
                <Button type="button" disabled={busy} onClick={goNext}>
                  Next
                </Button>
              ) : (
                <Button type="button" disabled={busy} onClick={() => void onSave()}>
                  {busy ? "Saving…" : editId ? "Save paper" : "Create paper"}
                </Button>
              )}
            </div>
          </div>
        }
      >
        {actionError ? (
          <p className="mb-3 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            {actionError}
          </p>
        ) : null}

        {editId && editMeta.isPublished && (editMeta.attemptCount > 0 || questionsChanged) ? (
          <div className="mb-3 flex gap-2 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              Published archive — student attempts use a frozen snapshot. Changing the fixed
              question set affects consistency for existing attempts.
            </p>
          </div>
        ) : null}

        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {step === 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Year</span>
                <Input type="number" min={1990} value={year} onChange={(e) => setYear(e.target.value)} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Session</span>
                <Input value={session} onChange={(e) => setSession(e.target.value)} placeholder="Annual" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Paper code</span>
                <select
                  value={paperCode}
                  onChange={(e) => setPaperCode(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                >
                  {PAPER_CODES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Duration (minutes)</span>
                <Input
                  type="number"
                  min={1}
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-sm font-semibold">Title</span>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Slug</span>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Access tier</span>
                <select
                  value={accessTier}
                  onChange={(e) => setAccessTier(e.target.value as QbAccessBadge)}
                  className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                >
                  {TIERS.map((t) => (
                    <option key={t} value={t}>
                      {tierLabel(t)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Source type</span>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value as PastPaperSourceType)}
                  className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                >
                  {SOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {sourceLabel(t)}
                    </option>
                  ))}
                </select>
              </label>
              {(sourceType === "PDF" || sourceType === "HYBRID") && (
                <label className="block space-y-1.5 sm:col-span-2">
                  <span className="text-sm font-semibold">PDF URL (optional)</span>
                  <Input value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://…" />
                </label>
              )}
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-sm font-semibold">Description</span>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short archive note for students"
                />
              </label>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Section title</span>
                <Input
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="Section A"
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Select questions in the order they should appear on the paper ({selectedQuestionIds.length}{" "}
                selected).
              </p>
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border p-3">
                {qbQuestions.map((q) => {
                  const checked = selectedQuestionIds.includes(q.id);
                  const order = selectedQuestionIds.indexOf(q.id);
                  return (
                    <label
                      key={q.id}
                      className={cn(
                        "flex cursor-pointer gap-2 rounded-lg border px-3 py-2 text-sm",
                        checked ? "border-primary bg-primary-muted/40" : "border-border"
                      )}
                    >
                      <input
                        type="checkbox"
                        className="mt-1 accent-primary"
                        checked={checked}
                        onChange={() => toggleQuestion(q.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="font-semibold text-foreground">
                          {checked ? `#${order + 1} · ` : ""}
                          Q{q.number}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          ({q.subtopicTitle}) · {q.marks} mark{q.marks === 1 ? "" : "s"}
                        </span>
                        <span className="mt-0.5 block truncate text-foreground">{q.prompt}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3 text-sm">
              <p>
                <strong>{title || "Untitled"}</strong> · {year} {session} {paperCode}
              </p>
              <p className="text-muted-foreground">
                {selectedQuestionIds.length} fixed questions · {durationMin} min ·{" "}
                {tierLabel(accessTier)} · {sourceLabel(sourceType)}
              </p>
              <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                Students will always see this exact question order. Attempts store an immutable
                snapshot — live QB edits will not change past scores.
              </p>
              <label className="flex items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
                Publish now (visible on student Past Papers archive)
              </label>
            </div>
          ) : null}
        </div>
      </AdminModal>
    </>
  );
}
