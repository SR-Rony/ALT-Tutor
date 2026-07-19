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
  Upload,
} from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import {
  useMyAssignments,
  useMyMcqExams,
  useStudentSubmissions,
  useSubmitAssignment,
} from "@/hooks";
import { uploadService } from "@/services/upload.service";
import { formatShortDate } from "@/lib/format";
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
  const [answerText, setAnswerText] = useState(existing?.answerText ?? "");
  const [fileUrl, setFileUrl] = useState(existing?.fileUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const result = await uploadService.upload(file, "assignments");
      setFileUrl(result.url);
    } catch (err) {
      setError((err as ApiError).message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    if (!answerText.trim() && !fileUrl.trim()) {
      setError("Provide written answer text and/or upload a file");
      return;
    }
    setError(null);
    try {
      await submit.mutateAsync({
        assignmentId: assignment.id,
        answerText: answerText.trim() || undefined,
        fileUrl: fileUrl.trim() || undefined,
        fileUrls: fileUrl.trim() ? [fileUrl.trim()] : undefined,
      });
      onClose();
    } catch (err) {
      setError((err as ApiError).message || "Submission failed");
    }
  };

  const busy = submit.isPending || uploading;

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
          <Button type="button" disabled={busy} onClick={() => void onSubmit()}>
            {submit.isPending ? "Submitting…" : existing ? "Update submission" : "Submit"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {assignment.instructions ? (
          <p className="rounded-xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            {assignment.instructions}
          </p>
        ) : assignment.description ? (
          <p className="text-sm text-muted-foreground">{assignment.description}</p>
        ) : null}
        <label className="block space-y-1.5 text-sm">
          <span className="font-semibold">Written answer</span>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            rows={6}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            placeholder="Type your response here…"
          />
        </label>
        <div className="space-y-2">
          <span className="text-sm font-semibold">Attachment (optional)</span>
          <Input
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="Paste file URL or upload below"
          />
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload file
            <input
              type="file"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUpload(file);
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

export function StudentExamCenterPage() {
  const [tab, setTab] = useState<TabId>("upcoming");
  const [submitTarget, setSubmitTarget] = useState<StudentAssignment | null>(null);
  const { data: assignments = [], isLoading: assignmentsLoading } = useMyAssignments();
  const { data: mcqExams = [], isLoading: mcqLoading } = useMyMcqExams();
  const { data: submissions = [], isLoading: subLoading } = useStudentSubmissions();

  const writtenAssignments = useMemo(
    () => assignments.filter((a) => isWrittenType(String(a.type)) && String(a.type).toUpperCase() !== "MCQ"),
    [assignments]
  );

  const upcoming = useMemo(() => {
    const now = Date.now();
    return assignments.filter((a) => {
      if (String(a.type).toUpperCase() === "MCQ") return false;
      const sub = submissionForAssignment(submissions, a.id);
      if (sub) return false;
      if (!a.dueDate) return true;
      return new Date(a.dueDate).getTime() >= now;
    });
  }, [assignments, submissions]);

  const completed = useMemo(() => {
    return submissions.filter((s) => s.status === "GRADED" || s.grade != null);
  }, [submissions]);

  const pendingReview = useMemo(() => {
    return submissions.filter((s) => s.status !== "GRADED" && s.grade == null);
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
          {upcoming.length === 0 && mcqExams.filter((e) => (e.mcqStatus?.phase ?? "NOT_STARTED") !== "COMPLETED").length === 0 ? (
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
                return (
                  <AssessmentCard
                    key={item.id}
                    title={item.title}
                    context={assignmentContext(item)}
                    dueDate={item.dueDate}
                    type={String(item.type)}
                    statusLabel={sub ? "Submitted" : "Not submitted"}
                    onAction={() => setSubmitTarget(item)}
                    actionLabel={sub ? "Update submission" : "Submit"}
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
            />
          )}
        </section>
      ) : null}

      {tab === "results" ? (
        <section className="space-y-6">
          {completed.length === 0 &&
          mcqExams.every((e) => !e.mcqStatus?.latestResult) ? (
            <EmptyState message="No graded results yet." />
          ) : null}
          {completed.length > 0 ? (
            <div>
              <h2 className="mb-3 text-lg font-bold text-foreground">Written &amp; file submissions</h2>
              <SubmissionTable rows={completed} showGrade />
            </div>
          ) : null}
          {mcqExams.some((e) => e.mcqStatus?.latestResult) ? (
            <div>
              <h2 className="mb-3 text-lg font-bold text-foreground">MCQ exam scores</h2>
              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full min-w-[28rem] text-sm">
                  <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Exam</th>
                      <th className="px-4 py-3 text-left">Course</th>
                      <th className="px-4 py-3 text-left">Score</th>
                      <th className="px-4 py-3 text-left">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mcqExams
                      .filter((e) => e.mcqStatus?.latestResult)
                      .map((exam) => (
                        <tr key={exam.id} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium">{exam.title}</td>
                          <td className="px-4 py-3 text-muted-foreground">{exam.course?.title}</td>
                          <td className="px-4 py-3">{exam.mcqStatus?.latestResult?.score}%</td>
                          <td className="px-4 py-3">
                            {exam.mcqStatus?.latestResult?.passed ? (
                              <span className="text-accent-green">Pass</span>
                            ) : (
                              <span className="text-accent">Fail</span>
                            )}
                          </td>
                        </tr>
                      ))}
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
}: {
  title: string;
  context: string;
  dueDate?: string | null;
  type: string;
  href?: string;
  onAction?: () => void;
  actionLabel?: string;
  statusLabel?: string;
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
        {statusLabel ? (
          <span className="rounded-full bg-primary-muted px-2.5 py-1 font-semibold text-primary">
            {statusLabel}
          </span>
        ) : null}
      </div>
      {href ? (
        <Button asChild size="pill" className="mt-4 w-full">
          <Link href={href}>
            <PlayCircle className="h-4 w-4" />
            {actionLabel}
          </Link>
        </Button>
      ) : onAction ? (
        <Button type="button" size="pill" className="mt-4 w-full" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </article>
  );
}

function SubmissionTable({
  rows,
  showGrade,
}: {
  rows: StudentSubmission[];
  showGrade: boolean;
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
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">{item.assignment?.title}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatShortDate(item.submittedAt)}</td>
              {showGrade ? (
                <td className="px-4 py-3">
                  {item.grade != null ? (
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
                {item.grade != null ? "Graded" : "Pending review"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
