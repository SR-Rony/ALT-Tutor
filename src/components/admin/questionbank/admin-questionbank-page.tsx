"use client";

import { useMemo, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
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
} from "@/hooks";
import type { ApiError } from "@/types";
import type { QbDifficulty, QbPaper } from "@/types/qb.types";

const DIFFICULTIES: QbDifficulty[] = ["EASY", "MEDIUM", "HARD"];
const PAPERS: QbPaper[] = ["PAPER_1", "PAPER_2", "PAPER_3"];

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

  const [modal, setModal] = useState<
    | null
    | { kind: "topic" }
    | { kind: "subtopic"; topicId: string }
    | { kind: "question"; subtopicId: string }
  >(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [optionsText, setOptionsText] = useState("Option A\nOption B\nOption C\nOption D");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [difficulty, setDifficulty] = useState<QbDifficulty>("EASY");
  const [paper, setPaper] = useState<QbPaper>("PAPER_1");
  const [markScheme, setMarkScheme] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const busy =
    createTopic.isPending ||
    deleteTopic.isPending ||
    createSubtopic.isPending ||
    deleteSubtopic.isPending ||
    createQuestion.isPending ||
    deleteQuestion.isPending;

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
              description="Admin full access — themes, study sets, and filtered Easy/Medium/Hard questions."
              className="mb-0"
            />
            <div className="flex items-center gap-2">
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
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setModal({ kind: "question", subtopicId: sub.id });
                            setPrompt("");
                            setOptionsText("Option A\nOption B\nOption C\nOption D");
                            setCorrectAnswer("A");
                            setDifficulty("EASY");
                            setPaper("PAPER_1");
                            setMarkScheme("");
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
                          <span className="text-muted-foreground">
                            Q{q.number} · {String(q.difficulty).toLowerCase()} · {String(q.paper).replace("_", " ")} —{" "}
                            {q.prompt.slice(0, 80)}
                            {q.prompt.length > 80 ? "…" : ""}
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
              : "Add question"
        }
        description="Visible on the public Questionbank with Easy / Medium / Hard filters."
        onClose={() => !busy && setModal(null)}
        className="sm:max-w-xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onSave()}>
              {busy ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        {modal?.kind === "question" ? (
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
                rows={2}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              />
            </label>
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
