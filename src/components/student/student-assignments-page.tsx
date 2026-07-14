"use client";

import Link from "next/link";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants";
import { useStudentSubmissions } from "@/hooks";
import { formatShortDate } from "@/lib/format";
import type { ApiError } from "@/types";
import { cn } from "@/utils";

export function StudentAssignmentsPage() {
  const { data = [], isLoading, error, refetch } = useStudentSubmissions();

  if (isLoading && data.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Assignments"
          description="Your submissions, grades, and feedback."
          className="mb-0"
        />
        <PageLoader label="Loading assignments..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <PageHeader
          title="My Submissions"
          description="Track file submissions and graded feedback from instructors."
          className="mb-0"
        />
        {error ? (
          <p className="mt-3 text-sm text-accent">
            {(error as unknown as ApiError)?.message || "Failed to load"}
            <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
              Retry
            </button>
          </p>
        ) : null}
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-14 text-center">
            <p className="text-sm text-muted-foreground">
              No submissions yet. Open a course to find assignments and submit your work.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href={ROUTES.student.courses}>Go to My Courses</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Assignment</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Submitted</th>
                  <th className="px-5 py-3 font-semibold">Grade</th>
                  <th className="px-5 py-3 font-semibold">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-foreground">
                        {item.assignment?.title ?? "Assignment"}
                      </p>
                      {item.fileUrl ? (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          View file
                        </a>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground">
                        {String(item.assignment?.type ?? "FILE").toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatShortDate(item.submittedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "font-semibold",
                          item.grade != null ? "text-accent-green" : "text-muted-foreground"
                        )}
                      >
                        {item.grade != null ? `${item.grade}%` : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {item.feedback || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
