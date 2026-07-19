"use client";

import Link from "next/link";
import { ArrowRight, Clock, HelpCircle, PlayCircle } from "lucide-react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants";
import { useMyMcqExams, useStudentSubmissions } from "@/hooks";
import { formatShortDate } from "@/lib/format";
import type { ApiError } from "@/types";
import type { McqPhase } from "@/types/mcq.types";
import { cn } from "@/utils";

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

function actionLabel(phase: McqPhase) {
  switch (phase) {
    case "IN_PROGRESS":
      return "Continue";
    case "CAN_RETAKE":
      return "Retake";
    case "COMPLETED":
      return "View result";
    default:
      return "Open exam";
  }
}

export function StudentAssignmentsPage() {
  const { data: mcqExams = [], isLoading: mcqLoading, error: mcqError } = useMyMcqExams();
  const { data: submissions = [], isLoading: subLoading, error: subError } = useStudentSubmissions();

  const isLoading = mcqLoading && subLoading;

  if (isLoading && mcqExams.length === 0 && submissions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assignments" description="MCQ exams and file submissions." className="mb-0" />
        <PageLoader label="Loading..." />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-0 sm:space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader
          title="Assignments & MCQ Exams"
          description="Timed MCQ exams start when you click Start. Retakes available when configured."
          className="mb-0"
        />
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.student.assessments}>
            Open Exam Center
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {(mcqError || subError) && (
        <p className="text-sm text-accent">
          {(mcqError as unknown as ApiError)?.message ||
            (subError as unknown as ApiError)?.message}
        </p>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-bold text-foreground md:text-xl">MCQ Exams</h2>
          {mcqExams.length > 0 ? (
            <p className="text-sm text-muted-foreground">{mcqExams.length} exams available</p>
          ) : null}
        </div>

        {mcqExams.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No MCQ exams in your enrolled courses yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {mcqExams.map((exam) => {
              const st = exam.mcqStatus;
              const phase = st?.phase ?? "NOT_STARTED";
              const status = phaseMeta(phase);
              const questionCount = exam._count?.questions ?? 0;

              return (
                <article
                  key={exam.id}
                  className="flex h-full min-h-[15.5rem] flex-col rounded-2xl border border-border bg-card p-4 shadow-[0_8px_24px_-16px_rgba(24,119,242,0.12)] transition hover:border-primary/25 hover:shadow-[0_12px_32px_-14px_rgba(24,119,242,0.18)] sm:p-5"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-primary sm:text-xs">
                    {exam.course?.title ?? "Course"}
                  </p>
                  <h3 className="mt-1.5 line-clamp-2 text-base font-bold leading-snug text-foreground">
                    {exam.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {exam.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-foreground sm:text-xs">
                      <Clock className="h-3 w-3 shrink-0 text-primary" aria-hidden />
                      {exam.durationMinutes} min
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-foreground sm:text-xs">
                      <HelpCircle className="h-3 w-3 shrink-0 text-primary" aria-hidden />
                      {questionCount} Q
                    </span>
                    {st ? (
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-semibold sm:text-xs",
                          status.className
                        )}
                      >
                        {status.label}
                      </span>
                    ) : null}
                    {st?.latestResult ? (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground sm:text-xs">
                        Score: {st.latestResult.score}%
                      </span>
                    ) : null}
                  </div>

                  <Button asChild size="pill" className="mt-4 w-full sm:mt-5">
                    <Link href={ROUTES.student.mcqExam(exam.id)}>
                      <PlayCircle className="h-4 w-4" aria-hidden />
                      {actionLabel(phase)}
                    </Link>
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground md:text-xl">File submissions</h2>
        {submissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground sm:px-6">
            No file submissions yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[28rem] text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Assignment</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Grade</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{item.assignment?.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatShortDate(item.submittedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {item.grade != null ? `${item.grade}%` : "Pending"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
