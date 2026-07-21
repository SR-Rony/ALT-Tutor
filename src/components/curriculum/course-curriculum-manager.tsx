"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  FileText,
  Loader2,
  Paperclip,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  useAddLessonAttachment,
  useCourseCurriculum,
  useCreateChapter,
  useCreateLesson,
  useDeleteChapter,
  useDeleteLesson,
  useDeleteLessonAttachment,
  useReorderChapters,
  useReorderLessons,
  useUpdateChapter,
  useUpdateLesson,
} from "@/hooks/use-curriculum";
import { formatLessonDuration } from "@/lib/course-format";
import { serializeRichText } from "@/lib/rich-text";
import { uploadService } from "@/services/upload.service";
import type { ApiError } from "@/types";
import type {
  CurriculumChapter,
  CurriculumLesson,
  LessonType,
} from "@/types/curriculum.types";
import { cn } from "@/utils";

const LESSON_TYPES: LessonType[] = ["VIDEO", "PDF", "TEXT"];

type Props = { courseId: string; courseTitle?: string };

type ChapterForm = {
  title: string;
  description: string;
  isPublished: boolean;
};

type LessonForm = {
  title: string;
  description: string;
  body: string;
  type: LessonType;
  contentUrl: string;
  contentPublicId: string;
  duration: string;
  isPublished: boolean;
  isPreview: boolean;
};

const emptyChapter: ChapterForm = { title: "", description: "", isPublished: true };
const emptyLesson: LessonForm = {
  title: "",
  description: "",
  body: "",
  type: "VIDEO",
  contentUrl: "",
  contentPublicId: "",
  duration: "",
  isPublished: true,
  isPreview: false,
};

function fieldClass() {
  return "flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15";
}

