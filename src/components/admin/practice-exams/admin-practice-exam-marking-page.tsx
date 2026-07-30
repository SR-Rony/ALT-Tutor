"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileText, Loader2, RefreshCw } from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import {
  useAdminSubjectsTree,
  useAdminWrittenPracticeAttempt,
  useAdminWrittenPracticeSubmissions,
  useGradeWrittenPracticeAttempt,
} from "@/hooks";
import { formatShortDate } from "@/lib/format";
import type { ApiError } from "@/types";
import type { WrittenPracticeSubmission } from "@/types/practice-exam.types";
import { cn } from "@/utils";

type StatusFilter = "PENDING" | "GRADED" | "ALL";

function uniqueFiles(urls: string[]) {
  return [...new Set(urls.filter((u) => Boolean(u && u.trim())))];
}

function GradePanel({
  item,
  onDone,
}: {
  item: WrittenPracticeSubmission;
  onDone: () => void;
}) {
  const { data, isLoading, error } = useAdminWrittenPracticeAttempt(item.id);
  const gradeMutation = useGradeWrittenPracticeAttempt();
  const [grade, setGrade] = useState(
    item.score > 0 || item.status === "GRADED" ? String(item.score) : ""
  );
  const [feedback, setFeedback] = useState(item.feedback ?? "");
  const [actionError, setActionError] = useState<string | null>(null);

  const save = async (publish: boolean) => {
    const value = Number.parseInt(grade, 10);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      setActionError("Enter a grade between 0 and 100");
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
        },
      });
      onDone();
    } catch (err) {
      setActionError((err as ApiError)?.message || "Grading failed");
    }
  };

  const files = uniqueFiles(item.answerFileUrls ?? []);
  const questions = data?.questions ?? [];

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{item.student.name}</p>
          <p className="text-xs text-muted-foreground">
            {item.student.phone || item.student.email || item.student.id}
            {item.submittedAt ? ` · submitted ${formatShortDate(item.submittedAt)}` : ""}
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link
            href={ROUTES.subjectPracticeExam(item.program.slug, item.template.slug)}
            target="_blank"
          >
            Open exam page
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Answer scripts
        </p>
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files uploaded.</p>
        ) : (
          <ul className="space-y-1">
            {files.map((url, index) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Answer file {index + 1}
                </a>
              </li>
            ))}
          </ul>
        )}
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
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border bg-card p-3">
            {questions.map((q, index) => (
              <div key={q.id} className="rounded-lg border border-border/70 px-3 py-2 text-sm">
                <p className="font-semibold text-foreground">
                  Q{q.number || index + 1}. {q.prompt}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {q.marks ?? 1} mark{(q.marks ?? 1) === 1 ? "" : "s"}
                </p>
                {q.markScheme ? (
                  <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Mark scheme: </span>
                    {q.markScheme}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

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

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={gradeMutation.isPending}
          onClick={() => void save(false)}
        >
          {gradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save draft
        </Button>
        <Button
          type="button"
          disabled={gradeMutation.isPending}
          onClick={() => void save(true)}
        >
          {gradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Publish marks
        </Button>
      </div>
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
              description="Review uploaded answer scripts, award marks, and publish results to students."
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
                Category
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
                      onDone={() => {
                        setOpenId(null);
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
