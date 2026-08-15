"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
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
import { type CourseLinkedProgram } from "@/components/admin/key-concepts/admin-key-concepts-page";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import {
  useAdminPastPapers,
  useAdminQuestionbank,
  useAdminSubjectsTree,
  useCourseUsedQuestions,
  useCreatePastPaper,
  useDeletePastPaper,
  useUpdatePastPaper,
} from "@/hooks";
import { normalizeAccessBadge, tierLabel } from "@/lib/access-tier";
import { richTextToPlain } from "@/lib/rich-text";
import { slugify } from "@/lib/slugify";
import type { ApiError } from "@/types";
import type { PastPaper, PastPaperSourceType } from "@/types/past-paper.types";
import type { QbAccessBadge } from "@/types/qb.types";
import { cn } from "@/utils";

type QuestionPickerTab = "selected" | "available";
type ListStatusFilter = "ALL" | "PUBLISHED" | "DRAFT";
type ListModeFilter = "ALL" | "MCQ" | "WRITTEN";
type PastPaperQuestionMode = "MCQ" | "WRITTEN";

type PickerQuestionRow = {
  id: string;
  number: number;
  prompt: string;
  difficulty: string;
  marks: number;
  questionType: string;
  topicTitle: string;
  subtopicTitle: string;
};

const SOURCE_TYPES: PastPaperSourceType[] = ["INTERACTIVE", "PDF", "HYBRID"];
const TIERS: QbAccessBadge[] = ["FREE", "SILVER", "GOLD", "DIAMOND"];
const PAPER_CODES = ["P1", "P2", "P3"];

function sourceLabel(type: PastPaperSourceType) {
  if (type === "PDF") return "PDF";
  if (type === "HYBRID") return "Hybrid";
  return "Interactive";
}

function modeLabel(mode: PastPaperQuestionMode | string | undefined) {
  return mode === "WRITTEN" ? "Written" : "MCQ";
}

