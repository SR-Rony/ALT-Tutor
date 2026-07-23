"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import {
  useAdminKeyConcepts,
  useAdminQuestionbank,
  useAdminSubjectsTree,
  useCreateKeyConceptLesson,
  useDeleteKeyConceptLesson,
  useUpdateKeyConceptLesson,
} from "@/hooks";
import { normalizeAccessBadge, tierLabel } from "@/lib/access-tier";
import { slugify } from "@/lib/slugify";
import type { ApiError } from "@/types";
import type {
  KeyConceptContentType,
  KeyConceptLesson,
} from "@/types/key-concept.types";
import type { QbAccessBadge } from "@/types/qb.types";
import { cn } from "@/utils";

const CONTENT_TYPES: KeyConceptContentType[] = ["ARTICLE", "VIDEO", "MIXED"];
const TIERS: QbAccessBadge[] = ["FREE", "SILVER", "GOLD", "DIAMOND"];

function contentLabel(type: KeyConceptContentType) {
  if (type === "VIDEO") return "Video";
  if (type === "MIXED") return "Mixed";
  return "Article";
}

function formatDuration(sec?: number | null) {
  if (sec == null || sec <= 0) return null;
  const m = Math.round(sec / 60);
  return `${m} min`;
}

export function AdminKeyConceptsPage() {
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

  const { data, isLoading, error, refetch, isFetching } = useAdminKeyConcepts(
    effectiveProgramId || undefined
  );
  const { data: qbTopics = [] } = useAdminQuestionbank(effectiveProgramId || undefined);
  const createLesson = useCreateKeyConceptLesson();
  const updateLesson = useUpdateKeyConceptLesson();
  const deleteLesson = useDeleteKeyConceptLesson();

  const lessons = data?.lessons ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [topicId, setTopicId] = useState("");
  const [subtopicId, setSubtopicId] = useState("");
  const [contentType, setContentType] = useState<KeyConceptContentType>("ARTICLE");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [durationSec, setDurationSec] = useState("480");
  const [accessTier, setAccessTier] = useState<QbAccessBadge>("FREE");
  const [isPublished, setIsPublished] = useState(false);

  const busy =
    createLesson.isPending || updateLesson.isPending || deleteLesson.isPending;

  const selectedTopic = qbTopics.find((t) => t.id === topicId);
  const subtopics = selectedTopic?.subtopics ?? [];

  useEffect(() => {
    if (!modalOpen || editId) return;
    if (!title.trim()) return;
    setSlug(slugify(title));
  }, [title, modalOpen, editId]);

  const resetForm = () => {
    setEditId(null);
    setTitle("");
    setSlug("");
    setSummary("");
    setTopicId(qbTopics[0]?.id ?? "");
    setSubtopicId("");
    setContentType("ARTICLE");
    setVideoUrl("");
    setThumbnailUrl("");
    setBodyMarkdown("");
    setDurationSec("480");
    setAccessTier("FREE");
    setIsPublished(false);
    setActionError(null);
  };

  const openCreate = () => {
    resetForm();
    setTopicId(qbTopics[0]?.id ?? "");
    setModalOpen(true);
  };

  const openEdit = (item: KeyConceptLesson) => {
    setEditId(item.id);
    setTitle(item.title);
    setSlug(item.slug);
    setSummary(item.summary ?? "");
    setTopicId(item.topicId || item.topic?.id || "");
    setSubtopicId(item.subtopicId || item.subtopic?.id || "");
    setContentType(item.contentType);
    setVideoUrl(item.videoUrl ?? "");
    setThumbnailUrl(item.thumbnailUrl ?? "");
    setBodyMarkdown(item.bodyMarkdown ?? "");
    setDurationSec(item.durationSec != null ? String(item.durationSec) : "");
    setAccessTier(normalizeAccessBadge(item.accessTier));
    setIsPublished(Boolean(item.isPublished));
    setActionError(null);
    setModalOpen(true);
  };

  const onSave = async () => {
    if (!title.trim() || !slug.trim()) {
      setActionError("Title and slug are required");
      return;
    }
    if (!topicId) {
      setActionError("Select a topic");
      return;
    }
    if (!effectiveProgramId) {
      setActionError("Select a program first");
      return;
    }
    setActionError(null);
    const duration = durationSec.trim() ? Number.parseInt(durationSec, 10) : undefined;
    try {
      if (editId) {
        await updateLesson.mutateAsync({
          id: editId,
          payload: {
            title: title.trim(),
            slug: slug.trim(),
            topicId,
            contentType,
            accessTier,
            isPublished,
            subtopicId: subtopicId ? subtopicId : null,
            summary: summary.trim() || null,
            videoUrl: videoUrl.trim() || null,
            thumbnailUrl: thumbnailUrl.trim() || null,
            bodyMarkdown: bodyMarkdown.trim() || null,
            durationSec: Number.isFinite(duration) ? duration! : null,
          },
        });
      } else {
        await createLesson.mutateAsync({
          programId: effectiveProgramId,
          title: title.trim(),
          slug: slug.trim(),
          summary: summary.trim() || undefined,
          topicId,
          subtopicId: subtopicId || undefined,
          contentType,
          videoUrl: videoUrl.trim() || undefined,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          bodyMarkdown: bodyMarkdown.trim() || undefined,
          durationSec: Number.isFinite(duration) ? duration : undefined,
          accessTier,
          isPublished,
        });
      }
      setModalOpen(false);
      resetForm();
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save lesson");
    }
  };

  if (isLoading && lessons.length === 0 && programs.length > 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Key Concepts"
          description="Short lessons (article / video). Practice links go to the Questionbank."
          className="mb-0"
        />
        <PageLoader label="Loading key concepts..." />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="Key Concepts"
              description="Create short lessons with a preview link. Keep forms light — body markdown + optional video."
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
                disabled={!effectiveProgramId || qbTopics.length === 0}
                onClick={openCreate}
              >
                <Plus className="h-4 w-4" />
                New lesson
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
                href={ROUTES.subjectResource(selectedProgram.slug, "key-concepts")}
                className="font-semibold text-primary hover:underline"
                target="_blank"
              >
                /subjects/{selectedProgram.slug}/key-concepts
              </Link>
            </p>
          ) : null}
          {qbTopics.length === 0 && effectiveProgramId ? (
            <p className="mt-2 text-sm text-accent">
              No Questionbank topics yet — add topics before creating lessons.
            </p>
          ) : null}
        </div>

        <div className="space-y-3 p-5">
          {lessons.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No key concept lessons yet. Create one with a short form.
            </p>
          ) : null}
          {lessons.map((item) => (
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
                    {contentLabel(item.contentType)}
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
                  {item.topic?.title ?? "Topic"}
                  {item.subtopic ? ` · ${item.subtopic.title}` : ""}
                  {formatDuration(item.durationSec)
                    ? ` · ${formatDuration(item.durationSec)}`
                    : ""}{" "}
                  · {item.slug}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {selectedProgram && item.isPublished ? (
                  <Link
                    href={ROUTES.subjectResource(selectedProgram.slug, "key-concepts")}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-primary hover:underline"
                    target="_blank"
                    title="Preview student hub"
                  >
                    Preview
                  </Link>
                ) : null}
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
                    void updateLesson.mutateAsync({
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
                      void deleteLesson.mutateAsync(item.id);
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
        title={editId ? "Edit lesson" : "New lesson"}
        description="Short form — basics, content, publish"
        onClose={() => !busy && setModalOpen(false)}
        className="sm:max-w-2xl"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onSave()}>
              {busy ? "Saving…" : editId ? "Save lesson" : "Create lesson"}
            </Button>
          </div>
        }
      >
        {actionError ? (
          <p className="mb-3 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            {actionError}
          </p>
        ) : null}

        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-2">
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
              <span className="text-sm font-semibold">Topic</span>
              <select
                value={topicId}
                onChange={(e) => {
                  setTopicId(e.target.value);
                  setSubtopicId("");
                }}
                className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                <option value="">Select topic</option>
                {qbTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Subtopic (optional)</span>
              <select
                value={subtopicId}
                onChange={(e) => setSubtopicId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                <option value="">None</option>
                {subtopics.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Content type</span>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as KeyConceptContentType)}
                className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {contentLabel(t)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Duration (seconds)</span>
              <Input
                type="number"
                min={0}
                value={durationSec}
                onChange={(e) => setDurationSec(e.target.value)}
                placeholder="e.g. 480"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Summary</span>
            <Input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One-line student-facing blurb"
            />
          </label>

          {(contentType === "VIDEO" || contentType === "MIXED") && (
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Video URL</span>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://…"
              />
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Thumbnail URL (optional)</span>
            <Input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="/images/…"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Body (markdown)</span>
            <textarea
              value={bodyMarkdown}
              onChange={(e) => setBodyMarkdown(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 font-mono text-sm"
              placeholder="## Goal&#10;…"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            Publish now (visible on student Key Concepts)
          </label>
        </div>
      </AdminModal>
    </>
  );
}
