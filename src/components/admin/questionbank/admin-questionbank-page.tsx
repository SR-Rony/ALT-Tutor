import { useMemo, useRef, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  ImageIcon,
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
} from "@/hooks";
import { uploadService } from "@/services/upload.service";
import type { ApiError } from "@/types";
import type { QbImportResult } from "@/services/questionbank-admin.types";
import type { QbDifficulty, QbPaper } from "@/types/qb.types";

const DIFFICULTIES: QbDifficulty[] = ["EASY", "MEDIUM", "HARD"];
const PAPERS: QbPaper[] = ["PAPER_1", "PAPER_2", "PAPER_3"];

const EXCEL_TEMPLATE_HEADERS = [
  "number",
  "prompt",
  "diagramUrl",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "correctAnswer",
  "difficulty",
  "paper",
  "markScheme",
  "videoUrl",
  "calculatorAllowed",
] as const;

const EXCEL_TEMPLATE_SAMPLE = [
  "1",
  "The diagram below shows a car of mass m descending a slope. The magnitude of the acceleration is given by",
  "https://example.com/car-slope-diagram.png",
  "3.0 m s^-2",
  "6.0 m s^-2",
  "9.0 m s^-2",
  "81 m s^-2",
  "B",
  "EASY",
  "PAPER_1",
  "Correct answer B. Use s = ut + 1/2 at^2 with u=0.",
  "https://www.youtube.com/watch?v=example",
  "TRUE",
];

function downloadExcelTemplate() {
  const csv = [EXCEL_TEMPLATE_HEADERS.join(","), EXCEL_TEMPLATE_SAMPLE.map(csvEscape).join(",")].join(
    "\n"
  );
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "questionbank-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function AdminQuestionbankPage() {
  const { data: subjectsTree = [] } = useAdminSubjectsTree();
  const programs = useMemo(
    () =>
      subjectsTree.flatMap((c) =>
        c.subjects.flatMap((s) => s.programs.map((p) => ({ ...p, label: `${c.name} / ${s.name} / ${p.name}` })))
      ),
    [subjectsTree]
  );

  const [programId, setProgramId] = useState<string>("");
  const effectiveProgramId = programId || programs[0]?.id;
  const { data: topics = [], isLoading, error, refetch, isFetching } = useAdminQuestionbank(effectiveProgramId);

  const createTopic = useCreateQbTopic();
  const deleteTopic = useDeleteQbTopic();
  const createSubtopic = useCreateQbSubtopic();
  const deleteSubtopic = useDeleteQbSubtopic();
  const createQuestion = useCreateQbQuestion();
  const deleteQuestion = useDeleteQbQuestion();
  const importQuestions = useImportQbQuestions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const diagramUploadRef = useRef<HTMLInputElement>(null);
  const videoUploadRef = useRef<HTMLInputElement>(null);

  const [modal, setModal] = useState<
    | null
    | { kind: "topic" }
    | { kind: "subtopic"; topicId: string }
    | { kind: "question"; subtopicId: string }
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
    deleteTopic.isPending ||
    createSubtopic.isPending ||
    deleteSubtopic.isPending ||
    createQuestion.isPending ||
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
        await createTopic.mutateAsync({
          programId: effectiveProgramId,
          title: title.trim(),
          slug: slug.trim() || slugify(title),
          description: description.trim() || undefined,
          number: (topics.length || 0) + 1,
          order: topics.length,
        });
      }
      if (modal.kind === "subtopic") {
        await createSubtopic.mutateAsync({
          topicId: modal.topicId,
          title: title.trim(),
          slug: slug.trim() || slugify(title),
          description: description.trim() || undefined,
        });
      }
      if (modal.kind === "question") {
        const options = optionsText
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        await createQuestion.mutateAsync({
          subtopicId: modal.subtopicId,
          number: Date.now() % 1000,
          prompt: prompt.trim(),
          options,
          correctAnswer: correctAnswer.trim().toUpperCase(),
          difficulty,
          paper,
          markScheme: markScheme.trim() || undefined,
          diagramUrl: diagramUrl.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
          calculatorAllowed: true,
        });
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
              <Button type="button" size="sm" variant="outline" onClick={downloadExcelTemplate}>
                <Download className="h-4 w-4" />
                Excel template
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

          <label className="block max-w-xl space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Program
            </span>
            <select
              value={effectiveProgramId ?? ""}
              onChange={(e) => setProgramId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              {programs.length === 0 ? <option value="">No programs</option> : null}
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          {error ? (
            <p className="mt-2 text-sm text-accent">{(error as unknown as ApiError)?.message}</p>
          ) : null}
        </div>

        <div className="space-y-4 p-5">
          {topics.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No topics yet. Add a theme to start.</p>
          ) : null}

          {topics.map((topic) => (
            <div key={topic.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-primary">Theme {topic.number}</p>
                  <h3 className="font-semibold text-foreground">{topic.title}</h3>
                </div>
                <div className="flex gap-2">
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

              <div className="mt-3 space-y-3">
                {topic.subtopics.map((sub) => (
                  <div key={sub.id} className="rounded-lg bg-muted/30 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{sub.title}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setImportResult(null);
                            setActionError(null);
                            setModal({ kind: "import", subtopicId: sub.id, title: sub.title });
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
                    <ul className="mt-2 space-y-1">
                      {(sub.questions ?? []).map((q) => (
                        <li
                          key={q.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-card"
                        >
                          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-muted-foreground">
                            <span className="truncate">
                              Q{q.number} · {String(q.difficulty).toLowerCase()} ·{" "}
                              {String(q.paper).replace("_", " ")} — {q.prompt.slice(0, 70)}
                              {q.prompt.length > 70 ? "…" : ""}
                            </span>
                            {q.diagramUrl ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-md bg-primary-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
                                title="Has stimulus image"
                              >
                                <ImageIcon className="h-3 w-3" /> Img
                              </span>
                            ) : null}
                            {q.videoUrl ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                                title="Has video solution"
                              >
                                <Video className="h-3 w-3" /> Video
                              </span>
                            ) : null}
                            {q.markScheme ? (
                              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Scheme
                              </span>
                            ) : null}
                          </span>
                          <button
                            type="button"
                            className="text-xs text-accent"
                            onClick={() => {
                              if (window.confirm("Delete question?")) {
                                void deleteQuestion.mutateAsync(q.id);
                              }
                            }}
                          >
                            Del
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AdminModal
        open={Boolean(modal)}
        title={
          modal?.kind === "topic"
            ? "Add theme"
            : modal?.kind === "subtopic"
              ? "Add study set"
              : modal?.kind === "import"
                ? "Upload Excel"
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
                Tip: upload images/videos when adding a single question, or paste https links in Excel
                for bulk import.
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
              Download sample template
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
