"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Loader2,
  PenLine,
  PlayCircle,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { ROUTES } from "@/constants";
import {
  useMyAssignments,
  useMyMcqExams,
  useStudentSubmissions,
  useSubmitAssignment,
} from "@/hooks";
import {
  assessmentWindowLabel,
  canSubmitAssessment,
  getAssessmentWindowState,
} from "@/lib/assessment-window";
import { formatShortDate } from "@/lib/format";
import { uploadService } from "@/services/upload.service";
import type { ApiError } from "@/types";
import type { McqPhase } from "@/types/mcq.types";
import type { StudentAssignment, StudentSubmission } from "@/types/student-dashboard.types";
import { cn } from "@/utils";

type TabId = "upcoming" | "mcq" | "written" | "completed" | "results";

const TABS: { id: TabId; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "mcq", label: "MCQ" },
  { id: "written", label: "Written" },
  { id: "completed", label: "Completed" },
  { id: "results", label: "Results" },
];

function phaseMeta(phase: McqPhase) {
  switch (phase) {
    case "IN_PROGRESS":
      return { label: "In progress", className: "bg-[#fff7ed] text-[#ea580c]" };
    case "CAN_RETAKE":
      return { label: "Retake available", className: "bg-primary-muted text-primary" };
    case "COMPLETED":
      return { label: "Completed", className: "bg-muted text-muted-foreground" };
    default:
      return { label: "Not started", className: "bg-primary/10 text-primary" };
  }
}

function isWrittenType(type: string) {
  const t = type.toUpperCase();
  return t === "FILE" || t === "WRITTEN";
}

function assignmentContext(item: StudentAssignment) {
  return item.course?.title ?? item.program?.name ?? "Assessment";
}

function submissionForAssignment(submissions: StudentSubmission[], assignmentId: string) {
  return submissions.find((s) => s.assignmentId === assignmentId) ?? null;
}

function uniqueFiles(urls: Array<string | null | undefined>) {
  return [...new Set(urls.filter((u): u is string => Boolean(u && u.trim())))];
}

function fileLabel(url: string) {
  try {
    const path = new URL(url).pathname;
    const name = path.split("/").filter(Boolean).pop();
    return name ? decodeURIComponent(name) : url;
  } catch {
    return url.split("/").pop() ?? url;
  }
}

