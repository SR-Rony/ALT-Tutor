"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  MinusCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminAddUserButton } from "@/components/admin/shared/admin-add-user-modal";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import {
  parsePaperNumber,
  paperKey,
  resolvePaperConfig,
  resolvePaperTabs,
} from "@/components/admin/questionbank/qb-admin-shared";
import { QbQuestionFormModal } from "@/components/admin/questionbank/qb-question-form-modal";
import { QbPdfImportModal } from "@/components/admin/questionbank/qb-pdf-import-modal";
import { type CourseLinkedProgram } from "@/components/admin/key-concepts/admin-key-concepts-page";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { ROUTES } from "@/constants";
import {
  useAdminPastPapers,
  useAdminQuestionbank,
  useAdminSubjectsTree,
  useCourseUsedQuestions,
  useCreatePastPaper,
  useCreateQbSubtopic,
  useCreateQbTopic,
  useDeletePastPaper,
  useDeleteQbQuestion,
  useUpdatePastPaper,
} from "@/hooks";
import { normalizeAccessBadge, tierLabel } from "@/lib/access-tier";
import { questionTitle } from "@/lib/question-title";
import { richTextToPlain } from "@/lib/rich-text";
import { slugify } from "@/lib/slugify";
import type { ApiError } from "@/types";
import type { PastPaper, PastPaperSectionInput, PastPaperSourceType } from "@/types/past-paper.types";
import type { QbAccessBadge, QbPaper, QbPaperConfig, QbQuestion } from "@/types/qb.types";
import { cn } from "@/utils";

type QuestionPickerTab = "selected" | "available";
type ListStatusFilter = "ALL" | "PUBLISHED" | "DRAFT";
type ListModeFilter = "ALL" | "MCQ" | "WRITTEN";
type PastPaperQuestionMode = "MCQ" | "WRITTEN";

type PickerQuestionRow = {
  id: string;
  number: number;
  prompt: string;
  body?: string | null;
  diagramUrl?: string | null;
  difficulty: string;
  paper: string;
  questionType: string;
  marks: number;
  options: string[];
  correctAnswer?: string;
  markScheme?: string | null;
  videoUrl?: string | null;
  notes?: string | null;
  topicTitle: string;
  subtopicTitle: string;
  subtopicId: string;
  paperConfig: QbPaperConfig;
  paperTabs: QbPaper[];
  raw: QbQuestion;
};

type QuestionRowSource = Partial<QbQuestion> & {
  id: string;
  number?: number;
  prompt?: string;
  body?: string | null;
  diagramUrl?: string | null;
  difficulty?: string | null;
  paper?: string | null;
  questionType?: string;
  marks?: number | null;
  options?: string[];
  correctAnswer?: string;
  markScheme?: string | null;
  videoUrl?: string | null;
  notes?: string | null;
  subtopic?: {
    id?: string;
    title?: string;
    paperCount?: number;
    paperConfig?: QbPaperConfig | null;
    topic?: { id?: string; title?: string };
  };
};

function toPickerRow(
  q: QuestionRowSource,
  defaultSubtopicId?: string
): PickerQuestionRow {
  const sub = q.subtopic;
  return {
    id: q.id,
    number: q.number ?? 1,
    prompt: q.prompt ?? "",
    body: q.body,
    diagramUrl: q.diagramUrl,
    difficulty: String(q.difficulty ?? "MEDIUM"),
    paper: String(q.paper ?? "PAPER_1"),
    questionType: String(q.questionType ?? "MULTIPLE_CHOICE"),
    marks: q.marks ?? 1,
    options: q.options ?? [],
    correctAnswer: q.correctAnswer,
    markScheme: q.markScheme,
    videoUrl: q.videoUrl,
    notes: q.notes,
    topicTitle: sub?.topic?.title ? richTextToPlain(sub.topic.title) || sub.topic.title : "Topic",
    subtopicTitle: sub?.title ? richTextToPlain(sub.title) || sub.title : "Subtopic",
    subtopicId: q.subtopicId || defaultSubtopicId || "",
    paperConfig: resolvePaperConfig(sub?.paperCount, sub?.paperConfig),
    paperTabs: resolvePaperTabs(sub?.paperCount, []),
    raw: q as QbQuestion,
  };
}

const SOURCE_TYPES: PastPaperSourceType[] = ["INTERACTIVE", "PDF", "HYBRID"];
const TIERS: QbAccessBadge[] = ["FREE", "GOLD"];

