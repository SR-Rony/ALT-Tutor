"use client";

import Link from "next/link";
import { Clock, PlayCircle } from "lucide-react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants";
import { useMyMcqExams, useStudentSubmissions } from "@/hooks";
import { formatShortDate } from "@/lib/format";
import type { ApiError } from "@/types";
import { cn } from "@/utils";

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
    <div className="space-y-6">
      <PageHeader
        title="Assignments & MCQ Exams"
        description="Timed MCQ exams start when you click Start. Retakes available when configured."
        className="mb-0"
      />

      {(mcqError || subError) && (
        <p className="text-sm text-accent">
          {(mcqError as unknown as ApiError)?.message ||
            (subError as unknown as ApiError)?.message}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">MCQ Exams</h2>
        {mcqExams.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No MCQ exams in your enrolled courses yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {mcqExams.map((exam) => {
              const st = exam.mcqStatus;
              const phase = st?.phase ?? "NOT_STARTED";
              return (
                <article
                  key={exam.id}
                  className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase text-primary">
                    {exam.course?.title ?? "Course"}
                  </p>
                  <h3 className="mt-1 font-bold text-foreground">{exam.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{exam.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
                      <Clock className="h-3 w-3" />
                      {exam.durationMinutes} min
                    </span>
                    <span className="rounded-md bg-muted px-2 py-0.5">
                      {exam._count?.questions ?? 0} Q
                    </span>
                    {st ? (
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 font-semibold",
                          phase === "COMPLETED"
                            ? "bg-muted text-muted-foreground"
                            : phase === "CAN_RETAKE"
                              ? "bg-primary-muted text-primary"
                              : phase === "IN_PROGRESS"
                                ? "bg-[#fff7ed] text-[#ea580c]"
                                : "bg-primary/10 text-primary"
                        )}
                      >
                        {phase === "NOT_STARTED"
                          ? "Not started"
                          : phase === "IN_PROGRESS"
                            ? "In progress"
                            : phase === "CAN_RETAKE"
                              ? "Retake available"
                              : "Completed"}
                      </span>
                    ) : null}
                    {st?.latestResult ? (
                      <span className="rounded-md bg-muted px-2 py-0.5">
                        Score: {st.latestResult.score}%
                      </span>
                    ) : null}
                  </div>
                  <Button asChild size="sm" className="mt-4 w-full">
                    <Link href={ROUTES.student.mcqExam(exam.id)}>
                      <PlayCircle className="h-4 w-4" />
                      {phase === "IN_PROGRESS"
                        ? "Continue"
                        : phase === "CAN_RETAKE"
                          ? "Retake"
                          : phase === "COMPLETED"
                            ? "View result"
                            : "Open exam"}
                    </Link>
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">File submissions</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No file submissions yet.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
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
