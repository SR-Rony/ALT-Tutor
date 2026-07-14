"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  FileText,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCourseCurriculum,
  useCreateChapter,
  useCreateLesson,
  useDeleteChapter,
  useDeleteLesson,
  useUpdateChapter,
  useUpdateLesson,
} from "@/hooks/use-curriculum";
import { formatLessonDuration } from "@/lib/course-format";
import type { ApiError } from "@/types";
import type {
  CurriculumChapter,
  CurriculumLesson,
  LessonType,
} from "@/types/curriculum.types";
import { cn } from "@/utils";

const LESSON_TYPES: LessonType[] = ["VIDEO", "PDF", "TEXT"];

type CourseCurriculumManagerProps = {
  courseId: string;
  courseTitle?: string;
};

type ChapterForm = {
  title: string;
  description: string;
  order: string;
  isPublished: boolean;
};
type LessonForm = {
  title: string;
  type: LessonType;
  contentUrl: string;
  duration: string;
  order: string;
};

const emptyChapter: ChapterForm = {
  title: "",
  description: "",
  order: "0",
  isPublished: true,
};
const emptyLesson: LessonForm = {
  title: "",
  type: "VIDEO",
  contentUrl: "",
  duration: "",
  order: "0",
};

function fieldClass() {
  return "flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15";
}