function normalizeQuestionType(type: unknown) {
  return String(type ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function isAllowedForMode(mode: PastPaperQuestionMode, questionType: unknown) {
  const type = normalizeQuestionType(questionType);
  if (mode === "WRITTEN") return type === "SHORT_ANSWER" || type === "DATA_BASED";
  return type === "MULTIPLE_CHOICE";
}

function questionTypeLabel(type: string) {
  const normalized = normalizeQuestionType(type);
  if (normalized === "SHORT_ANSWER") return "Written";
  if (normalized === "DATA_BASED") return "Data";
  if (normalized === "MULTIPLE_CHOICE") return "MCQ";
  return type;
}

function friendlySaveError(message: string | undefined, fallback: string) {
  const text = message || fallback;
  if (/Unique constraint failed/i.test(text) && /paperCode|programId/i.test(text)) {
    return "A past paper already exists for this Year + Session + Paper code. Change year, session, or paper code (e.g. P2), then try again.";
  }
  if (/Unique constraint failed/i.test(text)) {
    return "This past paper conflicts with an existing one. Change year, session, paper code, or slug and try again.";
  }
  return text;
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

type AdminPastPapersPageProps = {
  courseId?: string;
  linkedPrograms?: CourseLinkedProgram[];
  embedded?: boolean;
};

export function AdminPastPapersPage({
  courseId,
  linkedPrograms,
  embedded = false,
}: AdminPastPapersPageProps = {}) {
  const { data: subjectsTree = [] } = useAdminSubjectsTree();
  const [categoryId, setCategoryId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [programId, setProgramId] = useState("");
  const [linkedProgramId, setLinkedProgramId] = useState("");

  const useLinkedOnly = Boolean(courseId && linkedPrograms);

  const effectiveCategoryId = categoryId || subjectsTree[0]?.id || "";
  const subjects = useMemo(() => {
    return subjectsTree.find((c) => c.id === effectiveCategoryId)?.subjects ?? [];
  }, [subjectsTree, effectiveCategoryId]);
  const effectiveSubjectId = subjectId || subjects[0]?.id || "";
  const programs = useMemo(() => {
    return subjects.find((s) => s.id === effectiveSubjectId)?.programs ?? [];
  }, [subjects, effectiveSubjectId]);

  useEffect(() => {
    if (!useLinkedOnly || !linkedPrograms?.length) return;
    if (!linkedProgramId || !linkedPrograms.some((p) => p.id === linkedProgramId)) {
      setLinkedProgramId(linkedPrograms[0].id);
    }
  }, [useLinkedOnly, linkedPrograms, linkedProgramId]);

  const effectiveProgramId = useLinkedOnly
    ? linkedProgramId || linkedPrograms?.[0]?.id || ""
    : programId || programs[0]?.id || "";
  const selectedProgram = useLinkedOnly
    ? linkedPrograms?.find((p) => p.id === effectiveProgramId)
    : programs.find((p) => p.id === effectiveProgramId) ?? programs[0];

  const { data, isLoading, error, refetch, isFetching } = useAdminPastPapers(
    effectiveProgramId || undefined,
    courseId
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editMeta, setEditMeta] = useState<{ isPublished: boolean; attemptCount: number }>({
    isPublished: false,
    attemptCount: 0,
  });
  const [initialQuestionIds, setInitialQuestionIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PastPaper | null>(null);

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
  const effectiveModalProgramId = useLinkedOnly
    ? modalProgramId || effectiveProgramId || ""
    : modalProgramId || modalPrograms[0]?.id || effectiveProgramId || "";
  const scopeLocked = Boolean(editId);

  const qbProgramId = modalOpen ? effectiveModalProgramId : effectiveProgramId;
  const { data: qbTopics = [] } = useAdminQuestionbank(qbProgramId || undefined);
  const { data: usedQuestionsData } = useCourseUsedQuestions(
    courseId ?? "",
    editId ?? undefined
  );
  const usedQuestionIds = useMemo(
    () => new Set(usedQuestionsData?.questionIds ?? []),
    [usedQuestionsData]
  );
  const createPaper = useCreatePastPaper();
  const updatePaper = useUpdatePastPaper();
  const deletePaper = useDeletePastPaper();

  const papers = data?.papers ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ListStatusFilter>("ALL");
  const [modeFilter, setModeFilter] = useState<ListModeFilter>("ALL");

  const [questionMode, setQuestionMode] = useState<PastPaperQuestionMode>("MCQ");
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
  const [topicId, setTopicId] = useState("");
  const [subtopicId, setSubtopicId] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [pickerTab, setPickerTab] = useState<QuestionPickerTab>("available");
  const [isPublished, setIsPublished] = useState(true);

  const busy = createPaper.isPending || updatePaper.isPending || deletePaper.isPending;
  const questionsChanged =
    Boolean(editId) &&
    (selectedQuestionIds.length !== initialQuestionIds.length ||
      selectedQuestionIds.some((id, i) => id !== initialQuestionIds[i]));

  const selectedTopic = qbTopics.find((t) => t.id === topicId);
  const subtopicOptions = useMemo(() => {
    if (topicId && selectedTopic) {
      return selectedTopic.subtopics.map((s) => ({ id: s.id, label: s.title }));
    }
    return qbTopics.flatMap((t) =>
      t.subtopics.map((s) => ({
        id: s.id,
        label: `${t.title} · ${s.title}`,
      }))
    );
  }, [qbTopics, topicId, selectedTopic]);

  const allModeQuestions = useMemo(() => {
    const rows: PickerQuestionRow[] = [];
    for (const topic of qbTopics) {
      for (const sub of topic.subtopics) {
        for (const q of sub.questions ?? []) {
          if (!q.isActive) continue;
          if (!isAllowedForMode(questionMode, q.questionType)) continue;
          rows.push({
            id: q.id,
            number: q.number,
            prompt: q.prompt,
            difficulty: String(q.difficulty),
            marks: q.marks ?? 1,
            questionType: normalizeQuestionType(q.questionType),
            topicTitle: topic.title,
            subtopicTitle: sub.title,
          });
        }
      }
    }
    return rows;
  }, [qbTopics, questionMode]);

  const filteredAvailableQuestions = useMemo(() => {
    const selected = new Set(selectedQuestionIds);
    const topics = topicId ? qbTopics.filter((t) => t.id === topicId) : qbTopics;
    const allowedIds = new Set<string>();
    for (const topic of topics) {
      for (const sub of topic.subtopics) {
        if (subtopicId && sub.id !== subtopicId) continue;
        for (const q of sub.questions ?? []) {
          if (!isAllowedForMode(questionMode, q.questionType)) continue;
          if (!selected.has(q.id) && !usedQuestionIds.has(q.id)) allowedIds.add(q.id);
        }
      }
    }
    return allModeQuestions.filter((q) => allowedIds.has(q.id));
  }, [
    allModeQuestions,
    selectedQuestionIds,
    qbTopics,
    topicId,
    subtopicId,
    questionMode,
    usedQuestionIds,
  ]);

  const selectedQuestions = useMemo(() => {
    const byId = new Map(allModeQuestions.map((q) => [q.id, q]));
    return selectedQuestionIds
      .map((id) => byId.get(id))
      .filter((q): q is PickerQuestionRow => Boolean(q));
  }, [allModeQuestions, selectedQuestionIds]);

  const filteredPapers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return papers.filter((item) => {
      if (statusFilter === "PUBLISHED" && !item.isPublished) return false;
      if (statusFilter === "DRAFT" && item.isPublished) return false;
      if (modeFilter !== "ALL" && (item.questionMode ?? "MCQ") !== modeFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        item.session.toLowerCase().includes(q) ||
        item.paperCode.toLowerCase().includes(q) ||
        String(item.year).includes(q)
      );
    });
  }, [papers, search, statusFilter, modeFilter]);

  const papersByYear = useMemo(() => {
    const map = new Map<number, PastPaper[]>();
    for (const paper of filteredPapers) {
      if (!map.has(paper.year)) map.set(paper.year, []);
      map.get(paper.year)!.push(paper);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [filteredPapers]);

  const stats = useMemo(() => {
    const base = { total: papers.length, published: 0, draft: 0, mcq: 0, written: 0 };
    for (const p of papers) {
      if (p.isPublished) base.published += 1;
      else base.draft += 1;
      if (p.questionMode === "WRITTEN") base.written += 1;
      else base.mcq += 1;
    }
    return base;
  }, [papers]);

  useEffect(() => {
    if (!modalOpen || editId) return;
    if (!title.trim()) return;
    setSlug(slugify(title));
  }, [title, modalOpen, editId]);

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

  const resetForm = (preset?: { mode?: PastPaperQuestionMode }) => {
    setEditId(null);
    setEditMeta({ isPublished: false, attemptCount: 0 });
    setInitialQuestionIds([]);
    setQuestionMode(preset?.mode ?? "MCQ");
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
    setTopicId("");
    setSubtopicId("");
    setSelectedQuestionIds([]);
    setPickerTab("available");
    setIsPublished(true);
    setActionError(null);
    syncModalScope(effectiveProgramId);
  };

  const openCreate = (preset?: { mode?: PastPaperQuestionMode }) => {
    resetForm(preset);
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
    setQuestionMode(item.questionMode === "WRITTEN" ? "WRITTEN" : "MCQ");
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
    setTopicId("");
    setSubtopicId("");
    setSelectedQuestionIds(orderedIds);
    setPickerTab(orderedIds.length > 0 ? "selected" : "available");
    setIsPublished(Boolean(item.isPublished));
    syncModalScope(item.programId || effectiveProgramId);
    setActionError(null);
    setModalOpen(true);
  };

  const validate = (): string | null => {
    if (!title.trim() || !slug.trim()) return "Title and slug are required";
    if (!year.trim() || Number.parseInt(year, 10) < 1990) return "Enter a valid year";
    if (!session.trim() || !paperCode.trim()) return "Session and paper code are required";
    if (!Number.parseInt(durationMin, 10) || Number.parseInt(durationMin, 10) < 1) {
      return "Duration must be at least 1 minute";
    }
    if (!effectiveModalProgramId) return "Select a category, subject, and program";
    if (selectedQuestionIds.length < 1) {
      return `Select at least one ${modeLabel(questionMode)} question from the Questionbank`;
    }
    if (selectedQuestions.length !== selectedQuestionIds.length) {
      return `Only ${modeLabel(questionMode)} questions can be used on this paper. Remove mismatched questions.`;
    }
    const yearNum = Number.parseInt(year, 10);
    const sessionKey = session.trim().toLowerCase();
    const codeKey = paperCode.trim().toLowerCase();
    const duplicate = papers.some(
      (p) =>
        p.id !== editId &&
        p.year === yearNum &&
        p.session.trim().toLowerCase() === sessionKey &&
        p.paperCode.trim().toLowerCase() === codeKey
    );
    if (duplicate) {
      return "A past paper already exists for this Year + Session + Paper code. Use another paper code (e.g. P2) or change year/session.";
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
      description: description.trim(),
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
        await createPaper.mutateAsync({
          programId: effectiveModalProgramId,
          ...(courseId ? { courseId } : {}),
          ...payload,
        });
        if (useLinkedOnly) {
          setLinkedProgramId(effectiveModalProgramId);
        } else {
          const path = findProgramPath(subjectsTree, effectiveModalProgramId);
          if (path) {
            setCategoryId(path.categoryId);
            setSubjectId(path.subjectId);
            setProgramId(path.programId);
          }
        }
      }
      setModalOpen(false);
      resetForm();
    } catch (saveErr) {
      setActionError(
        friendlySaveError((saveErr as ApiError)?.message, "Failed to save past paper")
      );
    }
  };

  const onConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePaper.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (delErr) {
      setActionError((delErr as ApiError)?.message || "Failed to delete past paper");
    }
  };

  if (useLinkedOnly && (!linkedPrograms || linkedPrograms.length === 0)) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Link at least one subject program in the Subjects tab before creating Past Papers for this
        course.
      </div>
    );
  }

  if (isLoading && papers.length === 0 && Boolean(effectiveProgramId)) {
    return (
      <div className="space-y-6">
        {!embedded ? (
          <PageHeader
            title="Past Papers"
            description="Create and manage year/session exam archives."
            className="mb-0"
          />
        ) : null}
        <PageLoader label="Loading past papers..." />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            {!embedded ? (
              <PageHeader
                title="Past Papers"
                description="Create MCQ or Written past papers from the Questionbank. Students browse questions — no timed exam."
                className="mb-0"
              />
            ) : (
              <div>
                <h3 className="text-base font-bold text-foreground">Course Past Papers</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Papers created here belong to this course only.
                </p>
              </div>
            )}
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

          {useLinkedOnly ? (
            <label className="block max-w-md space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Linked subject program
              </span>
              <select
                value={effectiveProgramId}
                onChange={(e) => setLinkedProgramId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                {(linkedPrograms ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.subjectName} · {p.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
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
          )}

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
              <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {stats.written} Written
              </span>
              <Link
                href={ROUTES.subjectResource(selectedProgram.slug, "past-papers")}
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
                placeholder="Search by title, year, session…"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["ALL", "All types"],
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
              {(
                [
                  ["ALL", "All status"],
                  ["PUBLISHED", "Published"],
                  ["DRAFT", "Draft"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={`status-${id}`}
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

          {filteredPapers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {papers.length === 0
                  ? "No past papers yet for this program."
                  : "No papers match your filters."}
              </p>
              {papers.length === 0 ? (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button type="button" size="sm" onClick={() => openCreate({ mode: "MCQ" })}>
                    <Plus className="h-4 w-4" />
                    Create MCQ paper
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openCreate({ mode: "WRITTEN" })}
                  >
                    <Plus className="h-4 w-4" />
                    Create Written paper
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-6">
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
                          "rounded-xl border border-border px-4 py-3 transition",
                          !item.isActive && "border-dashed opacity-70",
                          !item.isPublished && "bg-muted/20"
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-foreground">{item.title}</p>
                              <span className="rounded-md bg-primary-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                                {item.paperCode}
                              </span>
                              <span
                                className={cn(
                                  "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase",
                                  item.questionMode === "WRITTEN"
                                    ? "bg-[#fff8ef] text-[#9a3412]"
                                    : "bg-primary-muted text-primary"
                                )}
                              >
                                {modeLabel(item.questionMode)}
                              </span>
                              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                                {sourceLabel(item.sourceType)}
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
                              {item.session} · {item.totalQuestions}Q · {item.durationMin} min
                              {(item.attemptCount ?? 0) > 0
                                ? ` · ${item.attemptCount} attempt(s)`
                                : ""}
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
                              onClick={() =>
                                void updatePaper.mutateAsync({
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
                                  href={ROUTES.subjectPastPaper(
                                    selectedProgram.slug,
                                    item.slug
                                  )}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AdminModal
        open={modalOpen}
        title={
          editId
            ? `Edit ${modeLabel(questionMode)} past paper`
            : `Create ${modeLabel(questionMode)} past paper`
        }
        description={
          questionMode === "WRITTEN"
            ? "Pick SHORT ANSWER / DATA questions from Questionbank. Students will view them in Past Papers."
            : "Pick MCQ questions from Questionbank. Students will view them in Past Papers."
        }
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
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          {actionError ? (
            <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
              {actionError}
            </p>
          ) : null}

          <div
            className={cn(
              "rounded-xl border px-4 py-3",
              questionMode === "WRITTEN"
                ? "border-[#d4a017]/40 bg-[#fff8ef]"
                : "border-primary/25 bg-primary-muted/40"
            )}
          >
            <p className="text-sm font-bold text-foreground">
              {modeLabel(questionMode)} questions only
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {questionMode === "WRITTEN"
                ? "MCQ questions are hidden. Only Short answer and Data-based questions appear below."
                : "Written questions are hidden. Only Multiple choice questions appear below."}
            </p>
            {!editId ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Wrong type? Close and use{" "}
                <span className="font-semibold text-foreground">
                  {questionMode === "WRITTEN" ? "New MCQ" : "New Written"}
                </span>{" "}
                instead.
              </p>
            ) : null}
          </div>

          {editId && editMeta.isPublished && (editMeta.attemptCount > 0 || questionsChanged) ? (
            <div className="flex gap-2 rounded-lg border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                Published paper — changing the question set updates what students see when they
                browse this past paper.
              </p>
            </div>
          ) : null}

          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Questionbank scope
            </p>
            {useLinkedOnly ? (
              <label className="block max-w-md space-y-1.5">
                <span className="text-sm font-semibold">Linked subject program</span>
                <select
                  value={effectiveModalProgramId}
                  disabled={busy || scopeLocked}
                  onChange={(e) => {
                    setModalProgramId(e.target.value);
                    clearQuestionScope();
                  }}
                  className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm disabled:opacity-60"
                >
                  {(linkedPrograms ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.subjectName} · {p.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
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
            )}

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
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Year</span>
              <Input
                type="number"
                min={1990}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Session</span>
              <Input
                value={session}
                onChange={(e) => setSession(e.target.value)}
                placeholder="Annual"
              />
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
              <span className="text-sm font-semibold">Duration (min)</span>
              <Input
                type="number"
                min={1}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Title</span>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2023 Annual Paper 1"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional short note for students"
              className="flex min-h-[72px] w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
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
                <span className="text-sm font-semibold">PDF URL</span>
                <Input
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://…"
                />
              </label>
            )}
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-sm font-semibold">Section title</span>
              <Input
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                placeholder="Section A"
              />
            </label>
          </div>

          <div className="space-y-2">
            {courseId ? (
              <p className="text-xs text-muted-foreground">
                Questions already used in this course&apos;s Practice Exams or Past Papers are
                hidden.
              </p>
            ) : null}
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
                Selected {modeLabel(questionMode)} ({selectedQuestionIds.length})
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
                Available {modeLabel(questionMode)} ({filteredAvailableQuestions.length})
              </button>
            </div>

            {pickerTab === "selected" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">Already on this paper</span>
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
                    No {modeLabel(questionMode).toLowerCase()} questions selected yet. Switch to
                    Available and add some.
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
                            #{q.number} {richTextToPlain(q.prompt)}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {questionTypeLabel(q.questionType)} · {q.topicTitle} · {q.subtopicTitle}{" "}
                            · {q.marks} mark{q.marks === 1 ? "" : "s"}
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
                  <span className="text-sm font-semibold">Add from Questionbank</span>
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
                      ? questionMode === "WRITTEN"
                        ? "No written (Short answer / Data) questions in this program. Add them in Questionbank first."
                        : "No MCQ questions in this program. Add them in Questionbank first."
                      : selectedQuestionIds.length > 0
                        ? "All matching questions are already selected."
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
                            #{q.number} {richTextToPlain(q.prompt)}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {questionTypeLabel(q.questionType)} · {q.topicTitle} · {q.subtopicTitle}{" "}
                            · {q.difficulty}
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
              Order in Selected is the paper order.
            </p>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        open={Boolean(deleteTarget)}
        title="Delete past paper?"
        description="This cannot be undone. Student attempts for this paper will also be removed."
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
              {busy ? "Deleting…" : "Delete paper"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground">
          Delete <strong>{deleteTarget?.title}</strong>
          {(deleteTarget?.attemptCount ?? 0) > 0
            ? ` (${deleteTarget?.attemptCount} student attempt(s))?`
            : "?"}
        </p>
      </AdminModal>
    </>
  );
}
