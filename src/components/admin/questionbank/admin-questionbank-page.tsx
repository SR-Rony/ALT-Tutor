"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ROUTES } from "@/constants";
import { serializeRichText } from "@/lib/rich-text";
import { slugify } from "@/lib/slugify";
import {
  useAdminQuestionbank,
  useAdminSubjectsTree,
  useCreateQbSubtopic,
  useCreateQbTopic,
  useDeleteQbSubtopic,
  useDeleteQbTopic,
  useUpdateQbSubtopic,
  useUpdateQbTopic,
} from "@/hooks";
import type { ApiError } from "@/types";
import {
  ACCESS_TIER_ORDER,
  nextAccessBadge,
  normalizeAccessBadge,
  tierLabel,
} from "@/lib/access-tier";
import type { QbAccessBadge, QbTopic } from "@/types/qb.types";
import { cn } from "@/utils";
import {
  AccessBadgePill,
  countByPaper,
  downloadExcelTemplate,
  downloadProgramQuestions,
} from "./qb-admin-shared";

export function AdminQuestionbankPage() {
  const searchParams = useSearchParams();
  const { data: subjectsTree = [] } = useAdminSubjectsTree();

  const [categoryId, setCategoryId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [programId, setProgramId] = useState("");

  useEffect(() => {
    const fromUrl = searchParams.get("programId");
    if (!fromUrl || subjectsTree.length === 0) return;
    for (const category of subjectsTree) {
      for (const subject of category.subjects) {
        const program = subject.programs.find((item) => item.id === fromUrl);
        if (program) {
          setCategoryId(category.id);
          setSubjectId(subject.id);
          setProgramId(program.id);
          return;
        }
      }
    }
  }, [searchParams, subjectsTree]);

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
  const selectedProgram = programs.find((p) => p.id === effectiveProgramId) ?? programs[0];
  const { data: topics = [], isLoading, error, refetch, isFetching } = useAdminQuestionbank(
    effectiveProgramId || undefined
  );

  const programStats = useMemo(() => {
    let subtopics = 0;
    let questions = 0;
    let hiddenQuestions = 0;
    let freeSets = 0;
    let paidSets = 0;
    for (const topic of topics) {
      for (const sub of topic.subtopics) {
        subtopics += 1;
        const badge = normalizeAccessBadge(sub.badge);
        if (badge === "FREE") freeSets += 1;
        else paidSets += 1;
        for (const q of sub.questions ?? []) {
          questions += 1;
          if (!q.isActive) hiddenQuestions += 1;
        }
      }
    }
    return {
      topics: topics.length,
      subtopics,
      questions,
      hiddenQuestions,
      freeSets,
      paidSets,
      hiddenTopics: topics.filter((t) => !t.isActive).length,
    };
  }, [topics]);

  const [collapsedTopics, setCollapsedTopics] = useState<Record<string, boolean>>({});

  const toggleTopic = (id: string) => {
    setCollapsedTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const createTopic = useCreateQbTopic();
  const updateTopic = useUpdateQbTopic();
  const deleteTopic = useDeleteQbTopic();
  const createSubtopic = useCreateQbSubtopic();
  const updateSubtopic = useUpdateQbSubtopic();
  const deleteSubtopic = useDeleteQbSubtopic();

  const [modal, setModal] = useState<
    | null
    | { kind: "topic"; editId?: string }
    | { kind: "subtopic"; topicId: string; editId?: string }
  >(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [accessBadge, setAccessBadge] = useState<QbAccessBadge>("FREE");
  const [actionError, setActionError] = useState<string | null>(null);

  const busy =
    createTopic.isPending ||
    updateTopic.isPending ||
    deleteTopic.isPending ||
    createSubtopic.isPending ||
    updateSubtopic.isPending ||
    deleteSubtopic.isPending;

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
    setAccessBadge(normalizeAccessBadge(subtopic.badge));
  };

  const toggleTopicVisibility = (topic: QbTopic) => {
    const hiding = topic.isActive;
    if (
      hiding &&
      !window.confirm(
        `Hide topic "${topic.title}" from students? Study sets inside stay saved.`
      )
    ) {
      return;
    }
    void updateTopic.mutateAsync({
      id: topic.id,
      payload: { isActive: !topic.isActive },
    });
  };

  const toggleSubtopicVisibility = (subtopic: QbTopic["subtopics"][number]) => {
    const hiding = subtopic.isActive;
    if (
      hiding &&
      !window.confirm(
        `Hide study set "${subtopic.title}" from students? Questions stay saved.`
      )
    ) {
      return;
    }
    void updateSubtopic.mutateAsync({
      id: subtopic.id,
      payload: { isActive: !subtopic.isActive },
    });
  };

  const toggleSubtopicAccessBadge = (subtopic: QbTopic["subtopics"][number]) => {
    const next = nextAccessBadge(subtopic.badge);
    void updateSubtopic.mutateAsync({
      id: subtopic.id,
      payload: { badge: next },
    });
  };

  const onSave = async () => {
    if (!modal) return;
    setActionError(null);
    try {
      if (modal.kind === "topic") {
        if (!effectiveProgramId) throw new Error("Select a program first");
        const payload = {
          title: title.trim(),
          slug: slug.trim() || slugify(title),
          description: serializeRichText(description) || undefined,
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
          description: serializeRichText(description) || undefined,
          badge: accessBadge,
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
      setModal(null);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save");
    }
  };

  if (isLoading && topics.length === 0 && programs.length > 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Questionbank"
          description="Manage topics and study sets."
          className="mb-0"
        />
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
              description="Pick a subject, manage topics & study sets, then open a study set to manage Paper 1 / 2 / 3 questions."
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
                  downloadProgramQuestions(selectedProgram?.name ?? "questionbank", topics)
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
                Add topic
              </Button>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Manage structure:</span>
            <Link href={ROUTES.admin.categories} className="font-semibold text-primary hover:underline">
              Categories
            </Link>
            <Link href={ROUTES.admin.qbSubjects} className="font-semibold text-primary hover:underline">
              Subjects
            </Link>
            <span className="hidden text-border sm:inline">·</span>
            <span className="inline-flex flex-wrap items-center gap-1.5">
              Access:
              {ACCESS_TIER_ORDER.map((tier) => (
                <AccessBadgePill key={tier} badge={tier} />
              ))}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
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
          </div>

          {error ? (
            <p className="mt-2 text-sm text-accent">{(error as unknown as ApiError)?.message}</p>
          ) : null}

          {effectiveProgramId && selectedProgram ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/15 bg-primary-muted/40 px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  <strong className="text-foreground">{programStats.topics}</strong> topics
                </span>
                <span>
                  <strong className="text-foreground">{programStats.subtopics}</strong> study sets
                </span>
                <span>
                  <strong className="text-foreground">{programStats.questions}</strong> questions
                  {programStats.hiddenQuestions > 0
                    ? ` (${programStats.hiddenQuestions} hidden)`
                    : ""}
                </span>
                <span>
                  Access: <strong className="text-foreground">{programStats.freeSets}</strong> free ·{" "}
                  <strong className="text-foreground">{programStats.paidSets}</strong> paid
                </span>
              </div>
              <Button asChild size="sm" variant="outline" className="border-primary/30">
                <Link
                  href={ROUTES.subjectQuestionbank(selectedProgram.slug)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Preview as student
                </Link>
              </Button>
            </div>
          ) : null}
        </div>

        <div className="space-y-3 p-4 md:p-5">
          {topics.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No topics yet. Add a topic to create study sets.
            </div>
          ) : null}

          {topics.map((topic, topicIndex) => {
            const isTopicOpen = !collapsedTopics[topic.id];
            return (
              <div
                key={topic.id}
                className={cn(
                  "overflow-hidden rounded-xl border border-border bg-primary-muted/20",
                  !topic.isActive && "border-dashed opacity-80"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => toggleTopic(topic.id)}
                    aria-expanded={isTopicOpen}
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-primary transition",
                        isTopicOpen ? "rotate-0" : "-rotate-90"
                      )}
                    />
                    <p className="text-sm font-bold text-foreground md:text-base">
                      Topic {topic.number || topicIndex + 1}: {topic.title}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      ({topic.subtopics.length} study sets)
                    </span>
                    {!topic.isActive ? (
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
                      onClick={() => {
                        setModal({ kind: "subtopic", topicId: topic.id });
                        setTitle("");
                        setSlug("");
                        setDescription("");
                        setAccessBadge("FREE");
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add study set
                    </Button>
                    <button
                      type="button"
                      className="rounded-md p-2 text-muted-foreground transition hover:bg-primary-muted hover:text-primary"
                      title="Edit topic"
                      onClick={() => openEditTopic(topic)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      title={topic.isActive ? "Hide topic" : "Show topic"}
                      onClick={() => toggleTopicVisibility(topic)}
                    >
                      {topic.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-accent" />}
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-accent"
                      onClick={() => {
                        if (window.confirm(`Delete topic "${topic.title}"?`)) {
                          void deleteTopic.mutateAsync(topic.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isTopicOpen ? (
                  <div className="space-y-2 border-t border-border bg-card/60 p-3">
                    {topic.subtopics.length === 0 ? (
                      <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                        No study sets yet.
                      </p>
                    ) : null}

                    {topic.subtopics.map((sub) => {
                      const paperCounts = countByPaper(sub.questions);
                      const total = sub.questions?.length ?? 0;
                      const manageHref = ROUTES.admin.qbStudySet(sub.id, effectiveProgramId);

                      return (
                        <div
                          key={sub.id}
                          className={cn(
                            "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-card px-3 py-3",
                            !sub.isActive && "border-dashed opacity-70"
                          )}
                        >
                          <Link
                            href={manageHref}
                            className="group flex min-w-0 flex-1 items-center gap-2 text-left"
                          >
                            <ChevronRight className="h-4 w-4 shrink-0 text-primary transition group-hover:translate-x-0.5" />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                                  {sub.title}
                                </p>
                                <AccessBadgePill badge={sub.badge} />
                                <span className="text-xs text-muted-foreground">({total})</span>
                                {!sub.isActive ? (
                                  <span className="rounded-md bg-[#fff1ee] px-1.5 py-0.5 text-[10px] font-bold uppercase text-accent">
                                    Hidden
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                P1 {paperCounts.PAPER_1} · P2 {paperCounts.PAPER_2} · P3{" "}
                                {paperCounts.PAPER_3} — click to manage questions
                              </p>
                            </div>
                          </Link>

                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-primary/30 text-primary"
                              disabled={updateSubtopic.isPending}
                              title={`Cycle access → ${tierLabel(nextAccessBadge(sub.badge))}`}
                              onClick={() => toggleSubtopicAccessBadge(sub)}
                            >
                              <AccessBadgePill badge={sub.badge} />
                              <span className="ml-1">
                                Set {tierLabel(nextAccessBadge(sub.badge)).replace(/^ALT\s+/, "")}
                              </span>
                            </Button>
                            <Button asChild size="sm">
                              <Link href={manageHref}>Manage questions</Link>
                            </Button>
                            {selectedProgram?.slug ? (
                              <Button asChild size="sm" variant="outline">
                                <Link
                                  href={ROUTES.subjectQuestionbankStudy(
                                    selectedProgram.slug,
                                    sub.slug
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Preview
                                </Link>
                              </Button>
                            ) : null}
                            <button
                              type="button"
                              className="rounded-md p-2 text-muted-foreground transition hover:bg-primary-muted hover:text-primary"
                              title="Edit study set"
                              onClick={() => openEditSubtopic(topic.id, sub)}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                              title={sub.isActive ? "Hide study set" : "Show study set"}
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
              ? "Edit topic"
              : "Add topic"
            : modal?.editId
              ? "Edit study set"
              : "Add study set"
        }
        description={
          modal?.kind === "subtopic"
            ? "ALT Free is open practice. Silver, Gold, and Diamond need a matching Practice Pass."
            : "Visible on the public Questionbank."
        }
        onClose={() => !busy && setModal(null)}
        className="sm:max-w-xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onSave()}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      >
        {actionError ? <p className="mb-3 text-sm text-accent">{actionError}</p> : null}
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Title</span>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!modal?.editId) setSlug(slugify(e.target.value));
              }}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Slug</span>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </label>
          {modal?.kind === "subtopic" ? (
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Access</span>
              <select
                value={accessBadge}
                onChange={(e) => setAccessBadge(e.target.value as QbAccessBadge)}
                className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                {ACCESS_TIER_ORDER.map((tier) => (
                  <option key={tier} value={tier}>
                    {tierLabel(tier)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Description</span>
            <RichTextEditor value={description} onChange={setDescription} />
          </label>
        </div>
      </AdminModal>
    </>
  );
}