/** Rows are h-20; the list shows 5 of them (plus space-y-1 gaps, p-2, border) then scrolls. */
const PICKER_LIST_CLASS =
  "max-h-[calc(5*5rem+4*0.25rem+1rem+2px)] space-y-1 overflow-y-auto overscroll-contain rounded-xl border border-border p-2";

function PickerQuestionItem({
  question,
  position,
  details,
  action,
}: {
  question: PickerQuestionRow;
  position?: number;
  details: string[];
  action: ReactNode;
}) {
  const title = useMemo(() => questionTitle(question.prompt), [question.prompt]);
  return (
    <div
      className="flex h-20 items-start gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-muted/60"
      title={title.plain || undefined}
    >
      {position != null ? (
        <span className="mt-px flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-muted px-1 text-[11px] font-semibold text-muted-foreground">
          {position}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 h-10 overflow-hidden leading-5 text-foreground">
          <span className="mr-1.5 font-bold text-primary">#{question.number}</span>
          {title.html ? (
            <RichTextContent
              html={title.html}
              inline
              className="text-sm! leading-5! font-medium text-foreground"
            />
          ) : (
            <span className="italic text-muted-foreground">Image-only question</span>
          )}
        </div>
        <div className="mt-1 flex h-5 min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {title.sourceTag ? (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-4 text-foreground">
              {title.sourceTag}
            </span>
          ) : null}
          <span className="shrink-0 font-medium">{details.join(" · ")}</span>
          <span className="shrink-0" aria-hidden>
            ·
          </span>
          <span className="truncate">
            {question.topicTitle} › {question.subtopicTitle}
          </span>
        </div>
      </div>
      {action}
    </div>
  );
}

function paperCodeFromNumber(n: number) {
  return `P${Math.max(1, Math.floor(n))}`;
}

