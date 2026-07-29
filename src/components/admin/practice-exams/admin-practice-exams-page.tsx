"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
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
  PracticeExamMode,
  PracticeExamTemplate,
} from "@/types/practice-exam.types";
import type { QbAccessBadge } from "@/types/qb.types";
import { cn } from "@/utils";
import Link from "next/link";

const EXAM_MODES: PracticeExamMode[] = ["MCQ", "WRITTEN"];
const TIERS: QbAccessBadge[] = ["FREE", "SILVER", "GOLD", "DIAMOND"];

type ListModeFilter = "ALL" | PracticeExamMode;
type ListStatusFilter = "ALL" | "PUBLISHED" | "DRAFT";
type QuestionPickerTab = "selected" | "available";

type PickerQuestionRow = {
  id: string;
  number: number;
  prompt: string;
  difficulty: string;
  paper: string;
  questionType: string;
  topicTitle: string;
  subtopicTitle: string;
};

function modeLabel(mode: PracticeExamMode | string | undefined) {
  return mode === "WRITTEN" ? "Written" : "MCQ";
}

function allowedQuestionTypes(mode: PracticeExamMode) {
  return mode === "WRITTEN"
    ? (["SHORT_ANSWER", "DATA_BASED"] as const)
    : (["MULTIPLE_CHOICE"] as const);
}

function scopeLabel(
  item: PracticeExamTemplate,
  qbTopics: Array<{
    id: string;
    title: string;
    subtopics: Array<{ id: string; title: string }>;
  }>
) {
  const rules = item.blueprint ?? [];
  if (!rules.length) return "Any topic";
  const selectedIds = rules.flatMap((r) => r.questionIds ?? []);
  if (selectedIds.length > 0) return `${selectedIds.length} selected questions`;
  const topicIds = [...new Set(rules.map((r) => r.topicId).filter(Boolean))];
  const subIds = [...new Set(rules.map((r) => r.subtopicId).filter(Boolean))];
  if (subIds.length === 1) {
    for (const t of qbTopics) {
      const sub = t.subtopics.find((s) => s.id === subIds[0]);
      if (sub) return sub.title;
    }
  }
  if (topicIds.length === 1) {
    return qbTopics.find((t) => t.id === topicIds[0])?.title ?? "Topic";
  }
  if (topicIds.length > 1) return "Mixed topics";
  return "Any topic";
}