function WrittenSubmitModal({
  assignment,
  existing,
  onClose,
}: {
  assignment: StudentAssignment;
  existing: StudentSubmission | null;
  onClose: () => void;
}) {
  const submit = useSubmitAssignment();
  const windowState = getAssessmentWindowState(assignment);
  const canSubmit = canSubmitAssessment(windowState) && existing?.canResubmit !== false;
  const [answerText, setAnswerText] = useState(existing?.answerText ?? "");
  const [fileUrls, setFileUrls] = useState<string[]>(() =>
    uniqueFiles([...(existing?.fileUrls ?? []), existing?.fileUrl])
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<StudentSubmission | null>(null);

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const result = await uploadService.upload(file, "assignments");
        uploaded.push(result.url);
      }
      setFileUrls((prev) => uniqueFiles([...prev, ...uploaded]));
    } catch (err) {
      setError((err as ApiError).message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    if (!canSubmit) {
      setError(
        existing?.canResubmit === false
          ? "Published grades cannot be overwritten"
          : `Submission window is ${assessmentWindowLabel(windowState).toLowerCase()}`
      );
      return;
    }
    if (!answerText.trim() && fileUrls.length === 0) {
      setError("Provide written answer text and/or upload at least one file");
      return;
    }
    setError(null);
    try {
      const result = await submit.mutateAsync({
        assignmentId: assignment.id,
        answerText: answerText.trim() || undefined,
        fileUrl: fileUrls[0],
        fileUrls,
      });
      setReceipt(result);
    } catch (err) {
      setError((err as ApiError).message || "Submission failed");
    }
  };

  const busy = submit.isPending || uploading;

  if (receipt) {
    return (
      <AdminModal
        open
        title="Submission received"
        description={assignment.title}
        onClose={onClose}
        className="sm:max-w-xl"
        footer={
          <div className="flex justify-end">
            <Button type="button" onClick={onClose}>
              Done
            </Button>
          </div>
        }
      >
        <SubmissionReceiptBody submission={receipt} assignment={assignment} />
      </AdminModal>
    );
  }

  return (
    <AdminModal
      open
      title={assignment.title}
      description={assignmentContext(assignment)}
      onClose={() => !busy && onClose()}
      className="sm:max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={busy || !canSubmit} onClick={() => void onSubmit()}>
            {submit.isPending ? "Submitting…" : existing ? "Update submission" : "Submit"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-semibold",
              windowState === "OPEN"
                ? "bg-accent-green/10 text-accent-green"
                : windowState === "LATE"
                  ? "bg-[#fff7ed] text-[#ea580c]"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {assessmentWindowLabel(windowState)}
          </span>
          {assignment.dueDate ? (
            <span className="rounded-full bg-muted px-2.5 py-1">Due {formatShortDate(assignment.dueDate)}</span>
          ) : null}
        </div>
        {assignment.instructions ? (
          <RichTextContent
            html={assignment.instructions}
            className="rounded-xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground"
          />
        ) : assignment.description ? (
          <RichTextContent html={assignment.description} className="text-sm text-muted-foreground" />
        ) : null}
        <label className="block space-y-1.5 text-sm">
          <span className="font-semibold">Written answer</span>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            rows={6}
            disabled={!canSubmit}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            placeholder="Type your response here…"
          />
        </label>
        <div className="space-y-2">
          <span className="text-sm font-semibold">Attachments</span>
          {fileUrls.length ? (
            <ul className="space-y-2">
              {fileUrls.map((url) => (
                <li
                  key={url}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
                >
                  <a href={url} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">
                    {fileLabel(url)}
                  </a>
                  <button
                    type="button"
                    disabled={!canSubmit || busy}
                    className="text-muted-foreground hover:text-accent"
                    onClick={() => setFileUrls((prev) => prev.filter((item) => item !== url))}
                    aria-label="Remove file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No files attached yet.</p>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload files
            <input
              type="file"
              multiple
              className="hidden"
              disabled={busy || !canSubmit}
              onChange={(e) => {
                void onUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {error ? <p className="text-sm text-accent">{error}</p> : null}
      </div>
    </AdminModal>
  );
}

function SubmissionReceiptBody({
  submission,
  assignment,
}: {
  submission: StudentSubmission;
  assignment?: StudentAssignment | null;
}) {
  const files = uniqueFiles([...(submission.fileUrls ?? []), submission.fileUrl]);
  return (
    <div className="space-y-3 text-sm">
      <p>
        <span className="text-muted-foreground">Receipt ID:</span>{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{submission.receiptId ?? submission.id}</code>
      </p>
      <p>
        <span className="text-muted-foreground">Submitted:</span> {formatShortDate(submission.submittedAt)}
      </p>
      <p>
        <span className="text-muted-foreground">Status:</span>{" "}
        {submission.statusLabel ?? (submission.status === "GRADED" ? "Graded" : "Pending review")}
      </p>
      {submission.answerText ? (
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Answer</p>
          <p className="whitespace-pre-wrap">{submission.answerText}</p>
        </div>
      ) : null}
      {files.length ? (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Attachments</p>
          <ul className="space-y-1">
            {files.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  {fileLabel(url)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {submission.resultsReleased && submission.grade != null ? (
        <div className="rounded-xl border border-accent-green/30 bg-[#ecfdf3] p-3">
          <p className="font-semibold text-accent-green">Grade: {submission.grade}%</p>
          {submission.feedback ? <p className="mt-1 text-muted-foreground">{submission.feedback}</p> : null}
        </div>
      ) : submission.status === "GRADED" ? (
        <p className="text-muted-foreground">Graded — results not released yet.</p>
      ) : null}
      {assignment?.totalMarks != null ? (
        <p className="text-xs text-muted-foreground">Total marks available: {assignment.totalMarks}</p>
      ) : null}
    </div>
  );
}

export function StudentExamCenterPage() {
  const [tab, setTab] = useState<TabId>("upcoming");
  const [submitTarget, setSubmitTarget] = useState<StudentAssignment | null>(null);
  const [receiptTarget, setReceiptTarget] = useState<StudentSubmission | null>(null);
  const { data: assignments = [], isLoading: assignmentsLoading } = useMyAssignments();
  const { data: mcqExams = [], isLoading: mcqLoading } = useMyMcqExams();
  const { data: submissions = [], isLoading: subLoading } = useStudentSubmissions();

  const writtenAssignments = useMemo(
    () => assignments.filter((a) => isWrittenType(String(a.type)) && String(a.type).toUpperCase() !== "MCQ"),
    [assignments]
  );

  const upcoming = useMemo(() => {
    return assignments.filter((a) => {
      if (String(a.type).toUpperCase() === "MCQ") return false;
      const sub = submissionForAssignment(submissions, a.id);
      if (sub) return false;
      return canSubmitAssessment(getAssessmentWindowState(a));
    });
  }, [assignments, submissions]);

  const completed = useMemo(() => {
    return submissions.filter((s) => s.status === "GRADED" || s.resultsReleased);
  }, [submissions]);

  const pendingReview = useMemo(() => {
    return submissions.filter((s) => s.status !== "GRADED");
  }, [submissions]);

  const isLoading = assignmentsLoading && mcqLoading && subLoading;

  if (isLoading && assignments.length === 0 && mcqExams.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Exam Center" description="Assessments, exams, and results." className="mb-0" />
        <PageLoader label="Loading assessments…" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-0">
      <PageHeader
        title="Exam Center"
        description="Upcoming deadlines, timed MCQ exams, written assignments, and graded results."
        className="mb-0"
      />

      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-t-lg px-4 py-2 text-sm font-semibold transition",
              tab === t.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "upcoming" ? (
        <section className="space-y-4">
          {upcoming.length === 0 &&
          mcqExams.filter((e) => (e.mcqStatus?.phase ?? "NOT_STARTED") !== "COMPLETED").length === 0 ? (
            <EmptyState message="No upcoming assessments." />
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((item) => (
              <AssessmentCard
                key={item.id}
                title={item.title}
                context={assignmentContext(item)}
                dueDate={item.dueDate}
                type={String(item.type)}
                windowState={getAssessmentWindowState(item)}
                onAction={() => setSubmitTarget(item)}
                actionLabel="Submit"
              />
            ))}
            {mcqExams
              .filter((e) => (e.mcqStatus?.phase ?? "NOT_STARTED") !== "COMPLETED")
              .map((exam) => (
                <AssessmentCard
                  key={exam.id}
                  title={exam.title}
                  context={exam.course?.title ?? "Course"}
                  dueDate={exam.dueDate}
                  type="MCQ"
                  href={ROUTES.student.mcqExam(exam.id)}
                  actionLabel={
                    exam.mcqStatus?.phase === "IN_PROGRESS" ? "Continue" : "Open exam"
                  }
                />
              ))}
          </div>
        </section>
      ) : null}

      {tab === "mcq" ? (
        <section className="space-y-4">
          {mcqExams.length === 0 ? (
            <EmptyState message="No MCQ exams in your enrolled courses." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {mcqExams.map((exam) => {
                const phase = exam.mcqStatus?.phase ?? "NOT_STARTED";
                const status = phaseMeta(phase);
                return (
                  <article
                    key={exam.id}
                    className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
                  >
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">
                      {exam.course?.title}
                    </p>
                    <h3 className="mt-1 text-base font-bold text-foreground">{exam.title}</h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <Clock className="h-3 w-3" />
                        {exam.durationMinutes} min
                      </span>
                      <span className={cn("rounded-full px-2.5 py-1 font-semibold", status.className)}>
                        {status.label}
                      </span>
                    </div>
                    <Button asChild size="pill" className="mt-4 w-full">
                      <Link href={ROUTES.student.mcqExam(exam.id)}>
                        <PlayCircle className="h-4 w-4" />
                        {phase === "IN_PROGRESS" ? "Continue" : "Open exam"}
                      </Link>
                    </Button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {tab === "written" ? (
        <section className="space-y-4">
          {writtenAssignments.length === 0 ? (
            <EmptyState message="No written or file-based assignments yet." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {writtenAssignments.map((item) => {
                const sub = submissionForAssignment(submissions, item.id);
                const windowState = getAssessmentWindowState(item);
                const canAct = canSubmitAssessment(windowState) && sub?.canResubmit !== false;
                return (
                  <AssessmentCard
                    key={item.id}
                    title={item.title}
                    context={assignmentContext(item)}
                    dueDate={item.dueDate}
                    type={String(item.type)}
                    windowState={windowState}
                    statusLabel={sub ? sub.statusLabel ?? "Submitted" : "Not submitted"}
                    onAction={
                      sub && !canAct
                        ? () => setReceiptTarget(sub)
                        : canAct
                          ? () => setSubmitTarget(item)
                          : undefined
                    }
                    actionLabel={
                      sub && !canAct
                        ? "View receipt"
                        : sub
                          ? "Update submission"
                          : canAct
                            ? "Submit"
                            : assessmentWindowLabel(windowState)
                    }
                    secondaryAction={
                      sub
                        ? {
                            label: "Receipt",
                            onClick: () => setReceiptTarget(sub),
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {tab === "completed" ? (
        <section className="space-y-4">
          {pendingReview.length === 0 && completed.length === 0 ? (
            <EmptyState message="No completed submissions yet." />
          ) : (
            <SubmissionTable
              rows={[...pendingReview, ...completed]}
              showGrade={false}
              onOpen={(row) => setReceiptTarget(row)}
            />
          )}
        </section>
      ) : null}

      {tab === "results" ? (
        <section className="space-y-6">
          {completed.length === 0 &&
          mcqExams.every((e) => !(e.mcqStatus?.finishedAttemptCount || e.mcqStatus?.latestResult)) ? (
            <EmptyState message="No graded results yet." />
          ) : null}
          {completed.length > 0 ? (
            <div>
              <h2 className="mb-3 text-lg font-bold text-foreground">Written &amp; file submissions</h2>
              <SubmissionTable rows={completed} showGrade onOpen={(row) => setReceiptTarget(row)} />
            </div>
          ) : null}
          {mcqExams.some((e) => (e.mcqStatus?.finishedAttemptCount ?? 0) > 0) ? (
            <div>
              <h2 className="mb-3 text-lg font-bold text-foreground">MCQ exam scores</h2>
              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Exam</th>
                      <th className="px-4 py-3 text-left">Attempts</th>
                      <th className="px-4 py-3 text-left">Latest</th>
                      <th className="px-4 py-3 text-left">Best</th>
                      <th className="px-4 py-3 text-left">Trend</th>
                      <th className="px-4 py-3 text-left">Result</th>
                      <th className="px-4 py-3 text-left" />
                    </tr>
                  </thead>
                  <tbody>
                    {mcqExams
                      .filter((e) => (e.mcqStatus?.finishedAttemptCount ?? 0) > 0)
                      .map((exam) => {
                        const st = exam.mcqStatus;
                        const released = st?.resultsReleased !== false;
                        const latest = st?.latestScore ?? st?.latestResult?.score;
                        const best = st?.bestScore;
                        const passed = st?.latestResult?.passed;
                        const trend = st?.scoreTrend ?? [];
                        return (
                          <tr key={exam.id} className="border-b last:border-0">
                            <td className="px-4 py-3 font-medium">{exam.title}</td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {st?.finishedAttemptCount ?? 0}
                            </td>
                            <td className="px-4 py-3">
                              {released && latest != null ? `${latest}%` : "Pending"}
                            </td>
                            <td className="px-4 py-3">
                              {released && best != null ? `${best}%` : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {released && trend.length
                                ? trend.map((t) => `#${t.attemptNumber}:${t.score}%`).join(" → ")
                                : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {!released ? (
                                <span className="text-muted-foreground">Waiting</span>
                              ) : passed ? (
                                <span className="text-accent-green">Pass</span>
                              ) : passed === false ? (
                                <span className="text-accent">Fail</span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button asChild variant="outline" size="sm">
                                <Link href={ROUTES.student.mcqExam(exam.id)}>Open</Link>
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {submitTarget ? (
        <WrittenSubmitModal
          assignment={submitTarget}
          existing={submissionForAssignment(submissions, submitTarget.id)}
          onClose={() => setSubmitTarget(null)}
        />
      ) : null}

      {receiptTarget ? (
        <AdminModal
          open
          title="Submission receipt"
          description={receiptTarget.assignment?.title ?? "Submission"}
          onClose={() => setReceiptTarget(null)}
          className="sm:max-w-xl"
          footer={
            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={() => setReceiptTarget(null)}>
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          }
        >
          <SubmissionReceiptBody submission={receiptTarget} />
        </AdminModal>
      ) : null}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function AssessmentCard({
  title,
  context,
  dueDate,
  type,
  href,
  onAction,
  actionLabel,
  statusLabel,
  windowState,
  secondaryAction,
}: {
  title: string;
  context: string;
  dueDate?: string | null;
  type: string;
  href?: string;
  onAction?: () => void;
  actionLabel?: string;
  statusLabel?: string;
  windowState?: ReturnType<typeof getAssessmentWindowState>;
  secondaryAction?: { label: string; onClick: () => void };
}) {
  const typeIcon =
    type.toUpperCase() === "MCQ" ? (
      <HelpCircle className="h-3.5 w-3.5" />
    ) : type.toUpperCase() === "WRITTEN" ? (
      <PenLine className="h-3.5 w-3.5" />
    ) : (
      <FileText className="h-3.5 w-3.5" />
    );

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-primary">{context}</p>
      <h3 className="mt-1 line-clamp-2 text-base font-bold text-foreground">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
          {typeIcon}
          {type}
        </span>
        {dueDate ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <Clock className="h-3 w-3" />
            Due {formatShortDate(dueDate)}
          </span>
        ) : null}
        {windowState ? (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-semibold",
              windowState === "OPEN"
                ? "bg-accent-green/10 text-accent-green"
                : windowState === "LATE"
                  ? "bg-[#fff7ed] text-[#ea580c]"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {assessmentWindowLabel(windowState)}
          </span>
        ) : null}
        {statusLabel ? (
          <span className="rounded-full bg-primary-muted px-2.5 py-1 font-semibold text-primary">
            {statusLabel}
          </span>
        ) : null}
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-4">
        {href ? (
          <Button asChild size="pill" className="w-full">
            <Link href={href}>
              <PlayCircle className="h-4 w-4" />
              {actionLabel}
            </Link>
          </Button>
        ) : onAction ? (
          <Button type="button" size="pill" className="w-full" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
        {secondaryAction ? (
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function SubmissionTable({
  rows,
  showGrade,
  onOpen,
}: {
  rows: StudentSubmission[];
  showGrade: boolean;
  onOpen?: (row: StudentSubmission) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[28rem] text-sm">
        <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Assignment</th>
            <th className="px-4 py-3 text-left">Submitted</th>
            {showGrade ? <th className="px-4 py-3 text-left">Grade</th> : null}
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left" />
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">{item.assignment?.title}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatShortDate(item.submittedAt)}</td>
              {showGrade ? (
                <td className="px-4 py-3">
                  {item.resultsReleased && item.grade != null ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-accent-green">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {item.grade}%
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              ) : null}
              <td className="px-4 py-3">
                {item.statusLabel ??
                  (item.resultsReleased && item.grade != null ? "Graded" : "Pending review")}
              </td>
              <td className="px-4 py-3 text-right">
                {onOpen ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpen(item)}>
                    Receipt
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