/** Normalize legacy values (P1, PAPER_1, "1", "Paper 1") → Pn */
function normalizePastPaperCode(raw: string | null | undefined): string {
  return paperCodeFromNumber(parsePaperNumber(raw));
}

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
    return "A past paper already exists for this Year + Session + Paper code. Change year, session, or paper code, then try again.";
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
  const { data: qbTopics = [], refetch: refetchQbTopics } = useAdminQuestionbank(
    qbProgramId || undefined
  );
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
  const createQbTopicMutation = useCreateQbTopic();
  const createQbSubtopicMutation = useCreateQbSubtopic();

  const papers = useMemo(() => data?.papers ?? [], [data?.papers]);

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
  const [newQuestionOpen, setNewQuestionOpen] = useState(false);
  const [pdfImportOpen, setPdfImportOpen] = useState(false);
  const [newQuestionSubtopicId, setNewQuestionSubtopicId] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [expandedPaperIds, setExpandedPaperIds] = useState<Set<string>>(new Set());
  const [dropdownActionPaper, setDropdownActionPaper] = useState<PastPaper | null>(null);
  const [editingQuestionRow, setEditingQuestionRow] = useState<PickerQuestionRow | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<PickerQuestionRow | null>(null);
  const [extraQuestions, setExtraQuestions] = useState<Map<string, PickerQuestionRow>>(new Map());

  const deleteQbQuestion = useDeleteQbQuestion();

  const toggleExpandPaper = (id: string) => {
    setExpandedPaperIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRemoveQuestionFromPaper = async (
    paper: PastPaper,
    questionId: string
  ) => {
    const currentSections = paper.sections?.length
      ? paper.sections
      : [{ title: "Section A", order: 0, items: [] }];
    const updatedSections: PastPaperSectionInput[] = currentSections.map((sec) => ({
      title: sec.title,
      code: sec.code || undefined,
      instructions: sec.instructions || undefined,
      order: sec.order,
      items: (sec.items ?? [])
        .filter((item) => item.questionId !== questionId)
        .map((item, idx) => ({
          questionId: item.questionId,
          order: idx,
          marks: item.marks ?? undefined,
        })),
    }));
    try {
      await updatePaper.mutateAsync({
        id: paper.id,
        payload: {
          sections: updatedSections,
        },
      });
      void refetch();
    } catch (err) {
      console.error(err);
      setActionError((err as ApiError)?.message || "Failed to remove question from past paper");
    }
  };

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
          rows.push(
            toPickerRow(
              {
                ...q,
                subtopic: {
                  id: sub.id,
                  title: sub.title,
                  paperCount: sub.paperCount,
                  paperConfig: sub.paperConfig,
                  topic: { id: topic.id, title: topic.title },
                },
              },
              sub.id
            )
          );
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

  // Past papers only accept questions from active study sets, so new questions only go into those.
  const newQuestionStudySets = useMemo(
    () =>
      qbTopics
        .filter((t) => t.isActive)
        .flatMap((t) =>
          t.subtopics
            .filter((s) => s.isActive)
            .map((s) => ({
              id: s.id,
              topicId: t.id,
              label: `${richTextToPlain(t.title) || t.title} · ${richTextToPlain(s.title) || s.title}`,
              paperConfig: resolvePaperConfig(s.paperCount, s.paperConfig),
              paperTabs: resolvePaperTabs(s.paperCount, s.questions),
            }))
        ),
    [qbTopics]
  );
  const effectiveNewQuestionSubtopicId =
    newQuestionSubtopicId ||
    newQuestionStudySets.find((s) => s.id === subtopicId)?.id ||
    newQuestionStudySets[0]?.id ||
    "";
  const newQuestionStudySet =
    newQuestionStudySets.find((s) => s.id === effectiveNewQuestionSubtopicId) ??
    newQuestionStudySets[0];

  const selectedQuestions = useMemo(() => {
    const byId = new Map(allModeQuestions.map((q) => [q.id, q]));
    for (const [id, q] of extraQuestions.entries()) {
      if (!byId.has(id)) byId.set(id, q);
    }
    // Also scan all papers in memory as fallback
    for (const p of papers) {
      for (const s of p.sections ?? []) {
        for (const it of s.items ?? []) {
          if (it.question && !byId.has(it.questionId)) {
            byId.set(
              it.questionId,
              toPickerRow(it.question as unknown as QuestionRowSource, effectiveNewQuestionSubtopicId)
            );
          }
        }
      }
    }
    return selectedQuestionIds.map((id, idx) => {
      const found = byId.get(id);
      if (found) return found;
      // Synthetic fallback so question object is preserved and visible in Selected list
      return {
        id,
        number: idx + 1,
        prompt: `Question ${idx + 1}`,
        difficulty: "MEDIUM",
        paper: questionMode === "WRITTEN" ? "PAPER_2" : "PAPER_1",
        questionType: questionMode === "WRITTEN" ? "SHORT_ANSWER" : "MULTIPLE_CHOICE",
        marks: 1,
        options: [],
        topicTitle: "Past Paper",
        subtopicTitle: "Exclusive Question",
        subtopicId: effectiveNewQuestionSubtopicId,
        paperConfig: {},
        paperTabs: [],
        raw: {
          id,
          number: idx + 1,
          prompt: `Question ${idx + 1}`,
          questionType: questionMode === "WRITTEN" ? "SHORT_ANSWER" : "MULTIPLE_CHOICE",
          difficulty: "MEDIUM",
          paper: questionMode === "WRITTEN" ? "PAPER_2" : "PAPER_1",
          marks: 1,
          options: [],
          isActive: true,
          subtopicId: effectiveNewQuestionSubtopicId,
        } as unknown as QbQuestion,
      };
    });
  }, [allModeQuestions, selectedQuestionIds, extraQuestions, papers, questionMode, effectiveNewQuestionSubtopicId]);

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

  useEffect(() => {
    if (!modalOpen && !dropdownActionPaper) {
      setNewQuestionOpen(false);
      setPdfImportOpen(false);
    }
  }, [modalOpen, dropdownActionPaper]);

  const [isProvisioningStudySet, setIsProvisioningStudySet] = useState(false);

  const ensureStudySetForProgram = async (targetProgramId: string): Promise<string> => {
    // If a study set already exists in loaded qbTopics for this program, use it
    const existing = newQuestionStudySets[0]?.id;
    if (existing) return existing;

    setIsProvisioningStudySet(true);
    try {
      // Find or create topic
      let activeTopicId = qbTopics.find((t) => t.programId === targetProgramId && t.isActive)?.id;
      if (!activeTopicId) {
        const createdTopic = (await createQbTopicMutation.mutateAsync({
          programId: targetProgramId,
          title: "Past Papers Repository",
          slug: `past-papers-repo-${Date.now().toString().slice(-4)}`,
          description: "Default topic for past paper questions",
          isActive: true,
        })) as { id: string };
        activeTopicId = createdTopic?.id;
      }

      if (!activeTopicId) {
        throw new Error("Failed to find or create parent topic for study set");
      }

      // Create subtopic
      const newSub = (await createQbSubtopicMutation.mutateAsync({
        topicId: activeTopicId,
        title: "Paper Questions",
        slug: `paper-questions-${Date.now().toString().slice(-4)}`,
        paperCount: 3,
      })) as { id: string };

      await refetchQbTopics();
      setNewQuestionSubtopicId(newSub.id);
      return newSub.id;
    } catch (err) {
      console.error("Failed to provision default study set for past paper:", err);
      return "";
    } finally {
      setIsProvisioningStudySet(false);
    }
  };

  const openNewQuestion = async () => {
    let subId =
      newQuestionStudySets.find((s) => s.id === subtopicId)?.id ??
      newQuestionStudySets.find((s) => topicId && s.topicId === topicId)?.id ??
      newQuestionStudySets.find((s) => s.id === newQuestionSubtopicId)?.id ??
      newQuestionStudySets[0]?.id;

    if (!subId) {
      const progId = dropdownActionPaper?.programId || effectiveModalProgramId || effectiveProgramId;
      if (progId) {
        subId = await ensureStudySetForProgram(progId);
      }
    }

    if (!subId) {
      setActionError("Could not initialize a study set for questions. Please try again.");
      return;
    }

    setNewQuestionSubtopicId(subId);
    setNewQuestionOpen(true);
  };

  const openPdfImport = async () => {
    let subId =
      newQuestionStudySets.find((s) => s.id === subtopicId)?.id ??
      newQuestionStudySets.find((s) => topicId && s.topicId === topicId)?.id ??
      newQuestionStudySets.find((s) => s.id === newQuestionSubtopicId)?.id ??
      newQuestionStudySets[0]?.id;

    if (!subId) {
      const progId = dropdownActionPaper?.programId || effectiveModalProgramId || effectiveProgramId;
      if (progId) {
        subId = await ensureStudySetForProgram(progId);
      }
    }

    if (!subId) {
      setActionError("Could not initialize a study set for questions. Please try again.");
      return;
    }

    setNewQuestionSubtopicId(subId);
    setPdfImportOpen(true);
  };

  const resetForm = (preset?: { mode?: PastPaperQuestionMode }) => {
    setEditId(null);
    setEditMeta({ isPublished: false, attemptCount: 0 });
    setInitialQuestionIds([]);
    const initialMode = preset?.mode ?? "MCQ";
    setQuestionMode(initialMode);
    const curYear = String(new Date().getFullYear());
    setYear(curYear);
    setSession("May/June");
    const initialCode = initialMode === "WRITTEN" ? "Paper 2" : "Paper 1";
    setPaperCode(initialCode);
    const initialTitle = `May/June ${curYear} ${initialCode}`;
    setTitle(initialTitle);
    setSlug(slugify(initialTitle));
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
    setNewQuestionOpen(false);
    setPdfImportOpen(false);
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
    // Index existing questions from this paper into extraQuestions map so they resolve immediately
    setExtraQuestions((prev) => {
      const next = new Map(prev);
      for (const section of item.sections ?? []) {
        for (const it of section.items ?? []) {
          if (it.question) {
            next.set(
              it.questionId,
              toPickerRow(it.question as unknown as QuestionRowSource, effectiveNewQuestionSubtopicId)
            );
          }
        }
      }
      return next;
    });
    setQuestionMode(item.questionMode === "WRITTEN" ? "WRITTEN" : "MCQ");
    setYear(String(item.year));
    setSession(item.session);
    setPaperCode(normalizePastPaperCode(item.paperCode));
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
    if (!effectiveModalProgramId) return "Select a curriculum, subject, and program";
    if (selectedQuestionIds.length < 1) {
      return "Select or upload at least one question for this past paper";
    }
    const mismatched = selectedQuestions.some(
      (q) => !isAllowedForMode(questionMode, q.questionType)
    );
    if (mismatched) {
      return `Only ${modeLabel(questionMode)} questions can be used on this paper. Remove mismatched questions.`;
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
              {!embedded ? (
                <AdminAddUserButton
                  defaultGrantPractice
                  defaultProgramId={effectiveProgramId}
                />
              ) : null}
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
                  Curriculum
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
                    {yearPapers.map((item) => {
                      const itemQuestions: PickerQuestionRow[] =
                        item.questions && item.questions.length > 0
                          ? item.questions.map((q) =>
                              toPickerRow(q, effectiveNewQuestionSubtopicId)
                            )
                          : (item.sections ?? [])
                              .flatMap((s) => (s.items ?? []).map((i) => i.question).filter(Boolean))
                              .map((q) =>
                                toPickerRow(
                                  q as unknown as QuestionRowSource,
                                  effectiveNewQuestionSubtopicId
                                )
                              );
                      const isExpanded = expandedPaperIds.has(item.id);

                      return (
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
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {item.session} · {item.totalQuestions}Q · {item.durationMin} min
                                {(item.attemptCount ?? 0) > 0
                                  ? ` · ${item.attemptCount} attempt(s)`
                                  : ""}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleExpandPaper(item.id)}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition cursor-pointer select-none",
                                  isExpanded
                                    ? "border-primary bg-primary text-white shadow-sm"
                                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
                                )}
                              >
                                <ChevronDown
                                  className={cn(
                                    "h-3.5 w-3.5 transition-transform duration-200",
                                    isExpanded && "rotate-180"
                                  )}
                                />
                                <span>
                                  {isExpanded ? "Hide Questions" : "Questions"} ({itemQuestions.length})
                                </span>
                              </button>
                            </div>
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

                        {/* Expandable Dropdown: Questions list for this past paper */}
                        {isExpanded && (
                          <div className="mt-3.5 border-t border-slate-200 pt-3.5 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-slate-800">
                                  Questions in this Past Paper ({itemQuestions.length})
                                </span>
                                <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                  Total Marks: {itemQuestions.reduce((sum, q) => sum + (q.marks ?? 1), 0)}
                                </span>
                                <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                                  {itemQuestions.filter((q) => q.questionType === "MULTIPLE_CHOICE").length} MCQ
                                </span>
                                <span className="rounded bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">
                                  {itemQuestions.filter((q) => q.questionType !== "MULTIPLE_CHOICE").length} Written
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs font-semibold"
                                  onClick={() => {
                                    setDropdownActionPaper(item);
                                    setPdfImportOpen(true);
                                  }}
                                >
                                  <Upload className="h-3.5 w-3.5" />
                                  Import PDF
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-8 text-xs font-semibold"
                                  onClick={() => {
                                    setDropdownActionPaper(item);
                                    setNewQuestionOpen(true);
                                  }}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Add Question
                                </Button>
                              </div>
                            </div>

                            {itemQuestions.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
                                <p className="text-xs text-slate-500">No questions in this past paper yet.</p>
                                <div className="mt-3 flex justify-center gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setDropdownActionPaper(item);
                                      setPdfImportOpen(true);
                                    }}
                                  >
                                    <Upload className="h-3.5 w-3.5" />
                                    Import from PDF
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      setDropdownActionPaper(item);
                                      setNewQuestionOpen(true);
                                    }}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Question
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2.5">
                                {itemQuestions.map((q, qIndex) => {
                                  const hasMarkScheme = Boolean(q.markScheme && q.markScheme.trim().length > 0);
                                  const hasVideo = Boolean(q.videoUrl && q.videoUrl.trim().length > 0);
                                  const hasNotes = Boolean(q.notes && q.notes.trim().length > 0);
                                  const isMcq = q.questionType === "MULTIPLE_CHOICE";

                                  return (
                                    <div
                                      key={q.id}
                                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-slate-300"
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1 space-y-1.5">
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="flex h-5 items-center justify-center rounded bg-slate-800 px-1.5 text-[11px] font-bold text-white">
                                              Q{qIndex + 1}
                                            </span>
                                            <span
                                              className={cn(
                                                "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                                                isMcq
                                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                  : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                              )}
                                            >
                                              {isMcq ? "MCQ" : "Written"}
                                            </span>
                                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                                              {q.marks ?? 1} {q.marks === 1 ? "mark" : "marks"}
                                            </span>
                                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                              {q.difficulty}
                                            </span>
                                          </div>

                                          <p className="line-clamp-2 text-xs font-medium text-slate-800 leading-relaxed">
                                            {richTextToPlain(q.prompt) || "No prompt text"}
                                          </p>

                                          {q.diagramUrl && (
                                            <div className="flex items-center gap-2 pt-0.5">
                                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                                                <ImageIcon className="h-3.5 w-3.5" /> Diagram attached
                                              </span>
                                            </div>
                                          )}

                                          {isMcq && q.options && q.options.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                              {q.options.map((opt, optIdx) => {
                                                const letter = String.fromCharCode(65 + optIdx);
                                                const isCorrect = q.correctAnswer === letter;
                                                return (
                                                  <span
                                                    key={optIdx}
                                                    className={cn(
                                                      "rounded px-2 py-0.5 text-[11px] border",
                                                      isCorrect
                                                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                                                        : "bg-slate-50 border-slate-200 text-slate-600 font-normal"
                                                    )}
                                                  >
                                                    <span className="font-semibold">{letter}:</span> {richTextToPlain(opt)}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          )}

                                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                            <span
                                              className={cn(
                                                "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold",
                                                hasMarkScheme
                                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                                  : "border border-slate-200 bg-slate-100 text-slate-400"
                                              )}
                                            >
                                              <FileText className="h-3 w-3" />
                                              <span>{hasMarkScheme ? "Mark Scheme ✓" : "No Mark Scheme"}</span>
                                            </span>

                                            <span
                                              className={cn(
                                                "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold",
                                                hasVideo
                                                  ? "border border-indigo-200 bg-indigo-50 text-indigo-700"
                                                  : "border border-slate-200 bg-slate-100 text-slate-400"
                                              )}
                                            >
                                              <Video className="h-3 w-3" />
                                              <span>{hasVideo ? "Video Solution ✓" : "No Video"}</span>
                                            </span>

                                            <span
                                              className={cn(
                                                "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold",
                                                hasNotes
                                                  ? "border border-amber-200 bg-amber-50 text-amber-800"
                                                  : "border border-slate-200 bg-slate-100 text-slate-400"
                                              )}
                                            >
                                              <BookOpen className="h-3 w-3" />
                                              <span>{hasNotes ? "Notes / Key Concepts ✓" : "No Notes"}</span>
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-8 px-2.5 text-xs font-semibold"
                                            onClick={() => setEditingQuestionRow(q)}
                                            title="Edit question prompt, options, mark scheme, notes, and video"
                                          >
                                            <Pencil className="h-3.5 w-3.5 text-slate-600" />
                                            <span>Edit</span>
                                          </Button>

                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900"
                                            onClick={() => handleRemoveQuestionFromPaper(item, q.id)}
                                            title="Remove from this past paper"
                                          >
                                            <MinusCircle className="h-3.5 w-3.5 text-slate-500" />
                                            <span>Remove</span>
                                          </Button>

                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                                            onClick={() => setQuestionToDelete(q)}
                                            title="Permanently delete this question"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
        description="Add and organize questions for this past paper. Uploaded questions are exclusive to Past Papers."
        onClose={() => !busy && setModalOpen(false)}
        className="sm:max-w-4xl"
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
              Scope
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
                  <span className="text-sm font-semibold">Curriculum</span>
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
              <span className="text-sm font-semibold">Paper code / Variant</span>
              <Input
                value={paperCode}
                onChange={(e) => setPaperCode(e.target.value)}
                placeholder="e.g. Paper 1, Paper 2, Variant 12, P22"
                list="past-paper-code-presets"
              />
              <datalist id="past-paper-code-presets">
                <option value="Paper 1" />
                <option value="Paper 2" />
                <option value="Paper 3" />
                <option value="Paper 4" />
                <option value="Paper 5" />
                <option value="Paper 6" />
                <option value="Variant 11" />
                <option value="Variant 12" />
                <option value="Variant 21" />
                <option value="Variant 22" />
                <option value="Variant 23" />
                <option value="Paper 1 Variant 11" />
                <option value="Paper 1 Variant 12" />
                <option value="Paper 2 Variant 21" />
                <option value="Paper 2 Variant 22" />
              </datalist>
              <p className="text-xs text-muted-foreground">
                Enter paper code or variant (e.g. Paper 1, Paper 2 Variant 12, P22).
              </p>
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
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-border px-3 py-2.5">
              <p className="text-xs text-muted-foreground">
                Need questions that aren’t in Questionbank? Create directly or import from Word, PDF, or Text.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy || isProvisioningStudySet}
                  onClick={openPdfImport}
                >
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Import (Word / PDF / Text)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={busy || isProvisioningStudySet}
                  onClick={openNewQuestion}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  New {questionMode === "WRITTEN" ? "written" : "MCQ"} question
                </Button>
              </div>
            </div>
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
                    No {modeLabel(questionMode).toLowerCase()} questions selected yet. Add some
                    from Available, or create a new one above.
                  </p>
                ) : (
                  <div className={PICKER_LIST_CLASS}>
                    {selectedQuestions.map((q, index) => (
                      <PickerQuestionItem
                        key={q.id}
                        question={q}
                        position={index + 1}
                        details={[
                          questionTypeLabel(q.questionType),
                          `${q.marks} mark${q.marks === 1 ? "" : "s"}`,
                        ]}
                        action={
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
                        }
                      />
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
                        ? "No written (Short answer / Data) questions in this program yet. Create one with “New written question” above."
                        : "No MCQ questions in this program yet. Create one with “New MCQ question” above."
                      : selectedQuestionIds.length > 0
                        ? "All matching questions are already selected."
                        : "No questions match this topic/subtopic filter."}
                  </p>
                ) : (
                  <div className={PICKER_LIST_CLASS}>
                    {filteredAvailableQuestions.map((q) => (
                      <PickerQuestionItem
                        key={q.id}
                        question={q}
                        details={[questionTypeLabel(q.questionType), q.difficulty]}
                        action={
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
                        }
                      />
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

      <QbQuestionFormModal
        open={(modalOpen || Boolean(dropdownActionPaper)) && newQuestionOpen}
        onClose={() => {
          setNewQuestionOpen(false);
          setDropdownActionPaper(null);
        }}
        subtopicId={effectiveNewQuestionSubtopicId}
        paperConfig={newQuestionStudySet?.paperConfig ?? {}}
        paperTabs={newQuestionStudySet?.paperTabs ?? []}
        initialPaper={
          dropdownActionPaper
            ? paperKey(parsePaperNumber(dropdownActionPaper.paperCode))
            : paperKey(parsePaperNumber(paperCode))
        }
        lockedKind={dropdownActionPaper ? (dropdownActionPaper.questionMode === "WRITTEN" ? "WRITTEN" : "MCQ") : questionMode}
        pastPaperId={dropdownActionPaper ? dropdownActionPaper.id : (editId || "past-paper")}
        description="Saved exclusively for this past paper. Will not appear in Questionbank."
        header={
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900">
            <span className="font-semibold">Past Paper Exclusive Question</span>
            <p className="mt-0.5 text-[11px] text-blue-700">
              This question will be saved only for this past paper and will not show up in the Questionbank.
            </p>
          </div>
        }
        onSaved={async (saved) => {
          setNewQuestionOpen(false);
          if (dropdownActionPaper) {
            const currentSections = dropdownActionPaper.sections?.length
              ? dropdownActionPaper.sections
              : [{ title: "Section A", order: 0, items: [] }];
            const updatedSections: PastPaperSectionInput[] = currentSections.map((sec, idx) => {
              const existingItems = (sec.items ?? []).map((it, i) => ({
                questionId: it.questionId,
                order: i,
                marks: it.marks ?? undefined,
              }));
              if (idx === 0) {
                return {
                  title: sec.title,
                  code: sec.code || undefined,
                  instructions: sec.instructions || undefined,
                  order: sec.order,
                  items: [
                    ...existingItems,
                    {
                      questionId: saved.id,
                      order: existingItems.length,
                    },
                  ],
                };
              }
              return {
                title: sec.title,
                code: sec.code || undefined,
                instructions: sec.instructions || undefined,
                order: sec.order,
                items: existingItems,
              };
            });
            try {
              await updatePaper.mutateAsync({
                id: dropdownActionPaper.id,
                payload: { sections: updatedSections },
              });
              void refetch();
            } catch (err) {
              console.error(err);
            }
            setDropdownActionPaper(null);
          } else {
            setExtraQuestions((prev) => {
              const next = new Map(prev);
              next.set(saved.id, toPickerRow(saved as unknown as QuestionRowSource, effectiveNewQuestionSubtopicId));
              return next;
            });
            addQuestion(saved.id);
            setPickerTab("selected");
          }
          void refetchQbTopics();
        }}
      />

      <QbPdfImportModal
        open={(modalOpen || Boolean(dropdownActionPaper)) && pdfImportOpen}
        onClose={() => {
          setPdfImportOpen(false);
          setDropdownActionPaper(null);
        }}
        subtopicId={effectiveNewQuestionSubtopicId}
        initialPaper={
          dropdownActionPaper
            ? paperKey(parsePaperNumber(dropdownActionPaper.paperCode))
            : paperKey(parsePaperNumber(paperCode))
        }
        paperTabs={newQuestionStudySet?.paperTabs ?? ["PAPER_1", "PAPER_2"]}
        paperConfig={newQuestionStudySet?.paperConfig ?? {}}
        lockedKind={dropdownActionPaper ? (dropdownActionPaper.questionMode === "WRITTEN" ? "WRITTEN" : "MCQ") : questionMode}
        pastPaperId={dropdownActionPaper ? dropdownActionPaper.id : (editId || "past-paper")}
        header={
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900">
            <span className="font-semibold">Past Paper Exclusive Questions</span>
            <p className="mt-0.5 text-[11px] text-blue-700">
              Questions imported here will belong exclusively to this past paper and will NOT appear in Questionbank.
            </p>
          </div>
        }
        onSuccess={async (_count, createdIds) => {
          setPdfImportOpen(false);
          if (dropdownActionPaper && createdIds && createdIds.length > 0) {
            const currentSections = dropdownActionPaper.sections?.length
              ? dropdownActionPaper.sections
              : [{ title: "Section A", order: 0, items: [] }];
            const updatedSections: PastPaperSectionInput[] = currentSections.map((sec, idx) => {
              const existingItems = (sec.items ?? []).map((it, i) => ({
                questionId: it.questionId,
                order: i,
                marks: it.marks ?? undefined,
              }));
              if (idx === 0) {
                const newItems = [
                  ...existingItems,
                  ...createdIds.map((id, i) => ({
                    questionId: id,
                    order: existingItems.length + i,
                  })),
                ];
                return {
                  title: sec.title,
                  code: sec.code || undefined,
                  instructions: sec.instructions || undefined,
                  order: sec.order,
                  items: newItems,
                };
              }
              return {
                title: sec.title,
                code: sec.code || undefined,
                instructions: sec.instructions || undefined,
                order: sec.order,
                items: existingItems,
              };
            });
            try {
              await updatePaper.mutateAsync({
                id: dropdownActionPaper.id,
                payload: { sections: updatedSections },
              });
              void refetch();
            } catch (err) {
              console.error(err);
            }
            setDropdownActionPaper(null);
          } else if (createdIds && createdIds.length > 0) {
            for (const id of createdIds) {
              addQuestion(id);
            }
            setPickerTab("selected");
          }
          void refetchQbTopics();
        }}
      />

      {/* Edit existing question in Questionbank & Past Paper */}
      <QbQuestionFormModal
        open={Boolean(editingQuestionRow)}
        onClose={() => setEditingQuestionRow(null)}
        question={editingQuestionRow?.raw ?? null}
        subtopicId={editingQuestionRow?.subtopicId ?? effectiveNewQuestionSubtopicId}
        paperConfig={editingQuestionRow?.paperConfig ?? newQuestionStudySet?.paperConfig ?? {}}
        paperTabs={editingQuestionRow?.paperTabs ?? newQuestionStudySet?.paperTabs ?? []}
        lockedKind={editingQuestionRow?.raw?.questionType === "MULTIPLE_CHOICE" ? "MCQ" : "WRITTEN"}
        pastPaperId={editingQuestionRow?.raw?.pastPaperId ?? (dropdownActionPaper ? dropdownActionPaper.id : "past-paper")}
        description="Edit this question for this past paper."
        onSaved={() => {
          setEditingQuestionRow(null);
          void refetchQbTopics();
          void refetch();
        }}
      />

      {/* Permanently delete question */}
      <AdminModal
        open={Boolean(questionToDelete)}
        title="Delete question permanently?"
        description={`Are you sure you want to delete Question #${questionToDelete?.number}? This will permanently remove it from this past paper and from the database.`}
        onClose={() => !deleteQbQuestion.isPending && setQuestionToDelete(null)}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={deleteQbQuestion.isPending}
              onClick={() => setQuestionToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteQbQuestion.isPending}
              onClick={async () => {
                if (!questionToDelete) return;
                try {
                  await deleteQbQuestion.mutateAsync(questionToDelete.id);
                  setQuestionToDelete(null);
                  void refetchQbTopics();
                  void refetch();
                } catch (err) {
                  console.error(err);
                }
              }}
            >
              {deleteQbQuestion.isPending ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        }
      >
        <div className="space-y-2 text-sm text-foreground">
          <p className="font-medium line-clamp-3">
            {richTextToPlain(questionToDelete?.prompt ?? "")}
          </p>
          <p className="text-xs text-muted-foreground">
            This cannot be undone. This question will be completely removed.
          </p>
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