function findProgramPath(
  tree: Array<{
    id: string;
    subjects: Array<{ id: string; programs: Array<{ id: string }> }>;
  }>,
  programId: string
): { categoryId: string; subjectId: string; programId: string } | null {
  for (const category of tree) {
    for (const subject of category.subjects) {
      if (subject.programs.some((p) => p.id === programId)) {
        return { categoryId: category.id, subjectId: subject.id, programId };
      }
    }
  }
  return null;
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
  const selectedProgram = programs.find((p) => p.id === effectiveProgramId) ?? programs[0];

  const { data, isLoading, error, refetch, isFetching } = useAdminPracticeExams(
    effectiveProgramId || undefined
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PracticeExamTemplate | null>(null);

  const [modalCategoryId, setModalCategoryId] = useState("");
  const [modalSubjectId, setModalSubjectId] = useState("");
  const [modalProgramId, setModalProgramId] = useState("");

  const modalSubjects = useMemo(() => {
    const catId = modalCategoryId || subjectsTree[0]?.id || "";
    return subjectsTree.find((c) => c.id === catId)?.subjects ?? [];
  }, [subjectsTree, modalCategoryId]);
  const modalPrograms = useMemo(() => {
    const subId = modalSubjectId || modalSubjects[0]?.id || "";
    return modalSubjects.find((s) => s.id === subId)?.programs ?? [];
  }, [modalSubjects, modalSubjectId]);
  const effectiveModalProgramId =
    modalProgramId || modalPrograms[0]?.id || effectiveProgramId || "";
  const scopeLocked = Boolean(editId);

  const qbProgramId = modalOpen ? effectiveModalProgramId : effectiveProgramId;
  const { data: qbTopics = [] } = useAdminQuestionbank(qbProgramId || undefined);
  const createTemplate = useCreatePracticeExamTemplate();
  const updateTemplate = useUpdatePracticeExamTemplate();
  const deleteTemplate = useDeletePracticeExamTemplate();

  const templates = data?.templates ?? [];

  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<ListModeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<ListStatusFilter>("ALL");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<PracticeExamMode>("MCQ");
  const [durationMin, setDurationMin] = useState("30");
  const [topicId, setTopicId] = useState("");
  const [subtopicId, setSubtopicId] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [pickerTab, setPickerTab] = useState<QuestionPickerTab>("available");
  const [accessTier, setAccessTier] = useState<QbAccessBadge>("FREE");
  const [isPublished, setIsPublished] = useState(true);
  const [editSlug, setEditSlug] = useState("");

  const busy =
    createTemplate.isPending || updateTemplate.isPending || deleteTemplate.isPending;

  const selectedTopic = qbTopics.find((t) => t.id === topicId);
  const subtopicOptions = useMemo(() => {
    if (topicId && selectedTopic) {
      return selectedTopic.subtopics.map((s) => ({
        id: s.id,
        label: s.title,
      }));
    }
    return qbTopics.flatMap((t) =>
      t.subtopics.map((s) => ({
        id: s.id,
        label: `${t.title} · ${s.title}`,
      }))
    );
  }, [qbTopics, topicId, selectedTopic]);

  const syncModalScope = (programIdValue: string) => {
    const path = findProgramPath(subjectsTree, programIdValue);
    if (path) {
      setModalCategoryId(path.categoryId);
      setModalSubjectId(path.subjectId);
      setModalProgramId(path.programId);
      return;
    }
    setModalCategoryId(effectiveCategoryId);
    setModalSubjectId(effectiveSubjectId);
    setModalProgramId(programIdValue || effectiveProgramId);
  };

  const clearQuestionScope = () => {
    setTopicId("");
    setSubtopicId("");
    setSelectedQuestionIds([]);
  };

  const allModeQuestions = useMemo(() => {
    const types = allowedQuestionTypes(mode);
    const rows: PickerQuestionRow[] = [];
    for (const topic of qbTopics) {
      for (const sub of topic.subtopics) {
        for (const q of sub.questions ?? []) {
          if (!q.isActive) continue;
          if (!types.includes(q.questionType as (typeof types)[number])) continue;
          rows.push({
            id: q.id,
            number: q.number,
            prompt: q.prompt,
            difficulty: String(q.difficulty),
            paper: String(q.paper),
            questionType: String(q.questionType),
            topicTitle: topic.title,
            subtopicTitle: sub.title,
          });
        }
      }
    }
    return rows;
  }, [qbTopics, mode]);

  const filteredAvailableQuestions = useMemo(() => {
    const selected = new Set(selectedQuestionIds);
    const topics = topicId ? qbTopics.filter((t) => t.id === topicId) : qbTopics;
    const allowedIds = new Set<string>();
    for (const topic of topics) {
      for (const sub of topic.subtopics) {
        if (subtopicId && sub.id !== subtopicId) continue;
        for (const q of sub.questions ?? []) {
          if (!selected.has(q.id)) allowedIds.add(q.id);
        }
      }
    }
    return allModeQuestions.filter((q) => allowedIds.has(q.id));
  }, [allModeQuestions, selectedQuestionIds, qbTopics, topicId, subtopicId]);

  const selectedQuestions = useMemo(() => {
    const byId = new Map(allModeQuestions.map((q) => [q.id, q]));
    return selectedQuestionIds
      .map((id) => byId.get(id))
      .filter((q): q is PickerQuestionRow => Boolean(q));
  }, [allModeQuestions, selectedQuestionIds]);

  const totalQuestions = selectedQuestionIds.length;

  const addQuestion = (id: string) => {
    setSelectedQuestionIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const removeQuestion = (id: string) => {
    setSelectedQuestionIds((prev) => prev.filter((qid) => qid !== id));
  };

  const addAllAvailable = () => {
    setSelectedQuestionIds((prev) => {
      const next = [...prev];
      const seen = new Set(prev);
      for (const q of filteredAvailableQuestions) {
        if (seen.has(q.id)) continue;
        seen.add(q.id);
        next.push(q.id);
      }
      return next;
    });
  };

  const clearAllSelected = () => {
    setSelectedQuestionIds([]);
    setPickerTab("available");
  };

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((item) => {
      if (modeFilter !== "ALL" && (item.mode ?? "MCQ") !== modeFilter) return false;
      if (statusFilter === "PUBLISHED" && !item.isPublished) return false;
      if (statusFilter === "DRAFT" && item.isPublished) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [templates, search, modeFilter, statusFilter]);

  const stats = useMemo(() => {
    const base = {
      total: templates.length,
      published: 0,
      draft: 0,
      mcq: 0,
      written: 0,
    };
    for (const t of templates) {
      if (t.isPublished) base.published += 1;
      else base.draft += 1;
      if (t.mode === "WRITTEN") base.written += 1;
      else base.mcq += 1;
    }
    return base;
  }, [templates]);

  useEffect(() => {
    if (!modalOpen || editId) return;
    if (!title.trim()) return;
    setEditSlug(slugify(title));
  }, [title, modalOpen, editId]);

  const loadScopeFromBlueprint = (item: PracticeExamTemplate) => {
    const rules = item.blueprint?.length
      ? item.blueprint
      : [{ count: item.totalQuestions || 10 }];

    const ids = [
      ...new Set(rules.flatMap((r) => r.questionIds ?? []).filter(Boolean)),
    ] as string[];
    setSelectedQuestionIds(ids);

    const topicIds = [...new Set(rules.map((r) => r.topicId).filter(Boolean))] as string[];
    const subIds = [...new Set(rules.map((r) => r.subtopicId).filter(Boolean))] as string[];
    setTopicId(topicIds.length === 1 ? topicIds[0] : "");
    setSubtopicId(subIds.length === 1 ? subIds[0] : "");
  };

  const resetForm = (preset?: { mode?: PracticeExamMode }) => {
    setEditId(null);
    setTitle("");
    setDescription("");
    setEditSlug("");
    setMode(preset?.mode ?? "MCQ");
    setDurationMin(preset?.mode === "WRITTEN" ? "40" : "30");
    setTopicId("");
    setSubtopicId("");
    setSelectedQuestionIds([]);
    setPickerTab("available");
    setAccessTier("FREE");
    setIsPublished(true);
    setActionError(null);
    syncModalScope(effectiveProgramId);
  };

  const openCreate = (preset?: { mode?: PracticeExamMode }) => {
    resetForm(preset);
    setModalOpen(true);
  };

  const openEdit = (item: PracticeExamTemplate) => {
    setEditId(item.id);
    setTitle(item.title);
    setDescription(item.description ?? "");
    setEditSlug(item.slug);
    setMode(item.mode === "WRITTEN" ? "WRITTEN" : "MCQ");
    setDurationMin(String(item.durationMin));
    setAccessTier(normalizeAccessBadge(item.accessTier));
    setIsPublished(item.isPublished);
    syncModalScope(item.programId || effectiveProgramId);
    loadScopeFromBlueprint(item);
    const ids = [
      ...new Set(
        (item.blueprint ?? []).flatMap((r) => r.questionIds ?? []).filter(Boolean)
      ),
    ];
    setPickerTab(ids.length > 0 ? "selected" : "available");
    setActionError(null);
    setModalOpen(true);
  };

  const openDuplicate = (item: PracticeExamTemplate) => {
    setEditId(null);
    setTitle(`${item.title} (Copy)`);
    setDescription(item.description ?? "");
    setEditSlug(slugify(`${item.slug}-copy`));
    setMode(item.mode === "WRITTEN" ? "WRITTEN" : "MCQ");
    setDurationMin(String(item.durationMin));
    setAccessTier(normalizeAccessBadge(item.accessTier));
    setIsPublished(false);
    syncModalScope(item.programId || effectiveProgramId);
    loadScopeFromBlueprint(item);
    const ids = [
      ...new Set(
        (item.blueprint ?? []).flatMap((r) => r.questionIds ?? []).filter(Boolean)
      ),
    ];
    setPickerTab(ids.length > 0 ? "selected" : "available");
    setActionError(null);
    setModalOpen(true);
  };

  const validate = (): string | null => {
    if (!title.trim()) return "Title is required";
    if (!Number.parseInt(durationMin, 10) || Number.parseInt(durationMin, 10) < 1) {
      return "Duration must be at least 1 minute";
    }
    if (!effectiveModalProgramId) return "Select a category, subject, and program";
    if (selectedQuestionIds.length < 1) {
      return "Select at least one question from the Questionbank";
    }
    return null;
  };

  const onSave = async () => {
    const err = validate();
    if (err) {
      setActionError(err);
      return;
    }
    if (!effectiveModalProgramId) {
      setActionError("Select a program first");
      return;
    }
    setActionError(null);

    const slug = (editSlug || slugify(title)).trim();
    const blueprint = [
      {
        ...(topicId ? { topicId } : {}),
        ...(subtopicId ? { subtopicId } : {}),
        count: selectedQuestionIds.length,
        questionIds: selectedQuestionIds,
      },
    ];

    const payload = {
      title: title.trim(),
      slug,
      description: description.trim(),
      type: "TOPIC_QUIZ" as const,
      mode,
      durationMin: Number.parseInt(durationMin, 10),
      totalQuestions: selectedQuestionIds.length,
      passMarkPercent: mode === "WRITTEN" ? (editId ? null : undefined) : 50,
      blueprint,
      accessTier,
      isPublished,
      order: editId
        ? (templates.find((t) => t.id === editId)?.order ?? templates.length)
        : templates.length,
      isActive: true,
    };

    try {
      if (editId) {
        await updateTemplate.mutateAsync({ id: editId, payload });
      } else {
        await createTemplate.mutateAsync({
          programId: effectiveModalProgramId,
          ...payload,
        });
        // Keep page list on the program we just created into
        const path = findProgramPath(subjectsTree, effectiveModalProgramId);
        if (path) {
          setCategoryId(path.categoryId);
          setSubjectId(path.subjectId);
          setProgramId(path.programId);
        }
      }
      setModalOpen(false);
      resetForm();
    } catch (saveErr) {
      setActionError((saveErr as ApiError)?.message || "Failed to save template");
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTemplate.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (delErr) {
      setActionError((delErr as ApiError)?.message || "Failed to delete template");
    }
  };

  if (isLoading && templates.length === 0 && programs.length > 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Practice Exams"
          description="Create and manage MCQ & Written practice exams."
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
              description="Create, edit, publish, or delete templates. Students take them from the subject Practice Exams hub."
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
                variant="outline"
                disabled={!effectiveProgramId}
                onClick={() => openCreate({ mode: "WRITTEN" })}
              >
                <Plus className="h-4 w-4" />
                New Written
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!effectiveProgramId}
                onClick={() => openCreate({ mode: "MCQ" })}
              >
                <Plus className="h-4 w-4" />
                New MCQ
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
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {stats.total} total
              </span>
              <span className="rounded-lg bg-[#ecfdf3] px-2.5 py-1 text-xs font-semibold text-[var(--accent-green)]">
                {stats.published} published
              </span>
              <span className="rounded-lg bg-[#fff8ef] px-2.5 py-1 text-xs font-semibold text-[#9a3412]">
                {stats.draft} draft
              </span>
              <span className="rounded-lg bg-primary-muted px-2.5 py-1 text-xs font-semibold text-primary">
                {stats.mcq} MCQ
              </span>
              <span className="rounded-lg bg-primary-muted px-2.5 py-1 text-xs font-semibold text-primary">
                {stats.written} Written
              </span>
              <Link
                href={ROUTES.subjectResource(selectedProgram.slug, "practice-exams")}
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                target="_blank"
              >
                Open student hub
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or slug…"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["ALL", "All"],
                  ["MCQ", "MCQ"],
                  ["WRITTEN", "Written"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setModeFilter(id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition",
                    modeFilter === id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
              <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />
              {(
                [
                  ["ALL", "All status"],
                  ["PUBLISHED", "Published"],
                  ["DRAFT", "Draft"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStatusFilter(id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold transition",
                    statusFilter === id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {templates.length === 0
                  ? "No practice exams yet for this program."
                  : "No exams match your filters."}
              </p>
              {templates.length === 0 ? (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button type="button" size="sm" onClick={() => openCreate({ mode: "MCQ" })}>
                    <Plus className="h-4 w-4" />
                    Create MCQ exam
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openCreate({ mode: "WRITTEN" })}
                  >
                    <Plus className="h-4 w-4" />
                    Create Written exam
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border border-border px-4 py-3 transition",
                    !item.isActive && "border-dashed opacity-70",
                    !item.isPublished && "bg-muted/20"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                            item.mode === "WRITTEN"
                              ? "bg-[#eff6ff] text-[#1d4ed8]"
                              : "bg-primary-muted text-primary"
                          )}
                        >
                          {modeLabel(item.mode)}
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
                        {item.totalQuestions}Q · {item.durationMin} min · {scopeLabel(item, qbTopics)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => openDuplicate(item)}
                        title="Duplicate"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          void updateTemplate.mutateAsync({
                            id: item.id,
                            payload: { isPublished: !item.isPublished },
                          })
                        }
                      >
                        {item.isPublished ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            Publish
                          </>
                        )}
                      </Button>
                      {selectedProgram && item.isPublished ? (
                        <Button type="button" size="sm" variant="ghost" asChild>
                          <Link
                            href={ROUTES.subjectPracticeExam(selectedProgram.slug, item.slug)}
                            target="_blank"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-accent hover:bg-[#fff1ee] hover:text-accent"
                        disabled={busy}
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AdminModal
        open={modalOpen}
        title={editId ? "Edit practice exam" : "Create practice exam"}
        description="Choose category → subject → program, then pick questions."
        onClose={() => !busy && setModalOpen(false)}
        className="sm:max-w-2xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              Publish
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" disabled={busy} onClick={() => void onSave()}>
                {busy ? "Saving…" : editId ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {actionError ? (
            <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
              {actionError}
            </p>
          ) : null}

          <div className="inline-flex w-full rounded-xl border border-border bg-muted/40 p-1">
            {EXAM_MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  if (m === mode) return;
                  setMode(m);
                  setSelectedQuestionIds([]);
                  setPickerTab("available");
                }}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  mode === m
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {modeLabel(m)}
              </button>
            ))}
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Title</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Linear Equations Quiz"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional short description for students"
              className="flex min-h-[80px] w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Access</span>
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
              <span className="text-sm font-semibold">Duration (min)</span>
              <Input
                type="number"
                min={1}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
              />
            </label>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Questionbank scope
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Category</span>
                <select
                  value={modalCategoryId || subjectsTree[0]?.id || ""}
                  disabled={busy || scopeLocked}
                  onChange={(e) => {
                    setModalCategoryId(e.target.value);
                    setModalSubjectId("");
                    setModalProgramId("");
                    clearQuestionScope();
                  }}
                  className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm disabled:opacity-60"
                >
                  {subjectsTree.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Subject</span>
                <select
                  value={modalSubjectId || modalSubjects[0]?.id || ""}
                  disabled={busy || scopeLocked || modalSubjects.length === 0}
                  onChange={(e) => {
                    setModalSubjectId(e.target.value);
                    setModalProgramId("");
                    clearQuestionScope();
                  }}
                  className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm disabled:opacity-60"
                >
                  {modalSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Program</span>
                <select
                  value={effectiveModalProgramId}
                  disabled={busy || scopeLocked || modalPrograms.length === 0}
                  onChange={(e) => {
                    setModalProgramId(e.target.value);
                    clearQuestionScope();
                  }}
                  className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm disabled:opacity-60"
                >
                  {modalPrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {scopeLocked ? (
              <p className="text-xs text-muted-foreground">
                Category / subject / program stay fixed while editing this exam.
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Topic</span>
                <select
                  value={topicId}
                  onChange={(e) => {
                    setTopicId(e.target.value);
                    setSubtopicId("");
                  }}
                  className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                >
                  <option value="">All topics</option>
                  {qbTopics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Subtopic</span>
                <select
                  value={subtopicId}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSubtopicId(next);
                    if (next && !topicId) {
                      const owner = qbTopics.find((t) =>
                        t.subtopics.some((s) => s.id === next)
                      );
                      if (owner) setTopicId(owner.id);
                    }
                  }}
                  disabled={subtopicOptions.length === 0}
                  className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm disabled:opacity-60"
                >
                  <option value="">
                    {subtopicOptions.length === 0
                      ? "No subtopics in Questionbank"
                      : "All subtopics"}
                  </option>
                  {subtopicOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {subtopicOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Subtopics come from Questionbank study sets (e.g. “1.1 Linear Equations”
                under a topic). Add them under Questionbank first.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Subtopic = Questionbank study set under a topic (e.g. Algebra → 1.1 Linear
                Equations).
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="inline-flex w-full rounded-xl border border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setPickerTab("selected")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  pickerTab === "selected"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Selected ({totalQuestions})
              </button>
              <button
                type="button"
                onClick={() => setPickerTab("available")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition",
                  pickerTab === "available"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Available ({filteredAvailableQuestions.length})
              </button>
            </div>

            {pickerTab === "selected" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">
                    Already in this exam ({mode === "WRITTEN" ? "written" : "MCQ"})
                  </span>
                  {selectedQuestions.length > 0 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={clearAllSelected}
                    >
                      Clear all
                    </Button>
                  ) : null}
                </div>
                {selectedQuestions.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                    No questions selected yet. Switch to Available and add some.
                  </p>
                ) : (
                  <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
                    {selectedQuestions.map((q, index) => (
                      <div
                        key={q.id}
                        className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/60"
                      >
                        <span className="mt-0.5 w-5 shrink-0 text-xs font-semibold text-muted-foreground">
                          {index + 1}.
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="font-medium text-foreground line-clamp-2">
                            #{q.number} {q.prompt}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {q.topicTitle} · {q.subtopicTitle} · {q.difficulty}
                          </span>
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="shrink-0 text-accent hover:bg-[#fff1ee] hover:text-accent"
                          disabled={busy}
                          onClick={() => removeQuestion(q.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">
                    Add from Questionbank ({mode === "WRITTEN" ? "written" : "MCQ"})
                  </span>
                  {filteredAvailableQuestions.length > 0 ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={addAllAvailable}
                    >
                      Select all
                    </Button>
                  ) : null}
                </div>
                {filteredAvailableQuestions.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                    {allModeQuestions.length === 0
                      ? mode === "WRITTEN"
                        ? "No written questions in this program. Add them in Questionbank first."
                        : "No MCQ questions in this program. Add them in Questionbank first."
                      : totalQuestions > 0
                        ? "All matching questions are already selected. Change topic/subtopic filter or clear some from Selected."
                        : "No questions match this topic/subtopic filter."}
                  </p>
                ) : (
                  <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
                    {filteredAvailableQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/60"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="font-medium text-foreground line-clamp-2">
                            #{q.number} {q.prompt}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {q.topicTitle} · {q.subtopicTitle} · {q.difficulty}
                          </span>
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          disabled={busy}
                          onClick={() => addQuestion(q.id)}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <p className="text-xs text-muted-foreground">
              Selected questions stay out of Available, so the same question cannot be added twice.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            {mode === "WRITTEN"
              ? "Students download the question paper and upload their answers."
              : "Students answer MCQs online — auto-marked after submit."}
          </p>
        </div>
      </AdminModal>

      <AdminModal
        open={Boolean(deleteTarget)}
        title="Delete practice exam?"
        description="This cannot be undone. Student attempts for this template will also be removed."
        onClose={() => !busy && setDeleteTarget(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busy}
              className="bg-accent text-white hover:bg-accent/90"
              onClick={() => void onConfirmDelete()}
            >
              {busy ? "Deleting…" : "Delete exam"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground">
          Delete <strong>{deleteTarget?.title}</strong>?
        </p>
      </AdminModal>
    </>
  );
}