export function CourseCurriculumManager({ courseId, courseTitle }: CourseCurriculumManagerProps) {
  const { data: chapters = [], isLoading, error, refetch } = useCourseCurriculum(courseId);
  const createChapter = useCreateChapter(courseId);
  const updateChapter = useUpdateChapter(courseId);
  const deleteChapter = useDeleteChapter(courseId);
  const createLesson = useCreateLesson(courseId);
  const updateLesson = useUpdateLesson(courseId);
  const deleteLesson = useDeleteLesson(courseId);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const [chapterModal, setChapterModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<CurriculumChapter | null>(null);
  const [chapterForm, setChapterForm] = useState<ChapterForm>(emptyChapter);

  const [lessonModal, setLessonModal] = useState(false);
  const [lessonChapterId, setLessonChapterId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<CurriculumLesson | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLesson);

  const busy =
    createChapter.isPending ||
    updateChapter.isPending ||
    deleteChapter.isPending ||
    createLesson.isPending ||
    updateLesson.isPending ||
    deleteLesson.isPending;

  const nextChapterOrder = useMemo(
    () => (chapters.length ? Math.max(...chapters.map((c) => c.order || 0)) + 1 : 1),
    [chapters]
  );

  const openCreateChapter = () => {
    setEditingChapter(null);
    setChapterForm({
      title: "",
      description: "",
      order: String(nextChapterOrder),
      isPublished: true,
    });
    setActionError(null);
    setChapterModal(true);
  };

  const openEditChapter = (chapter: CurriculumChapter) => {
    setEditingChapter(chapter);
    setChapterForm({
      title: chapter.title,
      description: chapter.description ?? "",
      order: String(chapter.order ?? 0),
      isPublished: chapter.isPublished ?? true,
    });
    setActionError(null);
    setChapterModal(true);
  };

  const openCreateLesson = (chapter: CurriculumChapter) => {
    const nextOrder = chapter.lessons.length
      ? Math.max(...chapter.lessons.map((l) => l.order || 0)) + 1
      : 1;
    setLessonChapterId(chapter.id);
    setEditingLesson(null);
    setLessonForm({ ...emptyLesson, order: String(nextOrder) });
    setActionError(null);
    setLessonModal(true);
    setExpanded((prev) => ({ ...prev, [chapter.id]: true }));
  };

  const openEditLesson = (chapterId: string, lesson: CurriculumLesson) => {
    setLessonChapterId(chapterId);
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      type: (String(lesson.type).toUpperCase() as LessonType) || "VIDEO",
      contentUrl: lesson.contentUrl ?? "",
      duration: lesson.duration != null ? String(lesson.duration) : "",
      order: String(lesson.order ?? 0),
    });
    setActionError(null);
    setLessonModal(true);
  };

  const onSaveChapter = async () => {
    const title = chapterForm.title.trim();
    if (!title) {
      setActionError("Chapter title is required");
      return;
    }
    const description = chapterForm.description.trim();
    const order = Number(chapterForm.order) || 0;
    const isPublished = chapterForm.isPublished;
    setActionError(null);
    try {
      const payload = {
        title,
        description: description || undefined,
        order,
        isPublished,
      };
      if (editingChapter) {
        await updateChapter.mutateAsync({ id: editingChapter.id, payload });
      } else {
        const created = await createChapter.mutateAsync(payload);
        setExpanded((prev) => ({ ...prev, [created.id]: true }));
      }
      setChapterModal(false);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save chapter");
    }
  };

  const onDeleteChapter = async (chapter: CurriculumChapter) => {
    const confirmed = window.confirm(
      `Delete chapter "${chapter.title}" and all its lessons? This cannot be undone.`
    );
    if (!confirmed) return;
    setActionError(null);
    try {
      await deleteChapter.mutateAsync(chapter.id);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to delete chapter");
    }
  };

  const onSaveLesson = async () => {
    const title = lessonForm.title.trim();
    if (!title || !lessonChapterId) {
      setActionError("Lesson title is required");
      return;
    }
    setActionError(null);
    const payload = {
      title,
      type: lessonForm.type,
      contentUrl: lessonForm.contentUrl.trim() || undefined,
      duration: lessonForm.duration ? Number(lessonForm.duration) : undefined,
      order: Number(lessonForm.order) || 0,
    };
    try {
      if (editingLesson) {
        await updateLesson.mutateAsync({ id: editingLesson.id, payload });
      } else {
        await createLesson.mutateAsync({ ...payload, chapterId: lessonChapterId });
      }
      setLessonModal(false);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save lesson");
    }
  };

  const onDeleteLesson = async (lesson: CurriculumLesson) => {
    const confirmed = window.confirm(`Delete lesson "${lesson.title}"?`);
    if (!confirmed) return;
    setActionError(null);
    try {
      await deleteLesson.mutateAsync(lesson.id);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to delete lesson");
    }
  };

  if (isLoading) {
    return <PageLoader label="Loading curriculum..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Curriculum</h2>
          <p className="text-sm text-muted-foreground">
            {courseTitle
              ? `Chapters and lessons for “${courseTitle}”.`
              : "Manage chapters and lessons for this course."}
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreateChapter}>
          <Plus className="h-4 w-4" aria-hidden />
          Add chapter
        </Button>
      </div>

      {actionError || error ? (
        <p className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-accent">
          {actionError || (error as unknown as ApiError)?.message || "Could not load curriculum"}
          {error && !actionError ? (
            <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
              Retry
            </button>
          ) : null}
        </p>
      ) : null}

      {!chapters.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="font-semibold text-foreground">No chapters yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a chapter, then add video, PDF, or text lessons under it.
          </p>
          <Button type="button" className="mt-5" size="sm" onClick={openCreateChapter}>
            <Plus className="h-4 w-4" aria-hidden />
            Create first chapter
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {chapters.map((chapter, index) => {
            const isOpen = expanded[chapter.id] ?? index === 0;
            return (
              <div
                key={chapter.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, [chapter.id]: !isOpen }))
                    }
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        <span className="mr-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          Ch {index + 1}
                        </span>
                        {chapter.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {chapter.lessons.length} lesson{chapter.lessons.length === 1 ? "" : "s"} ·
                        order {chapter.order}
                        {chapter.isPublished === false ? " · draft" : " · published"}
                      </p>
                      {chapter.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{chapter.description}</p>
                      ) : null}
                    </div>
                  </button>
                  <AdminIconAction
                    label="Add lesson"
                    icon={Plus}
                    tone="success"
                    disabled={busy}
                    onClick={() => openCreateLesson(chapter)}
                  />
                  <AdminIconAction
                    label="Edit chapter"
                    icon={Pencil}
                    tone="primary"
                    disabled={busy}
                    onClick={() => openEditChapter(chapter)}
                  />
                  <AdminIconAction
                    label="Delete chapter"
                    icon={Trash2}
                    tone="danger"
                    disabled={busy}
                    onClick={() => void onDeleteChapter(chapter)}
                  />
                </div>

                {isOpen ? (
                  <ul className="divide-y divide-border">
                    {!chapter.lessons.length ? (
                      <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                        No lessons in this chapter yet.
                      </li>
                    ) : (
                      chapter.lessons.map((lesson) => {
                        const isVideo = String(lesson.type).toUpperCase() === "VIDEO";
                        const duration = formatLessonDuration(lesson.duration);
                        return (
                          <li
                            key={lesson.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30"
                          >
                            {isVideo ? (
                              <PlayCircle className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                            ) : (
                              <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {lesson.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {String(lesson.type).toLowerCase()}
                                {duration ? ` · ${duration}` : ""}
                                {lesson.contentUrl ? " · content set" : " · no content URL"}
                              </p>
                            </div>
                            <AdminIconAction
                              label="Edit lesson"
                              icon={Pencil}
                              tone="primary"
                              disabled={busy}
                              onClick={() => openEditLesson(chapter.id, lesson)}
                            />
                            <AdminIconAction
                              label="Delete lesson"
                              icon={Trash2}
                              tone="danger"
                              disabled={busy}
                              onClick={() => void onDeleteLesson(lesson)}
                            />
                          </li>
                        );
                      })
                    )}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <AdminModal
        open={chapterModal}
        title={editingChapter ? "Update chapter" : "Create chapter"}
        description="Chapters group lessons inside a course."
        onClose={() => !busy && setChapterModal(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setChapterModal(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onSaveChapter()}>
              {busy ? "Saving..." : editingChapter ? "Update" : "Create"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Title</span>
            <Input
              value={chapterForm.title}
              onChange={(e) => setChapterForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Getting Started"
              autoFocus
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Description</span>
            <textarea
              value={chapterForm.description}
              onChange={(e) => setChapterForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Short summary of what this chapter covers..."
              className={cn(fieldClass(), "h-auto py-2.5")}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Order</span>
            <Input
              type="number"
              min={0}
              value={chapterForm.order}
              onChange={(e) => setChapterForm((p) => ({ ...p, order: e.target.value }))}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <input
              type="checkbox"
              checked={chapterForm.isPublished}
              onChange={(e) => setChapterForm((p) => ({ ...p, isPublished: e.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-sm">
              <span className="font-semibold text-foreground">Publish chapter</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Unpublished chapters stay hidden on the public course page.
              </span>
            </span>
          </label>
          {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}
        </div>
      </AdminModal>

      <AdminModal
        open={lessonModal}
        title={editingLesson ? "Update lesson" : "Create lesson"}
        description="Add VIDEO, PDF, or TEXT content under a chapter."
        onClose={() => !busy && setLessonModal(false)}
        className="sm:max-w-lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setLessonModal(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onSaveLesson()}>
              {busy ? "Saving..." : editingLesson ? "Update" : "Create"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Title</span>
            <Input
              value={lessonForm.title}
              onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. JSX & Components"
              autoFocus
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Type</span>
            <select
              value={lessonForm.type}
              onChange={(e) =>
                setLessonForm((p) => ({ ...p, type: e.target.value as LessonType }))
              }
              className={fieldClass()}
            >
              {LESSON_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Content URL</span>
            <Input
              value={lessonForm.contentUrl}
              onChange={(e) => setLessonForm((p) => ({ ...p, contentUrl: e.target.value }))}
              placeholder="https://... or /uploads/..."
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Duration (seconds)</span>
              <Input
                type="number"
                min={0}
                value={lessonForm.duration}
                onChange={(e) => setLessonForm((p) => ({ ...p, duration: e.target.value }))}
                placeholder="720"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">Order</span>
              <Input
                type="number"
                value={lessonForm.order}
                onChange={(e) => setLessonForm((p) => ({ ...p, order: e.target.value }))}
              />
            </label>
          </div>
          {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}
        </div>
      </AdminModal>
    </div>
  );
}
