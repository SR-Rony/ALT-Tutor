"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import {
  useAdminPracticeExams,
  useAdminQuestionbank,
  useAdminSubjectsTree,
  useCreatePracticeExamTemplate,
  useDeletePracticeExamTemplate,
  useUpdatePracticeExamTemplate,
} from "@/hooks";
import { normalizeAccessBadge, tierLabel } from "@/lib/access-tier";
import { slugify } from "@/lib/slugify";
import type { ApiError } from "@/types";
import type {
  PracticeExamBlueprintRule,
  PracticeExamTemplate,
  PracticeExamType,
} from "@/types/practice-exam.types";
import type { QbAccessBadge, QbDifficulty } from "@/types/qb.types";
import { cn } from "@/utils";
import Link from "next/link";

type WizardStep = 0 | 1 | 2 | 3;

const STEPS = ["Basics", "Blueprint", "Preview", "Publish"] as const;
const EXAM_TYPES: PracticeExamType[] = ["TOPIC_QUIZ", "MOCK", "LADDER"];
const DIFFICULTIES: Array<QbDifficulty | ""> = ["", "EASY", "MEDIUM", "HARD"];
const TIERS: QbAccessBadge[] = ["FREE", "SILVER", "GOLD", "DIAMOND"];

function typeLabel(type: PracticeExamType) {
  if (type === "MOCK") return "Mock Exam";
  if (type === "LADDER") return "Revision Ladder";
  return "Topic Quiz";
}

function emptyRule(): PracticeExamBlueprintRule {
  return { count: 1 };
}

