"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  FileCheck2,
  Loader2,
  PenLine,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { OnlineScriptMarkerModal } from "./online-script-marker-modal";
import { PageHeader, PageLoader, ScriptFilePreview } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { ROUTES } from "@/constants";
import {
  useAdminSubjectsTree,
  useAdminWrittenPracticeAttempt,
  useAdminWrittenPracticeSubmissions,
  useAttachWrittenPracticeAnswerFiles,
  useGradeWrittenPracticeAttempt,
} from "@/hooks";
import { formatShortDate } from "@/lib/format";
import { richTextToPlain } from "@/lib/rich-text";
import { uploadService } from "@/services/upload.service";
import type { ApiError } from "@/types";
import type { WrittenPracticeSubmission } from "@/types/practice-exam.types";
import { cn } from "@/utils";

type StatusFilter = "PENDING" | "GRADED" | "ALL";

/** Matches the backend cap on checked-script files per attempt. */
const MAX_MARKED_FILES = 10;
const MARKED_FILE_ACCEPT = ".pdf,.png,.jpg,.jpeg";
const MARKED_FILE_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);

function uniqueFiles(urls: string[]) {
  return [...new Set(urls.filter((u) => Boolean(u && u.trim())))];
}

function isHttpAnswerUrl(value: string | null | undefined) {
  return Boolean(value && /^https?:\/\//i.test(value.trim()));
}

function sameFiles(a: string[], b: string[]) {
  return a.length === b.length && a.every((url, index) => url === b[index]);
}

function GradePanel({
  item,
  onDone,
}: {
  item: WrittenPracticeSubmission;
  onDone: (close?: boolean) => void;
}) {
  const { data, isLoading, error } = useAdminWrittenPracticeAttempt(item.id);
  const gradeMutation = useGradeWrittenPracticeAttempt();
  const attachFiles = useAttachWrittenPracticeAnswerFiles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const markedInputRef = useRef<HTMLInputElement>(null);
  const [fileUrls, setFileUrls] = useState(() => uniqueFiles(item.answerFileUrls ?? []));
  const [uploading, setUploading] = useState(false);
  const savedMarkedFiles = useMemo(
    () => uniqueFiles(item.markedFileUrls ?? []),
    [item.markedFileUrls]
  );
  const [markedFiles, setMarkedFiles] = useState(savedMarkedFiles);
  const [markedUpload, setMarkedUpload] = useState<{ done: number; total: number } | null>(null);
  const [markedError, setMarkedError] = useState<string | null>(null);
  const [grade, setGrade] = useState(
    item.score > 0 || item.status === "GRADED" ? String(item.score) : ""
  );
  const [feedback, setFeedback] = useState(item.feedback ?? "");
  const [actionError, setActionError] = useState<string | null>(null);
  const [markerTarget, setMarkerTarget] = useState<{
    url: string;
    label?: string;
  } | null>(null);

  const isPublished = item.status === "GRADED";
  const markedDirty = !sameFiles(markedFiles, savedMarkedFiles);
  const busy = gradeMutation.isPending || Boolean(markedUpload);

  const save = async (publish: boolean) => {
    const value = Number(grade.trim());
    if (!grade.trim() || !Number.isInteger(value) || value < 0 || value > 100) {
      setActionError("Enter whole-number marks between 0 and 100");
      return;
    }
    if (
      publish &&
      markedFiles.length === 0 &&
      !window.confirm(
        "Publish without a checked script? The student will only see the score and feedback, not where they lost marks."
      )
    ) {
      return;
    }
    setActionError(null);
    try {
      await gradeMutation.mutateAsync({
        attemptId: item.id,
        payload: {
          grade: value,
          feedback: feedback.trim() || undefined,
          publish,
          markedFileUrls: markedFiles,
        },
      });
      onDone(true);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Grading failed");
    }
  };

  const handleAttachFile = async (file: File | null) => {
    if (!file || isPublished) return;
    setActionError(null);
    setUploading(true);
    try {
      const uploaded = await uploadService.upload(file, "assignments");
      const updated = await attachFiles.mutateAsync({
        attemptId: item.id,
        fileUrls: [uploaded.url],
      });
      setFileUrls(uniqueFiles(updated.answerFileUrls ?? []));
      onDone(false);
    } catch (err) {
      setActionError((err as ApiError)?.message || "Could not attach answer file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMarkedFiles = async (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    if (markedInputRef.current) markedInputRef.current.value = "";
    if (!picked.length) return;

    setMarkedError(null);
    const rejected = picked.filter((file) => !MARKED_FILE_TYPES.has(file.type));
    const valid = picked.filter((file) => MARKED_FILE_TYPES.has(file.type));
    const room = MAX_MARKED_FILES - markedFiles.length;
    if (room <= 0) {
      setMarkedError(`You can attach up to ${MAX_MARKED_FILES} checked files.`);
      return;
    }
    const toUpload = valid.slice(0, room);
    const notes: string[] = [];
    if (rejected.length) notes.push(`${rejected.length} file(s) skipped — use PDF, JPG or PNG.`);
    if (valid.length > room) notes.push(`Only ${room} more file(s) fit (max ${MAX_MARKED_FILES}).`);
    if (!toUpload.length) {
      setMarkedError(notes.join(" ") || "No file selected.");
      return;
    }

    setMarkedUpload({ done: 0, total: toUpload.length });
    const uploaded: string[] = [];
    try {
      for (const file of toUpload) {
        const result = await uploadService.upload(file, "assignments");
        uploaded.push(result.url);
        setMarkedUpload({ done: uploaded.length, total: toUpload.length });
      }
    } catch (err) {
      notes.push((err as ApiError)?.message || "Upload failed for one of the files.");
    } finally {
      if (uploaded.length) setMarkedFiles((prev) => uniqueFiles([...prev, ...uploaded]));
      setMarkedUpload(null);
      if (notes.length) setMarkedError(notes.join(" "));
    }
  };

  const files = uniqueFiles([
    ...fileUrls,
    ...((data?.attempt.answerFileUrls as string[] | undefined) ?? []),
  ]);
  const questions = data?.questions ?? [];
  const perQuestionFiles = item.questionAnswerFiles?.length
    ? item.questionAnswerFiles
    : item.writtenStyle === "PER_QUESTION"
      ? questions
          .filter((q) => isHttpAnswerUrl(q.studentAnswer))
          .map((q) => ({ questionId: q.id, fileUrl: q.studentAnswer!.trim() }))
      : [];
  const canAttach = !isPublished && item.writtenStyle !== "PER_QUESTION";
  const primaryAnswerUrl = files[0] || perQuestionFiles[0]?.fileUrl || null;

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{item.student.name}</p>
          <p className="text-xs text-muted-foreground">
            {item.student.phone || item.student.email || item.student.id}
            {item.submittedAt ? ` · submitted ${formatShortDate(item.submittedAt)}` : ""}
            {item.writtenStyle === "PER_QUESTION" ? " · per-question upload" : ""}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link
            href={ROUTES.subjectPracticeExamTake(item.program.slug, item.template.slug)}
            target="_blank"
          >
            Open exam page
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Answer scripts
        </p>
        {perQuestionFiles.length > 0 ? (
          <div className="space-y-3">
            {perQuestionFiles.map((file) => {
              const q = questions.find((row) => row.id === file.questionId);
              const label = q ? `Q${q.number || "?"} answer` : "Answer file";
              return (
                <div key={`${file.questionId}-${file.fileUrl}`} className="space-y-1.5">
                  {q?.prompt ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {richTextToPlain(q.prompt)}
                    </p>
                  ) : null}
                  <ScriptFilePreview
                    url={file.fileUrl}
                    label={label}
                    actions={
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 border-emerald-600/40 text-xs font-semibold text-emerald-700 hover:bg-emerald-600 hover:text-white"
                        onClick={() => setMarkerTarget({ url: file.fileUrl, label })}
                      >
                        <PenLine className="h-3.5 w-3.5" />
                        Mark Online
                      </Button>
                    }
                  />
                </div>
              );
            })}
          </div>
        ) : files.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No files on this submission. Attach the script here if the student sent it separately.
          </p>
        ) : (
          <div className="space-y-3">
            {files.map((url, index) => (
              <ScriptFilePreview
                key={url}
                url={url}
                label={`Answer file ${index + 1}`}
                actions={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 border-emerald-600/40 text-xs font-semibold text-emerald-700 hover:bg-emerald-600 hover:text-white"
                    onClick={() =>
                      setMarkerTarget({ url, label: `Answer file ${index + 1}` })
                    }
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    Mark Online
                  </Button>
                }
              />
            ))}
          </div>
        )}
        {canAttach ? (
          <div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading || attachFiles.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading || attachFiles.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {files.length === 0 ? "Attach answer file" : "Add another file"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
              className="hidden"
              onChange={(event) => void handleAttachFile(event.target.files?.[0] ?? null)}
            />
          </div>
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Questions & mark schemes
        </p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading questions…</p>
        ) : error ? (
          <p className="text-sm text-accent">
            {(error as unknown as ApiError)?.message || "Failed to load questions"}
          </p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-3">
            {questions.map((q, index) => (
              <div key={q.id} className="rounded-lg border border-border/70 px-3 py-2.5 text-sm">
                <p className="font-semibold text-foreground">
                  Q{q.number || index + 1}.{" "}
                  <span className="font-medium">{richTextToPlain(q.prompt)}</span>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {q.marks ?? 1} mark{(q.marks ?? 1) === 1 ? "" : "s"}
                </p>
                {q.markScheme ? (
                  <div className="mt-2 rounded-lg bg-muted/40 px-2.5 py-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Mark scheme</span>
                    <RichTextContent html={q.markScheme} className="mt-1 text-xs" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <section className="space-y-3 rounded-xl border border-[#c7d7fe] bg-[#f5f8ff] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
              <FileCheck2 className="h-4 w-4 text-primary" aria-hidden />
              Checked script for the student
            </p>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
              Mark the student&apos;s script directly in the browser with red pen, ticks (✔), crosses (✘), and score
              without downloading, or upload an already checked file from your computer.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {primaryAnswerUrl ? (
              <Button
                type="button"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm gap-1.5"
                onClick={() =>
                  setMarkerTarget({
                    url: primaryAnswerUrl,
                    label: "Student Submission",
                  })
                }
              >
                <PenLine className="h-4 w-4" />
                Mark Online (No download needed)
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy || markedFiles.length >= MAX_MARKED_FILES}
              onClick={() => markedInputRef.current?.click()}
            >
              {markedUpload ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {markedUpload
                ? `Uploading ${markedUpload.done + 1}/${markedUpload.total}…`
                : markedFiles.length
                  ? "Upload more files"
                  : "Upload from PC"}
            </Button>
          </div>
          <input
            ref={markedInputRef}
            type="file"
            multiple
            accept={MARKED_FILE_ACCEPT}
            className="hidden"
            onChange={(event) => void handleMarkedFiles(event.target.files)}
          />
        </div>

        {markedError ? (
          <p role="alert" className="text-xs font-medium text-accent">
            {markedError}
          </p>
        ) : null}

        {markedFiles.length === 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {primaryAnswerUrl ? (
              <button
                type="button"
                onClick={() =>
                  setMarkerTarget({
                    url: primaryAnswerUrl,
                    label: "Student Submission",
                  })
                }
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-emerald-500/60 bg-emerald-50/70 p-6 text-center transition hover:border-emerald-600 hover:bg-emerald-100/70 group"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition-transform group-hover:scale-110">
                  <PenLine className="h-5 w-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-emerald-950">
                    Mark Script Online (No download needed)
                  </span>
                  <span className="mt-0.5 block text-xs text-emerald-800">
                    Draw with red pen, stamps (✔/✘), feedback &amp; submit directly
                  </span>
                </div>
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => markedInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#a4bcfd] bg-white/70 px-4 py-6 text-center transition hover:border-primary hover:bg-white disabled:opacity-60",
                !primaryAnswerUrl && "sm:col-span-2"
              )}
            >
              <Upload className="h-5 w-5 text-primary" aria-hidden />
              <span className="text-sm font-semibold text-foreground">
                Upload checked script from PC
              </span>
              <span className="text-xs text-muted-foreground">
                PDF, JPG or PNG (if already checked externally)
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {markedFiles.map((url, index) => (
              <ScriptFilePreview
                key={url}
                url={url}
                label={`Checked script ${markedFiles.length > 1 ? `· page/file ${index + 1}` : ""}`.trim()}
                headerClassName="bg-white"
                actions={
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setMarkedFiles((prev) => prev.filter((u) => u !== url))}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden />
                    Remove
                  </button>
                }
              />
            ))}
          </div>
        )}

        {markedDirty ? (
          <p className="text-xs font-medium text-[#9a3412]">
            Checked script changes aren&apos;t saved yet — use Save draft or{" "}
            {isPublished ? "Update & republish" : "Publish marks"} below.
          </p>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-semibold">Marks (0–100%)</span>
          <Input
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="85"
            inputMode="numeric"
          />
        </label>
        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="font-semibold">Feedback (optional)</span>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
            placeholder="Comments for the student…"
          />
        </label>
      </div>

      {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void save(false)}
        >
          {gradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save draft
        </Button>
        <Button type="button" disabled={busy} onClick={() => void save(true)}>
          {gradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPublished ? "Update & republish" : "Publish marks"}
        </Button>
        {isPublished ? (
          <p className="text-xs text-muted-foreground">
            Save draft hides the result from the student again until you republish.
          </p>
        ) : null}
      </div>

      {markerTarget ? (
        <OnlineScriptMarkerModal
          open={Boolean(markerTarget)}
          onClose={() => setMarkerTarget(null)}
          scriptUrl={markerTarget.url}
          scriptLabel={markerTarget.label}
          studentName={item.student.name}
          attemptId={item.id}
          initialScore={grade ? Number(grade) : item.score}
          initialFeedback={feedback || item.feedback}
          isPublished={isPublished}
          onSaved={(markedUrl) => {
            setMarkedFiles((prev) => uniqueFiles([...prev, markedUrl]));
            setMarkerTarget(null);
            onDone(false);
          }}
        />
      ) : null}
    </div>
  );
}

export function AdminPracticeExamMarkingPage() {
  const { data: subjectsTree = [] } = useAdminSubjectsTree();
  const [categoryId, setCategoryId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [programId, setProgramId] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
  const [openId, setOpenId] = useState<string | null>(null);

  const effectiveCategoryId = categoryId || subjectsTree[0]?.id || "";
  const subjects = useMemo(() => {
    return subjectsTree.find((c) => c.id === effectiveCategoryId)?.subjects ?? [];
  }, [subjectsTree, effectiveCategoryId]);
  const effectiveSubjectId = subjectId || subjects[0]?.id || "";
  const programs = useMemo(() => {
    return subjects.find((s) => s.id === effectiveSubjectId)?.programs ?? [];
  }, [subjects, effectiveSubjectId]);
  const effectiveProgramId = programId || programs[0]?.id || "";

  const { data = [], isLoading, error, refetch, isFetching } =
    useAdminWrittenPracticeSubmissions(effectiveProgramId || undefined, statusFilter);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="Written Marking"
              description="Review uploaded answer scripts, award marks, upload the checked script, and publish results to students."
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
              <Button asChild size="sm" variant="outline">
                <Link href={ROUTES.admin.practiceExams}>Practice exam templates</Link>
              </Button>
            </div>
          </div>

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
                  setOpenId(null);
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
                  setOpenId(null);
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
                onChange={(e) => {
                  setProgramId(e.target.value);
                  setOpenId(null);
                }}
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

          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                ["PENDING", "Awaiting marks"],
                ["GRADED", "Published"],
                ["ALL", "All"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setStatusFilter(id);
                  setOpenId(null);
                }}
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

        <div className="space-y-3 p-5">
          {error ? (
            <p className="text-sm text-accent">
              {(error as unknown as ApiError)?.message || "Failed to load submissions"}
            </p>
          ) : null}

          {isLoading ? (
            <PageLoader label="Loading written submissions..." />
          ) : data.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
              {statusFilter === "PENDING"
                ? "No written practice exams waiting for marks."
                : "No submissions found for this filter."}
            </div>
          ) : (
            data.map((item) => {
              const open = openId === item.id;
              const checkedCount = item.markedFileUrls?.length ?? 0;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-xl border border-border px-4 py-3",
                    item.awaitingMarking && "bg-[#fff8ef]/40"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">{item.template.title}</p>
                        <span className="rounded-md bg-[#eff6ff] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#1d4ed8]">
                          Written
                        </span>
                        {item.awaitingMarking ? (
                          <span className="rounded-md bg-[#fff8ef] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#9a3412]">
                            Awaiting marks
                          </span>
                        ) : (
                          <span className="rounded-md bg-[#ecfdf3] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--accent-green)]">
                            Graded {item.score}%
                          </span>
                        )}
                        {checkedCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#f5f8ff] px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
                            <FileCheck2 className="h-3 w-3" aria-hidden />
                            Checked script
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-foreground">
                        {item.student.name}
                        <span className="text-muted-foreground">
                          {" "}
                          · {item.totalQuestions}Q · {item.answerFileUrls.length} file
                          {item.answerFileUrls.length === 1 ? "" : "s"}
                        </span>
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={open ? "outline" : "default"}
                      onClick={() => setOpenId(open ? null : item.id)}
                    >
                      {open ? "Close" : item.awaitingMarking ? "Mark" : "Review"}
                    </Button>
                  </div>
                  {open ? (
                    <GradePanel
                      item={item}
                      onDone={(close) => {
                        if (close) setOpenId(null);
                        void refetch();
                      }}
                    />
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
