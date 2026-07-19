"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import { useGradeSubmission, useUngradedSubmissions } from "@/hooks";
import { formatShortDate } from "@/lib/format";
import type { ApiError } from "@/types";
import type { UngradedSubmission } from "@/types/student-dashboard.types";

function uniqueFiles(urls: Array<string | null | undefined>) {
  return [...new Set(urls.filter((u): u is string => Boolean(u && u.trim())))];
}

function GradeForm({ item, onDone }: { item: UngradedSubmission; onDone: () => void }) {
  const gradeMutation = useGradeSubmission();
  const [grade, setGrade] = useState(item.grade != null ? String(item.grade) : "");
  const [feedback, setFeedback] = useState(item.feedback ?? "");
  const [error, setError] = useState<string | null>(null);

  const save = async (publish: boolean) => {
    const value = Number.parseInt(grade, 10);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      setError("Enter a grade between 0 and 100");
      return;
    }
    setError(null);
    try {
      await gradeMutation.mutateAsync({
        id: item.id,
        grade: value,
        feedback: feedback.trim() || undefined,
        publish,
      });
      onDone();
    } catch (err) {
      setError((err as ApiError).message || "Grading failed");
    }
  };

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-semibold">Marks (0–100)</span>
          <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="85" />
        </label>
        <label className="space-y-1 text-sm sm:col-span-2">
          <span className="font-semibold">Feedback (optional)</span>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            placeholder="Comments for the student…"
          />
        </label>
      </div>
      {item.answerText ? (
        <div className="rounded-lg border border-border bg-card p-3 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Answer text</p>
          <p className="whitespace-pre-wrap">{item.answerText}</p>
        </div>
      ) : null}
      {uniqueFiles([item.fileUrl, ...(item.fileUrls ?? [])]).length ? (
        <div className="text-sm">
          <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Files</p>
          {uniqueFiles([item.fileUrl, ...(item.fileUrls ?? [])]).map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="block truncate text-primary hover:underline"
            >
              {url}
            </a>
          ))}
        </div>
      ) : null}
      {item.grade != null ? (
        <p className="text-xs text-muted-foreground">
          Draft marks currently saved: {item.grade}% (not visible to student until published)
        </p>
      ) : null}
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={gradeMutation.isPending}
          onClick={() => void save(false)}
        >
          {gradeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save draft
        </Button>
        <Button type="button" size="sm" disabled={gradeMutation.isPending} onClick={() => void save(true)}>
          {gradeMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" /> Publish result
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

type GradingQueueProps = {
  title?: string;
  description?: string;
  assessmentsHref?: string;
  assessmentsLabel?: string;
};

export function GradingQueuePage({
  title = "Grading queue",
  description = "Review written/file submissions. Save draft marks privately, then publish when ready.",
  assessmentsHref = ROUTES.admin.mcqExams,
  assessmentsLabel = "Assessments",
}: GradingQueueProps) {
  const { data = [], isLoading, error, refetch } = useUngradedSubmissions();
  const [gradingId, setGradingId] = useState<string | null>(null);

  if (isLoading && data.length === 0) {
    return <PageLoader label="Loading grading queue…" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title={title} description={description} className="mb-0" />
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
          Refresh
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-accent">{(error as unknown as ApiError)?.message}</p>
      ) : null}

      <p className="text-sm text-muted-foreground">
        MCQ exams are auto-marked. Manage exams from{" "}
        <Link href={assessmentsHref} className="font-semibold text-primary hover:underline">
          {assessmentsLabel}
        </Link>
        .
      </p>

      {data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center text-sm text-muted-foreground">
          No ungraded submissions in the queue.
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((item) => (
            <article key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    {item.assignment?.course?.title ?? item.assignment?.program?.name ?? "Assessment"}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-foreground">{item.assignment?.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.student?.name ?? "Student"} · submitted {formatShortDate(item.submittedAt)} ·{" "}
                    {String(item.assignment?.type ?? "FILE")}
                    {item.grade != null ? " · draft saved" : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={gradingId === item.id ? "outline" : "default"}
                  onClick={() => setGradingId(gradingId === item.id ? null : item.id)}
                >
                  {gradingId === item.id ? "Close" : "Grade"}
                </Button>
              </div>
              {gradingId === item.id ? (
                <GradeForm item={item} onDone={() => setGradingId(null)} />
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminGradingQueuePage() {
  return (
    <GradingQueuePage assessmentsHref={ROUTES.admin.mcqExams} assessmentsLabel="MCQ Exams" />
  );
}