export function AdminPracticeExamsPage() {
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

  const { data, isLoading, error, refetch, isFetching } = useAdminPracticeExams(
    effectiveProgramId || undefined
  );
  const { data: qbTopics = [] } = useAdminQuestionbank(effectiveProgramId || undefined);
  const createTemplate = useCreatePracticeExamTemplate();
  const updateTemplate = useUpdatePracticeExamTemplate();
  const deleteTemplate = useDeletePracticeExamTemplate();

  const templates = data?.templates ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PracticeExamType>("TOPIC_QUIZ");
  const [durationMin, setDurationMin] = useState("30");
  const [totalQuestions, setTotalQuestions] = useState("10");
  const [passMarkPercent, setPassMarkPercent] = useState("50");
  const [accessTier, setAccessTier] = useState<QbAccessBadge>("FREE");
  const [blueprint, setBlueprint] = useState<PracticeExamBlueprintRule[]>([emptyRule()]);
  const [isPublished, setIsPublished] = useState(false);

  const busy =
    createTemplate.isPending || updateTemplate.isPending || deleteTemplate.isPending;
  const blueprintSum = blueprint.reduce((n, rule) => n + (Number(rule.count) || 0), 0);
  const totalQ = Number.parseInt(totalQuestions, 10) || 0;

  useEffect(() => {
    if (!modalOpen || editId) return;
    if (!title.trim()) return;
    setSlug(slugify(title));
  }, [title, modalOpen, editId]);

  const resetForm = () => {
    setStep(0);
    setEditId(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setType("TOPIC_QUIZ");
    setDurationMin("30");
    setTotalQuestions("10");
    setPassMarkPercent("50");
    setAccessTier("FREE");
    setBlueprint([emptyRule()]);
    setIsPublished(false);
    setActionError(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (item: PracticeExamTemplate) => {
    setEditId(item.id);
    setStep(0);
    setTitle(item.title);
    setSlug(item.slug);
    setDescription(item.description ?? "");
    setType(item.type);
    setDurationMin(String(item.durationMin));
    setTotalQuestions(String(item.totalQuestions));
    setPassMarkPercent(
      item.passMarkPercent != null ? String(item.passMarkPercent) : ""
    );
    setAccessTier(normalizeAccessBadge(item.accessTier));
    setBlueprint(item.blueprint?.length ? item.blueprint : [emptyRule()]);
    setIsPublished(item.isPublished);
    setActionError(null);
    setModalOpen(true);
  };

  const validateStep = (current: WizardStep): string | null => {
    if (current === 0) {
      if (!title.trim() || !slug.trim()) return "Title and slug are required";
      if (!Number.parseInt(durationMin, 10) || Number.parseInt(durationMin, 10) < 1) {
        return "Duration must be at least 1 minute";
      }
      if (!totalQ || totalQ < 1) return "Total questions must be at least 1";
    }
    if (current === 1) {
      if (!blueprint.length) return "Add at least one blueprint rule";
      if (blueprint.some((r) => !r.count || r.count < 1)) {
        return "Each blueprint rule needs count ≥ 1";
      }
      if (blueprintSum !== totalQ) {
        return `Blueprint sum (${blueprintSum}) must equal total questions (${totalQ})`;
      }
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
    setStep((s) => Math.min(3, s + 1) as WizardStep);
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
    setActionError(null);
    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      type,
      durationMin: Number.parseInt(durationMin, 10),
      totalQuestions: totalQ,
      passMarkPercent: passMarkPercent.trim()
        ? Number.parseInt(passMarkPercent, 10)
        : undefined,
      blueprint: blueprint.map((rule) => ({
        ...(rule.topicId ? { topicId: rule.topicId } : {}),
        ...(rule.subtopicId ? { subtopicId: rule.subtopicId } : {}),
        ...(rule.difficulty ? { difficulty: rule.difficulty } : {}),
        count: Number(rule.count),
      })),
      accessTier,
      isPublished,
    };
    try {
      if (editId) {
        await updateTemplate.mutateAsync({ id: editId, payload });
      } else {
        await createTemplate.mutateAsync({
          programId: effectiveProgramId,
          ...payload,
        });
      }
      setModalOpen(false);
      resetForm();
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save template");
    }
  };

  const updateRule = (index: number, patch: Partial<PracticeExamBlueprintRule>) => {
    setBlueprint((prev) =>
      prev.map((rule, i) => (i === index ? { ...rule, ...patch } : rule))
    );
  };

  if (isLoading && templates.length === 0 && programs.length > 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Practice Exams"
          description="Create timed templates that pull questions from the Questionbank."
          className="mb-0"
        />
        <PageLoader label="Loading practice exams..." />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="Practice Exams"
              description="Wizard: Basics → Blueprint → Preview → Publish. Questions come from the Questionbank pool."
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
              <Button type="button" size="sm" disabled={!effectiveProgramId} onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New template
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
                href={ROUTES.subjectResource(selectedProgram.slug, "practice-exams")}
                className="font-semibold text-primary hover:underline"
                target="_blank"
              >
                /subjects/{selectedProgram.slug}/practice-exams
              </Link>
            </p>
          ) : null}
        </div>

        <div className="space-y-3 p-5">
          {templates.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No practice exam templates yet. Create one with the wizard.
            </p>
          ) : null}
          {templates.map((item) => (
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
                    {typeLabel(item.type)}
                  </span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                    {tierLabel(item.accessTier)}
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
                  {item.totalQuestions}Q · {item.durationMin} min
                  {item.passMarkPercent != null ? ` · pass ${item.passMarkPercent}%` : ""} ·{" "}
                  {item.slug}
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
                    void updateTemplate.mutateAsync({
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
                    if (window.confirm(`Delete "${item.title}"?`)) {
                      void deleteTemplate.mutateAsync(item.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AdminModal
        open={modalOpen}
        title={editId ? "Edit practice exam" : "New practice exam"}
        description={`${STEPS[step]} (${step + 1}/${STEPS.length})`}
        onClose={() => !busy && setModalOpen(false)}
        className="sm:max-w-2xl"
        footer={
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy || step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1) as WizardStep)}
            >
              Back
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              {step < 3 ? (
                <Button type="button" disabled={busy} onClick={goNext}>
                  Next
                </Button>
              ) : (
                <Button type="button" disabled={busy} onClick={() => void onSave()}>
                  {busy ? "Saving…" : editId ? "Save template" : "Create template"}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {STEPS.map((label, index) => (
            <span
              key={label}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                index === step
                  ? "bg-primary text-primary-foreground"
                  : index < step
                    ? "bg-primary-muted text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}. {label}
            </span>
          ))}
        </div>

        {actionError ? (
          <p className="mb-3 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            {actionError}
          </p>
        ) : null}

        {step === 0 ? (
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Title</span>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Slug</span>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Type</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PracticeExamType)}
                  className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                >
                  {EXAM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {typeLabel(t)}
                    </option>
                  ))}
                </select>
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
                <span className="text-sm font-semibold">Duration (minutes)</span>
                <Input
                  type="number"
                  min={1}
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Total questions</span>
                <Input
                  type="number"
                  min={1}
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(e.target.value)}
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-sm font-semibold">Pass mark % (optional)</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={passMarkPercent}
                  onChange={(e) => setPassMarkPercent(e.target.value)}
                  placeholder="e.g. 50"
                />
              </label>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Blueprint sum:{" "}
              <strong className={blueprintSum === totalQ ? "text-foreground" : "text-accent"}>
                {blueprintSum}
              </strong>{" "}
              / {totalQ} required
            </p>
            {blueprint.map((rule, index) => {
              const topic = qbTopics.find((t) => t.id === rule.topicId);
              const subtopics = topic?.subtopics ?? [];
              return (
                <div key={index} className="space-y-2 rounded-xl border border-border p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        Topic
                      </span>
                      <select
                        value={rule.topicId ?? ""}
                        onChange={(e) =>
                          updateRule(index, {
                            topicId: e.target.value || undefined,
                            subtopicId: undefined,
                          })
                        }
                        className="flex h-9 w-full rounded-lg border border-border bg-card px-2 text-sm"
                      >
                        <option value="">Any topic</option>
                        {qbTopics.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        Subtopic
                      </span>
                      <select
                        value={rule.subtopicId ?? ""}
                        onChange={(e) =>
                          updateRule(index, {
                            subtopicId: e.target.value || undefined,
                          })
                        }
                        className="flex h-9 w-full rounded-lg border border-border bg-card px-2 text-sm"
                      >
                        <option value="">Any subtopic</option>
                        {subtopics.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        Difficulty
                      </span>
                      <select
                        value={rule.difficulty ?? ""}
                        onChange={(e) =>
                          updateRule(index, {
                            difficulty: (e.target.value || undefined) as QbDifficulty | undefined,
                          })
                        }
                        className="flex h-9 w-full rounded-lg border border-border bg-card px-2 text-sm"
                      >
                        {DIFFICULTIES.map((d) => (
                          <option key={d || "any"} value={d}>
                            {d || "Any"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold uppercase text-muted-foreground">
                        Count
                      </span>
                      <Input
                        type="number"
                        min={1}
                        value={rule.count}
                        onChange={(e) =>
                          updateRule(index, {
                            count: Number.parseInt(e.target.value, 10) || 1,
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-accent"
                      disabled={blueprint.length <= 1}
                      onClick={() =>
                        setBlueprint((prev) => prev.filter((_, i) => i !== index))
                      }
                    >
                      Remove rule
                    </Button>
                  </div>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBlueprint((prev) => [...prev, emptyRule()])}
            >
              <Plus className="h-4 w-4" />
              Add rule
            </Button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4 text-sm">
            <p>
              <strong>{title}</strong> ({typeLabel(type)})
            </p>
            <p className="text-muted-foreground">{description || "No description"}</p>
            <p>
              {totalQ} questions · {durationMin} min · {tierLabel(accessTier)}
              {passMarkPercent ? ` · pass ${passMarkPercent}%` : ""}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              {blueprint.map((rule, index) => {
                const topic = qbTopics.find((t) => t.id === rule.topicId);
                const sub = topic?.subtopics.find((s) => s.id === rule.subtopicId);
                return (
                  <li key={index}>
                    {rule.count}× {rule.difficulty || "any difficulty"}
                    {sub ? ` · ${sub.title}` : topic ? ` · ${topic.title}` : " · any topic"}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              Publish now (visible on student Practice Exams)
            </label>
            <p className="text-sm text-muted-foreground">
              You can still toggle publish later from the list. Draft templates stay admin-only.
            </p>
          </div>
        ) : null}
      </AdminModal>
    </>
  );
}