export function CourseCurriculumManager({ courseId, courseTitle }: Props) {
  const { data: chapters = [], isLoading, error, refetch } = useCourseCurriculum(courseId);
  const createChapter = useCreateChapter(courseId);
  const updateChapter = useUpdateChapter(courseId);
  const deleteChapter = useDeleteChapter(courseId);
  const reorderChapters = useReorderChapters(courseId);
  const createLesson = useCreateLesson(courseId);
  const updateLesson = useUpdateLesson(courseId);
  const deleteLesson = useDeleteLesson(courseId);
  const reorderLessons = useReorderLessons(courseId);
  const addAttachment = useAddLessonAttachment(courseId);
  const deleteAttachment = useDeleteLessonAttachment(courseId);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const [chapterModal, setChapterModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<CurriculumChapter | null>(null);
  const [chapterForm, setChapterForm] = useState<ChapterForm>(emptyChapter);
  const [confirmDeleteChapter, setConfirmDeleteChapter] = useState<CurriculumChapter | null>(null);

  const [lessonModal, setLessonModal] = useState(false);
  const [lessonChapterId, setLessonChapterId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<CurriculumLesson | null>(null);
  const [lessonForm, setLessonForm] = useState<LessonForm>(emptyLesson);
  const [confirmDeleteLesson, setConfirmDeleteLesson] = useState<CurriculumLesson | null>(null);

  const busy =
    createChapter.isPending ||
    updateChapter.isPending ||
    deleteChapter.isPending ||
    reorderChapters.isPending ||
    createLesson.isPending ||
    updateLesson.isPending ||
    deleteLesson.isPending ||
    reorderLessons.isPending ||
    addAttachment.isPending ||
    deleteAttachment.isPending ||
    uploading;

  const sortedChapters = useMemo(
    () => [...chapters].sort((a, b) => a.order - b.order),
    [chapters]
  );

  useEffect(() => {
    if (!editingLesson) return;
    for (const chapter of chapters) {
      const found = chapter.lessons.find((l) => l.id === editingLesson.id);
      if (found) {
        setEditingLesson(found);
        break;
      }
    }
  }, [chapters, editingLesson?.id]);

  const openCreateChapter = () => {
    setEditingChapter(null);
    setChapterForm(emptyChapter);
    setActionError(null);
    setChapterModal(true);
  };

  const openEditChapter = (chapter: CurriculumChapter) => {
    setEditingChapter(chapter);
    setChapterForm({
      title: chapter.title,
      description: chapter.description ?? "",
      isPublished: chapter.isPublished ?? true,
    });
    setActionError(null);
    setChapterModal(true);
  };

  const openCreateLesson = (chapter: CurriculumChapter) => {
    setLessonChapterId(chapter.id);
    setEditingLesson(null);
    setLessonForm(emptyLesson);
    setActionError(null);
    setLessonModal(true);
    setExpanded((prev) => ({ ...prev, [chapter.id]: true }));
  };

  const openEditLesson = (chapterId: string, lesson: CurriculumLesson) => {
    setLessonChapterId(chapterId);
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description ?? "",
      body: lesson.body ?? "",
      type: (String(lesson.type).toUpperCase() as LessonType) || "VIDEO",
      contentUrl: lesson.contentUrl ?? "",
      contentPublicId: lesson.contentPublicId ?? "",
      duration: lesson.duration != null ? String(Math.round((lesson.duration || 0) / 60) || "") : "",
      isPublished: lesson.isPublished ?? true,
      isPreview: lesson.isPreview ?? false,
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
    setActionError(null);
    try {
      const payload = {
        title,
        description: serializeRichText(chapterForm.description) || undefined,
        isPublished: chapterForm.isPublished,
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

  const onDeleteChapter = async () => {
    if (!confirmDeleteChapter) return;
    setActionError(null);
    try {
      await deleteChapter.mutateAsync(confirmDeleteChapter.id);
      setConfirmDeleteChapter(null);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to delete chapter");
    }
  };

  const moveChapter = async (index: number, direction: -1 | 1) => {
    const next = index + direction;
    if (next < 0 || next >= sortedChapters.length) return;
    const ids = sortedChapters.map((c) => c.id);
    [ids[index], ids[next]] = [ids[next], ids[index]];
    try {
      await reorderChapters.mutateAsync(ids);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to reorder chapters");
    }
  };

  const moveLesson = async (chapter: CurriculumChapter, index: number, direction: -1 | 1) => {
    const lessons = [...chapter.lessons].sort((a, b) => a.order - b.order);
    const next = index + direction;
    if (next < 0 || next >= lessons.length) return;
    const ids = lessons.map((l) => l.id);
    [ids[index], ids[next]] = [ids[next], ids[index]];
    try {
      await reorderLessons.mutateAsync({ chapterId: chapter.id, lessonIds: ids });
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to reorder lessons");
    }
  };

  const onUploadContent = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setActionError(null);
    try {
      const result = await uploadService.upload(file, "lessons", setUploadProgress);
      setLessonForm((prev) => ({
        ...prev,
        contentUrl: result.url,
        contentPublicId: result.publicId,
        type: file.type.startsWith("video/")
          ? "VIDEO"
          : file.type === "application/pdf"
            ? "PDF"
            : prev.type,
      }));
    } catch (err) {
      setActionError((err as ApiError)?.message || "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const onUploadAttachment = async (file: File) => {
    if (!editingLesson) {
      setActionError("Save the lesson first, then add attachments.");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setActionError(null);
    try {
      const result = await uploadService.upload(file, "lessons", setUploadProgress);
      await addAttachment.mutateAsync({
        lessonId: editingLesson.id,
        payload: {
          filename: result.filename || file.name,
          url: result.url,
          publicId: result.publicId,
          mimeType: result.mimeType || file.type,
          size: result.size ?? file.size,
        },
      });
    } catch (err) {
      setActionError((err as ApiError)?.message || "Attachment upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const onSaveLesson = async () => {
    const title = lessonForm.title.trim();
    if (!title || !lessonChapterId) {
      setActionError("Lesson title is required");
      return;
    }
    setActionError(null);
    const minutes = Number(lessonForm.duration) || 0;
    const payload = {
      title,
      description: serializeRichText(lessonForm.description) || undefined,
      body: serializeRichText(lessonForm.body) || undefined,
      type: lessonForm.type,
      contentUrl: lessonForm.contentUrl.trim() || undefined,
      contentPublicId: lessonForm.contentPublicId.trim() || undefined,
      duration: minutes > 0 ? minutes * 60 : undefined,
      isPublished: lessonForm.isPublished,
      isPreview: lessonForm.isPreview,
      chapterId: lessonChapterId,
    };
    try {
      if (editingLesson) {
        await updateLesson.mutateAsync({ id: editingLesson.id, payload });
      } else {
        await createLesson.mutateAsync(payload);
      }
      setLessonModal(false);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save lesson");
    }
  };

  const onDeleteLesson = async () => {
    if (!confirmDeleteLesson) return;
    setActionError(null);
    try {
      await deleteLesson.mutateAsync(confirmDeleteLesson.id);
      setConfirmDeleteLesson(null);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to delete lesson");
    }
  };

  if (isLoading) return <PageLoader label="Loading curriculum..." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Curriculum</h2>
          <p className="text-sm text-muted-foreground">
            {courseTitle
              ? `Chapters, lessons, videos, and files for “${courseTitle}”.`
              : "Manage chapters, lessons, videos, and downloadable files."}
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreateChapter} disabled={busy}>
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

      {!sortedChapters.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="font-semibold text-foreground">No chapters yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a chapter, then add lessons with video and downloadable files.
          </p>
          <Button type="button" className="mt-5" size="sm" onClick={openCreateChapter}>
            <Plus className="h-4 w-4" aria-hidden />
            Create first chapter
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedChapters.map((chapter, index) => {
            const isOpen = expanded[chapter.id] ?? index === 0;
            const lessons = [...chapter.lessons].sort((a, b) => a.order - b.order);
            const publishedLessons = lessons.filter((l) => l.isPublished !== false).length;
            return (
              <div
                key={chapter.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
              >
                <div
                  className={cn(
                    "flex items-center gap-2 border-b border-border px-3 py-3 sm:px-4",
                    "transition-colors hover:bg-muted/40"
                  )}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, [chapter.id]: !isOpen }))
                    }
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">
                        <span className="mr-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          Ch {index + 1}
                        </span>
                        {chapter.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
                        {" · "}
                        {publishedLessons} published
                        {chapter.isPublished === false ? " · chapter draft" : ""}
                        {" · "}
                        {isOpen ? "Click to collapse" : "Click to expand"}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180"
                      )}
                      aria-hidden
                    />
                  </button>
                  <div
                    className="flex shrink-0 items-center gap-0.5"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <AdminIconAction label="Move up" onClick={() => void moveChapter(index, -1)} disabled={busy || index === 0} icon={ArrowUp} />
                    <AdminIconAction label="Move down" onClick={() => void moveChapter(index, 1)} disabled={busy || index === sortedChapters.length - 1} icon={ArrowDown} />
                    <AdminIconAction label="Edit chapter" onClick={() => openEditChapter(chapter)} icon={Pencil} />
                    <AdminIconAction label="Add lesson" onClick={() => openCreateLesson(chapter)} icon={Plus} />
                    <AdminIconAction label="Delete chapter" onClick={() => setConfirmDeleteChapter(chapter)} tone="danger" icon={Trash2} />
                  </div>
                </div>

                {isOpen ? (
                  <div className="space-y-2 bg-[#f8faff]/70 p-3">
                    {!lessons.length ? (
                      <div className="rounded-xl border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted-foreground">
                        No lessons yet.{" "}
                        <button
                          type="button"
                          className="font-semibold text-primary underline"
                          onClick={() => openCreateLesson(chapter)}
                        >
                          Add a lesson
                        </button>
                      </div>
                    ) : (
                      lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => openEditLesson(chapter.id, lesson)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openEditLesson(chapter.id, lesson);
                            }
                          }}
                          className={cn(
                            "group flex cursor-pointer items-center gap-3 rounded-xl border border-border/80 bg-white px-3 py-3",
                            "transition-all hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                          )}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
                            {String(lesson.type).toUpperCase() === "VIDEO" ? (
                              <PlayCircle className="h-4 w-4" aria-hidden />
                            ) : (
                              <FileText className="h-4 w-4" aria-hidden />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                              {lesson.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {String(lesson.type)}
                              {lesson.duration ? ` · ${formatLessonDuration(lesson.duration)}` : ""}
                              {lesson.contentUrl ? " · content ready" : " · no content"}
                              {(lesson.attachments?.length ?? 0) > 0
                                ? ` · ${lesson.attachments!.length} file${lesson.attachments!.length === 1 ? "" : "s"}`
                                : ""}
                              {lesson.isPublished === false ? " · draft" : ""}
                              {lesson.isPreview ? " · free preview" : ""}
                              {" · click to edit"}
                            </p>
                          </div>
                          <div
                            className="flex shrink-0 items-center gap-0.5"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <AdminIconAction label="Move up" onClick={() => void moveLesson(chapter, lessonIndex, -1)} disabled={busy || lessonIndex === 0} icon={ArrowUp} />
                            <AdminIconAction label="Move down" onClick={() => void moveLesson(chapter, lessonIndex, 1)} disabled={busy || lessonIndex === lessons.length - 1} icon={ArrowDown} />
                            <AdminIconAction label="Edit lesson" onClick={() => openEditLesson(chapter.id, lesson)} icon={Pencil} />
                            <AdminIconAction label="Delete lesson" onClick={() => setConfirmDeleteLesson(lesson)} tone="danger" icon={Trash2} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <AdminModal
        open={chapterModal}
        onClose={() => !busy && setChapterModal(false)}
        title={editingChapter ? "Edit chapter" : "Add chapter"}
        description="Chapters group lessons in order for students."
      >
        <div className="space-y-3">
          <Input
            value={chapterForm.title}
            onChange={(e) => setChapterForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Chapter title"
          />
          <RichTextEditor
            value={chapterForm.description}
            onChange={(description) => setChapterForm((p) => ({ ...p, description }))}
            placeholder="Optional chapter description"
            minHeight="100px"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={chapterForm.isPublished}
              onChange={(e) => setChapterForm((p) => ({ ...p, isPublished: e.target.checked }))}
            />
            Published
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setChapterModal(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={busy} onClick={() => void onSaveChapter()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save chapter
            </Button>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        open={lessonModal}
        onClose={() => !busy && setLessonModal(false)}
        title={editingLesson ? "Edit lesson" : "Add lesson"}
        description="Add a main video/PDF/text lesson plus optional downloadable files."
        className="max-w-2xl"
      >
        <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <Input
            value={lessonForm.title}
            onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Lesson title"
          />
          <RichTextEditor
            value={lessonForm.description}
            onChange={(description) => setLessonForm((p) => ({ ...p, description }))}
            placeholder="Short lesson description"
            minHeight="90px"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={lessonForm.type}
              onChange={(e) => setLessonForm((p) => ({ ...p, type: e.target.value as LessonType }))}
              className={fieldClass()}
            >
              {LESSON_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <Input
              type="number"
              min={0}
              value={lessonForm.duration}
              onChange={(e) => setLessonForm((p) => ({ ...p, duration: e.target.value }))}
              placeholder="Duration (minutes)"
            />
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Main content
            </p>
            <Input
              value={lessonForm.contentUrl}
              onChange={(e) => setLessonForm((p) => ({ ...p, contentUrl: e.target.value, contentPublicId: "" }))}
              placeholder="Paste YouTube / video / PDF URL"
            />
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted">
              <Upload className="h-4 w-4" aria-hidden />
              Upload video or PDF
              <input
                type="file"
                className="hidden"
                accept="video/*,application/pdf"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void onUploadContent(file);
                  e.target.value = "";
                }}
              />
            </label>
            {uploadProgress != null ? (
              <p className="mt-2 text-xs text-muted-foreground">Uploading… {uploadProgress}%</p>
            ) : null}
            {lessonForm.contentUrl ? (
              <p className="mt-2 truncate text-xs text-primary">{lessonForm.contentUrl}</p>
            ) : null}
          </div>

          {lessonForm.type === "TEXT" ? (
            <RichTextEditor
              value={lessonForm.body}
              onChange={(body) => setLessonForm((p) => ({ ...p, body }))}
              placeholder="Lesson text body"
              minHeight="160px"
            />
          ) : null}

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={lessonForm.isPublished}
                onChange={(e) => setLessonForm((p) => ({ ...p, isPublished: e.target.checked }))}
              />
              Published
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={lessonForm.isPreview}
                onChange={(e) => setLessonForm((p) => ({ ...p, isPreview: e.target.checked }))}
              />
              Free preview
            </label>
          </div>

          {editingLesson ? (
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Downloadable files
                </p>
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary">
                  <Paperclip className="h-3.5 w-3.5" aria-hidden />
                  Add file
                  <input
                    type="file"
                    className="hidden"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onUploadAttachment(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {(editingLesson.attachments ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No attachments yet.</p>
              ) : (
                <ul className="space-y-2">
                  {(editingLesson.attachments ?? []).map((file) => (
                    <li key={file.id} className="flex items-center justify-between gap-2 rounded-lg bg-card px-3 py-2 text-sm">
                      <span className="truncate">{file.filename}</span>
                      <button
                        type="button"
                        className="text-accent"
                        disabled={busy}
                        onClick={() => void deleteAttachment.mutateAsync(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Save the lesson first to attach downloadable files.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setLessonModal(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={busy} onClick={() => void onSaveLesson()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save lesson
            </Button>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        open={Boolean(confirmDeleteChapter)}
        onClose={() => setConfirmDeleteChapter(null)}
        title="Delete chapter?"
        description="This will permanently delete the chapter and all lessons inside it."
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDeleteChapter(null)}>Cancel</Button>
          <Button type="button" size="sm" className="bg-accent hover:bg-accent/90" disabled={busy} onClick={() => void onDeleteChapter()}>
            Delete chapter
          </Button>
        </div>
      </AdminModal>

      <AdminModal
        open={Boolean(confirmDeleteLesson)}
        onClose={() => setConfirmDeleteLesson(null)}
        title="Delete lesson?"
        description="This will permanently delete the lesson, its video, and all attachments."
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDeleteLesson(null)}>Cancel</Button>
          <Button type="button" size="sm" className="bg-accent hover:bg-accent/90" disabled={busy} onClick={() => void onDeleteLesson()}>
            Delete lesson
          </Button>
        </div>
      </AdminModal>
    </div>
  );
}
