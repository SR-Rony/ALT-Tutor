"use client";

import { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  ImageIcon,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/slugify";
import {
  useAdminQuestionbank,
  useAdminSubjectsTree,
  useCreateQbQuestion,
  useCreateQbSubtopic,
  useCreateQbTopic,
  useDeleteQbQuestion,
  useDeleteQbSubtopic,
  useDeleteQbTopic,
  useImportQbQuestions,
  useUpdateQbQuestion,
  useUpdateQbSubtopic,
  useUpdateQbTopic,
} from "@/hooks";
import { uploadService } from "@/services/upload.service";
import type { ApiError } from "@/types";
import type { QbImportResult } from "@/services/questionbank-admin.types";
import type { QbDifficulty, QbPaper, QbQuestion, QbTopic } from "@/types/qb.types";
import { cn } from "@/utils";

const DIFFICULTIES: QbDifficulty[] = ["EASY", "MEDIUM", "HARD"];
const PAPERS: QbPaper[] = ["PAPER_1", "PAPER_2", "PAPER_3"];

const EXCEL_TEMPLATE_HEADERS = [
  "number",
  "prompt",
  "body",
  "diagramUrl",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "correctAnswer",
  "difficulty",
  "paper",
  "questionType",
  "markScheme",
  "videoUrl",
  "calculatorAllowed",
] as const;

const EXCEL_TEMPLATE_SAMPLE = [
  "1",
  "The diagram below shows a car of mass m descending a slope. The magnitude of the acceleration is given by",
  "Choose the correct acceleration.",
  "https://example.com/car-slope-diagram.png",
  "3.0 m s^-2",
  "6.0 m s^-2",
  "9.0 m s^-2",
  "81 m s^-2",
  "B",
  "EASY",
  "PAPER_1",
  "MULTIPLE_CHOICE",
  "Correct answer B. Use s = ut + 1/2 at^2 with u=0.",
  "https://www.youtube.com/watch?v=example",
  "TRUE",
];

function downloadExcelTemplate() {
  downloadExcelFile(
    "questionbank-import-template.xls",
    [...EXCEL_TEMPLATE_HEADERS],
    [[...EXCEL_TEMPLATE_SAMPLE]]
  );
}

function downloadExcelFile(filename: string, headers: string[], dataRows: string[][]) {
  const rows = [headers, ...dataRows];
  const sheetRows = rows
    .map(
      (row) =>
        `<Row>${row
          .map((value) => `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`)
          .join("")}</Row>`
    )
    .join("");
  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Questions"><Table>${sheetRows}</Table></Worksheet>
</Workbook>`;
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function questionToExcelRow(question: QbQuestion, serial: number): string[] {
  return [
    String(serial),
    question.prompt,
    question.body ?? "",
    question.diagramUrl ?? "",
    question.options[0] ?? "",
    question.options[1] ?? "",
    question.options[2] ?? "",
    question.options[3] ?? "",
    question.correctAnswer,
    String(question.difficulty),
    String(question.paper),
    String(question.questionType),
    question.markScheme ?? "",
    question.videoUrl ?? "",
    question.calculatorAllowed ? "TRUE" : "FALSE",
  ];
}

function safeExcelFilename(value: string) {
  const safe = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return safe || "questionbank";
}

function downloadStudySetQuestions(title: string, questions: QbQuestion[]) {
  downloadExcelFile(
    `${safeExcelFilename(title)}-questions.xls`,
    [...EXCEL_TEMPLATE_HEADERS],
    questions.map((question, index) => questionToExcelRow(question, index + 1))
  );
}

function downloadProgramQuestions(programName: string, topics: QbTopic[]) {
  const headers = ["theme", "studySet", ...EXCEL_TEMPLATE_HEADERS];
  const rows = topics.flatMap((topic) =>
    topic.subtopics.flatMap((subtopic) =>
      (subtopic.questions ?? []).map((question, index) => [
        topic.title,
        subtopic.title,
        ...questionToExcelRow(question, index + 1),
      ])
    )
  );
  downloadExcelFile(`${safeExcelFilename(programName)}-all-questions.xls`, headers, rows);
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const OPTION_LABELS = ["A1", "A2", "A3", "A4"] as const;
const LETTERS = ["A", "B", "C", "D"] as const;

function AdminQuestionDropdown({
  question,
  displayNumber,
  onDelete,
  onEdit,
  onToggleHide,
  togglePending,
}: {
  question: QbQuestion;
  displayNumber: number;
  onDelete: () => void;
  onEdit: () => void;
  onToggleHide: () => void;
  togglePending: boolean;
}) {
  const [open, setOpen] = useState(false);
  /** -1 = problem view, 0+ = option A1/A2/... */
  const [step, setStep] = useState(-1);
  const maxStep = Math.max(question.options.length - 1, -1);
  const optionLetter =
    step >= 0 ? (LETTERS[step] ?? String(step + 1)) : null;
  const isCorrect =
    optionLetter !== null &&
    optionLetter.toUpperCase() === question.correctAnswer.toUpperCase();

  const goPrev = () => setStep((s) => Math.max(-1, s - 1));
  const goNext = () => setStep((s) => Math.min(maxStep, s + 1));

  return (
    <li
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-card",
        !question.isActive && "border-dashed opacity-70"
      )}
    >
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setStep(-1);
          }}
          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-muted/40"
          aria-expanded={open}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-primary transition",
              open ? "rotate-0" : "-rotate-90"
            )}
          />
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-muted-foreground">
            <span className="font-semibold text-foreground">Q{displayNumber}</span>
            <span className="text-xs uppercase">
              {String(question.difficulty).toLowerCase()} ·{" "}
              {String(question.paper).replace("_", " ")}
            </span>
            <span className="truncate text-muted-foreground">
              — {question.prompt.slice(0, 72)}
              {question.prompt.length > 72 ? "…" : ""}
            </span>
            {question.diagramUrl ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                <ImageIcon className="h-3 w-3" /> Img
              </span>
            ) : null}
            {question.videoUrl ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                <Video className="h-3 w-3" /> Video
              </span>
            ) : null}
            {question.markScheme ? (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Scheme
              </span>
            ) : null}
            {!question.isActive ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#fff1ee] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                <EyeOff className="h-3 w-3" /> Hidden
              </span>
            ) : null}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-0.5 pr-2">
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-primary-muted hover:text-primary"
            title="Edit question"
            aria-label="Edit question"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
            title={question.isActive ? "Hide from students" : "Show to students"}
            aria-label={question.isActive ? "Hide question" : "Show question"}
            disabled={togglePending}
            onClick={onToggleHide}
          >
            {question.isActive ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-accent" />
            )}
          </button>
          <button
            type="button"
            className="rounded-md p-1.5 text-accent transition hover:bg-[#fff1ee]"
            title="Delete question"
            aria-label="Delete question"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-muted/20 px-3 py-3">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(-1)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
                step === -1
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              )}
            >
              Problem
            </button>
            {question.options.map((_, i) => (
              <button
                key={OPTION_LABELS[i] ?? i}
                type="button"
                onClick={() => setStep(i)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-semibold transition",
                  step === i
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                )}
              >
                {OPTION_LABELS[i] ?? `A${i + 1}`}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={step <= -1}
                onClick={goPrev}
                className="h-8 px-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={step >= maxStep}
                onClick={goNext}
                className="h-8 px-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {step === -1 ? (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Full problem
              </p>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {question.prompt}
              </p>
              {question.body ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{question.body}</p>
              ) : null}
              {question.diagramUrl ? (
                <div className="overflow-hidden rounded-lg border border-border bg-muted/30 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={question.diagramUrl}
                    alt={`Q${displayNumber} stimulus`}
                    className="mx-auto max-h-56 object-contain"
                  />
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>
                  Answer:{" "}
                  <strong className="text-foreground">{question.correctAnswer.toUpperCase()}</strong>
                </span>
                {question.markScheme ? <span>Mark scheme available</span> : null}
                {question.videoUrl ? <span>Video solution available</span> : null}
              </div>
              <Button type="button" size="sm" onClick={() => setStep(0)} disabled={maxStep < 0}>
                Next: A1
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Option {OPTION_LABELS[step] ?? `A${step + 1}`}{" "}
                  <span className="text-muted-foreground">({optionLetter})</span>
                </p>
                {isCorrect ? (
                  <span className="rounded-md bg-[#ecfdf3] px-2 py-0.5 text-[11px] font-bold uppercase text-accent-green">
                    Correct answer
                  </span>
                ) : null}
              </div>
              <p className="text-sm leading-relaxed text-foreground">
                {question.options[step]}
              </p>
              {question.markScheme && isCorrect ? (
                <div className="rounded-lg border border-primary/20 bg-primary-muted/40 p-3 text-sm text-foreground">
                  <p className="mb-1 text-xs font-semibold uppercase text-primary">Mark scheme</p>
                  <p className="whitespace-pre-wrap">{question.markScheme}</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </li>
  );
}

export function AdminQuestionbankPage() {
  const { data: subjectsTree = [] } = useAdminSubjectsTree();

  const [categoryId, setCategoryId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [programId, setProgramId] = useState("");

  const effectiveCategoryId = categoryId || subjectsTree[0]?.id || "";
  const subjects = useMemo(() => {
    const category = subjectsTree.find((c) => c.id === effectiveCategoryId);
    return category?.subjects ?? [];
  }, [subjectsTree, effectiveCategoryId]);

  const effectiveSubjectId = subjectId || subjects[0]?.id || "";
  const programs = useMemo(() => {
    const subject = subjects.find((s) => s.id === effectiveSubjectId);
    return subject?.programs ?? [];
  }, [subjects, effectiveSubjectId]);

  const effectiveProgramId = programId || programs[0]?.id || "";
  const { data: topics = [], isLoading, error, refetch, isFetching } = useAdminQuestionbank(
    effectiveProgramId || undefined
  );

  /** ids marked true = collapsed (default is open) */
  const [collapsedTopics, setCollapsedTopics] = useState<Record<string, boolean>>({});
  const [collapsedSubtopics, setCollapsedSubtopics] = useState<Record<string, boolean>>({});

  const toggleTopic = (id: string) => {
    setCollapsedTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSubtopic = (id: string) => {
    setCollapsedSubtopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const createTopic = useCreateQbTopic();
  const updateTopic = useUpdateQbTopic();
  const deleteTopic = useDeleteQbTopic();
  const createSubtopic = useCreateQbSubtopic();
  const updateSubtopic = useUpdateQbSubtopic();
  const deleteSubtopic = useDeleteQbSubtopic();
  const createQuestion = useCreateQbQuestion();
  const updateQuestion = useUpdateQbQuestion();
  const deleteQuestion = useDeleteQbQuestion();
  const importQuestions = useImportQbQuestions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const diagramUploadRef = useRef<HTMLInputElement>(null);
  const videoUploadRef = useRef<HTMLInputElement>(null);

  const [modal, setModal] = useState<
    | null
    | { kind: "topic"; editId?: string }
    | { kind: "subtopic"; topicId: string; editId?: string }
    | { kind: "question"; subtopicId: string; editId?: string }
    | { kind: "import"; subtopicId: string; title: string }
  >(null);
  const [importResult, setImportResult] = useState<QbImportResult | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [optionsText, setOptionsText] = useState("Option A\nOption B\nOption C\nOption D");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [difficulty, setDifficulty] = useState<QbDifficulty>("EASY");
  const [paper, setPaper] = useState<QbPaper>("PAPER_1");
  const [markScheme, setMarkScheme] = useState("");
  const [diagramUrl, setDiagramUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadingField, setUploadingField] = useState<"diagram" | "video" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const busy =
    createTopic.isPending ||
    updateTopic.isPending ||
    deleteTopic.isPending ||
    createSubtopic.isPending ||
    updateSubtopic.isPending ||
    deleteSubtopic.isPending ||
    createQuestion.isPending ||
    updateQuestion.isPending ||
    deleteQuestion.isPending ||
    importQuestions.isPending ||
    uploadingField !== null;

  const resetQuestionForm = () => {
    setPrompt("");
    setOptionsText("Option A\nOption B\nOption C\nOption D");
    setCorrectAnswer("A");
    setDifficulty("EASY");
    setPaper("PAPER_1");
    setMarkScheme("");
    setDiagramUrl("");
    setVideoUrl("");
  };

  const openEditTopic = (topic: QbTopic) => {
    setActionError(null);
    setModal({ kind: "topic", editId: topic.id });
    setTitle(topic.title);
    setSlug(topic.slug);
    setDescription(topic.description ?? "");
  };

  const openEditSubtopic = (topicId: string, subtopic: QbTopic["subtopics"][number]) => {
    setActionError(null);
    setModal({ kind: "subtopic", topicId, editId: subtopic.id });
    setTitle(subtopic.title);
    setSlug(subtopic.slug);
    setDescription(subtopic.description ?? "");
  };

  const openEditQuestion = (question: QbQuestion) => {
    setActionError(null);
    setModal({ kind: "question", subtopicId: question.subtopicId, editId: question.id });
    setPrompt(question.prompt);
    setOptionsText(question.options.join("\n"));
    setCorrectAnswer(question.correctAnswer.toUpperCase());
    setDifficulty((question.difficulty as QbDifficulty) || "EASY");
    setPaper((question.paper as QbPaper) || "PAPER_1");
    setMarkScheme(question.markScheme ?? "");
    setDiagramUrl(question.diagramUrl ?? "");
    setVideoUrl(question.videoUrl ?? "");
  };

  const toggleQuestionVisibility = (question: QbQuestion) => {
    void updateQuestion.mutateAsync({
      id: question.id,
      payload: { isActive: !question.isActive },
    });
  };

  const toggleTopicVisibility = (topic: QbTopic) => {
    void updateTopic.mutateAsync({
      id: topic.id,
      payload: { isActive: !topic.isActive },
    });
  };

  const toggleSubtopicVisibility = (subtopic: QbTopic["subtopics"][number]) => {
    void updateSubtopic.mutateAsync({
      id: subtopic.id,
      payload: { isActive: !subtopic.isActive },
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

  const onImportFile = async (file: File | undefined) => {
    if (!file || modal?.kind !== "import") return;
    setActionError(null);
    setImportResult(null);
    try {
      const result = await importQuestions.mutateAsync({
        subtopicId: modal.subtopicId,
        file,
      });
      setImportResult(result);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to import Excel");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSave = async () => {
    if (!modal || !effectiveProgramId) return;
    setActionError(null);
    try {
      if (modal.kind === "topic") {
        const payload = {
          title: title.trim(),
          slug: slug.trim() || slugify(title),
          description: description.trim() || undefined,
        };
        if (modal.editId) {
          await updateTopic.mutateAsync({ id: modal.editId, payload });
        } else {
          await createTopic.mutateAsync({
            programId: effectiveProgramId,
            ...payload,
            number: (topics.length || 0) + 1,
            order: topics.length,
          });
        }
      }
      if (modal.kind === "subtopic") {
        const payload = {
          title: title.trim(),
          slug: slug.trim() || slugify(title),
          description: description.trim() || undefined,
        };
        if (modal.editId) {
          await updateSubtopic.mutateAsync({ id: modal.editId, payload });
        } else {
          await createSubtopic.mutateAsync({
            topicId: modal.topicId,
            ...payload,
          });
        }
      }
      if (modal.kind === "question") {
        const options = optionsText
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        const questionPayload = {
          prompt: prompt.trim(),
          options,
          correctAnswer: correctAnswer.trim().toUpperCase(),
          difficulty,
          paper,
          markScheme: markScheme.trim() || undefined,
          diagramUrl: diagramUrl.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
        };
        if (modal.editId) {
          await updateQuestion.mutateAsync({ id: modal.editId, payload: questionPayload });
        } else {
          await createQuestion.mutateAsync({
            subtopicId: modal.subtopicId,
            number: Date.now() % 1000,
            ...questionPayload,
            calculatorAllowed: true,
          });
        }
      }
      setModal(null);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save");
    }
  };

  if (isLoading && topics.length === 0 && programs.length > 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Questionbank" description="Manage topics and Easy/Medium/Hard questions." className="mb-0" />
        <PageLoader label="Loading questionbank..." />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="Questionbank"
              description="Admin full access — themes, study sets, Excel import, diagrams, and video solutions."
              className="mb-0"
            />
            <div className="flex flex-wrap items-center gap-2">
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
                onClick={downloadExcelTemplate}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Download Template
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={topics.every((topic) =>
                  topic.subtopics.every((subtopic) => !(subtopic.questions?.length ?? 0))
                )}
                onClick={() =>
                  downloadProgramQuestions(
                    programs.find((program) => program.id === effectiveProgramId)?.name ??
                      "questionbank",
                    topics
                  )
                }
              >
                <Download className="h-4 w-4" />
                Download All Questions
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!effectiveProgramId}
                onClick={() => {
                  setModal({ kind: "topic" });
                  setTitle("");
                  setSlug("");
                  setDescription("");
                }}
              >
                <Plus className="h-4 w-4" />
                Add theme
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
                {subjectsTree.length === 0 ? <option value="">No categories</option> : null}
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
                {subjects.length === 0 ? <option value="">No subjects</option> : null}
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
                {programs.length === 0 ? <option value="">No programs</option> : null}
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error ? (
            <p className="mt-2 text-sm text-accent">{(error as unknown as ApiError)?.message}</p>
          ) : null}
        </div>

        <div className="space-y-4 p-5">
          {topics.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No topics yet. Add a theme to start.</p>
          ) : null}

          {topics.map((topic) => {
            const isTopicOpen = !collapsedTopics[topic.id];
            return (
              <div
                key={topic.id}
                className={cn(
                  "overflow-hidden rounded-xl border border-border",
                  !topic.isActive && "border-dashed opacity-70"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 bg-card px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleTopic(topic.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    aria-expanded={isTopicOpen}
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-primary transition",
                        isTopicOpen ? "rotate-0" : "-rotate-90"
                      )}
                    />
                    <div>
                      <p className="text-xs font-semibold uppercase text-primary">
                        Theme {topic.number}
                      </p>
                      <h3 className="flex items-center gap-2 font-semibold text-foreground">
                        {topic.title}
                        {!topic.isActive ? (
                          <span className="rounded-md bg-[#fff1ee] px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent">
                            Hidden
                          </span>
                        ) : null}
                      </h3>
                    </div>
                  </button>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setModal({ kind: "subtopic", topicId: topic.id });
                        setTitle("");
                        setSlug("");
                        setDescription("");
                      }}
                    >
                      Add study set
                    </Button>
                    <button
                      type="button"
                      className="rounded-md p-2 text-muted-foreground transition hover:bg-primary-muted hover:text-primary"
                      title="Edit theme"
                      aria-label="Edit theme"
                      onClick={() => openEditTopic(topic)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                      title={topic.isActive ? "Hide theme" : "Show theme"}
                      aria-label={topic.isActive ? "Hide theme" : "Show theme"}
                      disabled={updateTopic.isPending}
                      onClick={() => toggleTopicVisibility(topic)}
                    >
                      {topic.isActive ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-accent" />
                      )}
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-accent"
                      onClick={() => {
                        if (window.confirm(`Delete theme "${topic.title}"?`)) {
                          void deleteTopic.mutateAsync(topic.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isTopicOpen ? (
                  <div className="space-y-3 border-t border-border bg-muted/20 p-3">
                    {topic.subtopics.map((sub) => {
                      const isSubOpen = !collapsedSubtopics[sub.id];
                      return (
                        <div
                          key={sub.id}
                          className={cn(
                            "overflow-hidden rounded-lg border border-border/70 bg-card",
                            !sub.isActive && "border-dashed opacity-70"
                          )}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 items-center gap-2 text-left"
                              onClick={() => toggleSubtopic(sub.id)}
                              aria-expanded={isSubOpen}
                            >
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 shrink-0 text-primary transition",
                                  isSubOpen ? "rotate-0" : "-rotate-90"
                                )}
                              />
                              <p className="text-sm font-semibold text-foreground">{sub.title}</p>
                              <span className="text-xs text-muted-foreground">
                                ({sub.questions?.length ?? 0})
                              </span>
                              {!sub.isActive ? (
                                <span className="rounded-md bg-[#fff1ee] px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent">
                                  Hidden
                                </span>
                              ) : null}
                            </button>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={!(sub.questions?.length ?? 0)}
                                onClick={() =>
                                  downloadStudySetQuestions(sub.title, sub.questions ?? [])
                                }
                              >
                                <Download className="h-4 w-4" />
                                Download Questions
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setImportResult(null);
                                  setActionError(null);
                                  setModal({
                                    kind: "import",
                                    subtopicId: sub.id,
                                    title: sub.title,
                                  });
                                }}
                              >
                                <Upload className="h-4 w-4" />
                                Upload Excel
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setModal({ kind: "question", subtopicId: sub.id });
                                  resetQuestionForm();
                                }}
                              >
                                Add question
                              </Button>
                              <button
                                type="button"
                                className="rounded-md p-2 text-muted-foreground transition hover:bg-primary-muted hover:text-primary"
                                title="Edit study set"
                                aria-label="Edit study set"
                                onClick={() => openEditSubtopic(topic.id, sub)}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                                title={sub.isActive ? "Hide study set" : "Show study set"}
                                aria-label={sub.isActive ? "Hide study set" : "Show study set"}
                                disabled={updateSubtopic.isPending}
                                onClick={() => toggleSubtopicVisibility(sub)}
                              >
                                {sub.isActive ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4 text-accent" />
                                )}
                              </button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="text-accent"
                                onClick={() => {
                                  if (window.confirm(`Delete "${sub.title}"?`)) {
                                    void deleteSubtopic.mutateAsync(sub.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {isSubOpen ? (
                            <ul className="space-y-2 border-t border-border px-3 py-2">
                              {(sub.questions ?? []).length === 0 ? (
                                <li className="py-3 text-center text-sm text-muted-foreground">
                                  No questions yet.
                                </li>
                              ) : null}
                              {(sub.questions ?? []).map((q, questionIndex) => (
                                <AdminQuestionDropdown
                                  key={q.id}
                                  question={q}
                                  displayNumber={questionIndex + 1}
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
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <AdminModal
        open={Boolean(modal)}
        title={
          modal?.kind === "topic"
            ? modal.editId
              ? "Edit theme"
              : "Add theme"
            : modal?.kind === "subtopic"
              ? modal.editId
                ? "Edit study set"
                : "Add study set"
              : modal?.kind === "import"
                ? "Upload Excel"
                : modal?.kind === "question" && modal.editId
                  ? "Edit question"
                  : "Add question"
        }
        description={
          modal?.kind === "import"
            ? "Put image + video as public URLs in the sheet. Questions appear on the study page automatically."
            : modal?.kind === "question"
              ? "Add stimulus image URL, mark scheme, and short video solution."
              : "Visible on the public Questionbank with Easy / Medium / Hard filters."
        }
        onClose={() => !busy && setModal(null)}
        className={modal?.kind === "question" || modal?.kind === "import" ? "sm:max-w-2xl" : "sm:max-w-xl"}
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
              <Button type="button" disabled={busy} onClick={() => void onSave()}>
                {busy ? "Saving..." : "Save"}
              </Button>
            </div>
          )
        }
      >
        {modal?.kind === "import" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                {modal.title}
              </div>
              <p className="text-sm text-muted-foreground">
                Columns: prompt, diagramUrl (stimulus image link), optionA–D, correctAnswer,
                markScheme, videoUrl (solution video link), difficulty, paper.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Question numbers are assigned automatically in row order (Q1, Q2, Q3...). A later
                upload continues from the last question number. Paste public https links for bulk
                image/video import.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              className="hidden"
              onChange={(e) => void onImportFile(e.target.files?.[0])}
            />
            <Button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4" />
              {importQuestions.isPending ? "Importing..." : "Choose Excel / CSV file"}
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={downloadExcelTemplate}>
              <Download className="h-4 w-4" />
              Download Excel template
            </Button>
            {importResult ? (
              <div className="rounded-xl border border-accent-green/30 bg-[#ecfdf3] p-3 text-sm text-foreground">
                <p className="font-semibold text-accent-green">
                  Imported {importResult.imported} question{importResult.imported === 1 ? "" : "s"}
                </p>
                {importResult.skipped > 0 ? (
                  <p className="mt-1 text-muted-foreground">
                    Skipped {importResult.skipped} row(s)
                    {importResult.errors?.length
                      ? `: ${importResult.errors
                          .slice(0, 3)
                          .map((e) => `row ${e.row} (${e.message})`)
                          .join("; ")}`
                      : ""}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : modal?.kind === "question" ? (
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Prompt</span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              />
            </label>

            <div className="space-y-1.5">
              <span className="text-sm font-semibold">Stimulus image (diagramUrl)</span>
              <div className="flex gap-2">
                <Input
                  value={diagramUrl}
                  onChange={(e) => setDiagramUrl(e.target.value)}
                  placeholder="https://... image URL"
                />
                <input
                  ref={diagramUploadRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void onUploadMedia("diagram", e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => diagramUploadRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4" />
                  {uploadingField === "diagram" ? "..." : "Upload"}
                </Button>
              </div>
              {diagramUrl ? (
                <div className="overflow-hidden rounded-lg border border-border bg-muted/20 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={diagramUrl} alt="Diagram preview" className="mx-auto max-h-40 object-contain" />
                </div>
              ) : null}
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Options (one per line)</span>
              <textarea
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Answer</span>
                <Input value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} />
              </label>
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
                  onChange={(e) => setPaper(e.target.value as QbPaper)}
                  className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                >
                  {PAPERS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Mark scheme</span>
              <textarea
                value={markScheme}
                onChange={(e) => setMarkScheme(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                placeholder="Step-by-step solution shown in the Mark Scheme modal"
              />
            </label>

            <div className="space-y-1.5">
              <span className="text-sm font-semibold">Video solution (videoUrl)</span>
              <div className="flex gap-2">
                <Input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/... or .mp4 URL"
                />
                <input
                  ref={videoUploadRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => void onUploadMedia("video", e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => videoUploadRef.current?.click()}
                >
                  <Video className="h-4 w-4" />
                  {uploadingField === "video" ? "..." : "Upload"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Title</span>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSlug(slugify(e.target.value));
                }}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Slug</span>
              <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Description</span>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
          </div>
        )}
        {actionError ? <p className="mt-3 text-sm text-accent">{actionError}</p> : null}
      </AdminModal>
    </>
  );
}
