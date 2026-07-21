"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGradebook, useGradeOverride, useTeacherCourses } from "@/hooks";
import { downloadCsv } from "@/lib/export-csv";
import type { ApiError } from "@/types";

type OverrideTarget = {
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  current?: number | null;
};

export function TeacherGradebookPage() {
  const searchParams = useSearchParams();
  const { data: courseData } = useTeacherCourses();
  const courses = courseData?.all ?? [];
  const [courseId, setCourseId] = useState("");
  const effectiveCourseId = courseId || courses[0]?.id;
  const { data, isLoading, error, refetch, isFetching } = useGradebook({
    courseId: effectiveCourseId,
  });
  const override = useGradeOverride();

  const [overrideTarget, setOverrideTarget] = useState<OverrideTarget | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [reason, setReason] = useState("");
  const [overrideError, setOverrideError] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = searchParams.get("courseId");
    if (!fromQuery || !courses.length) return;
    if (courses.some((c) => c.id === fromQuery)) {
      setCourseId(fromQuery);
    }
  }, [courses, searchParams]);

  const openOverride = (target: OverrideTarget) => {
    setOverrideTarget(target);
    setScoreInput(target.current != null ? String(target.current) : "");
    setReason("");
    setOverrideError(null);
  };

  const saveOverride = async () => {
    if (!overrideTarget) return;
    const scorePercent = Number.parseFloat(scoreInput);
    if (Number.isNaN(scorePercent) || scorePercent < 0 || scorePercent > 100) {
      setOverrideError("Enter a score between 0 and 100");
      return;
    }
    setOverrideError(null);
    try {
      await override.mutateAsync({
        assignmentId: overrideTarget.assignmentId,
        studentId: overrideTarget.studentId,
        scorePercent,
        ...(reason.trim() ? { note: reason.trim() } : {}),
      });
      setOverrideTarget(null);
    } catch (err) {
      setOverrideError((err as ApiError)?.message || "Failed to override score");
    }
  };

  const exportCsv = () => {
    if (!data) return;
    const header = ["Student", "Phone", "Average", ...data.assignments.map((a) => a.title)];
    const rows = data.rows.map((row) => [
      row.student.name,
      row.student.phone,
      row.average ?? "",
      ...row.grades.map((g) => (g.scorePercent == null ? g.status : g.scorePercent)),
    ]);
    downloadCsv("teacher-gradebook.csv", [header, ...rows]);
  };

  if (isLoading && !data && courses.length > 0) {
    return <PageLoader label="Loading gradebook..." />;
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="Gradebook"
              description="Released scores for your courses. Click a cell to override a grade."
              className="mb-0"
            />
            <div className="flex gap-2">
              <AdminIconAction
                label="Refresh"
                icon={RefreshCw}
                tone="primary"
                disabled={isFetching}
                onClick={() => void refetch()}
                className={isFetching ? "animate-spin" : undefined}
              />
              <Button type="button" size="sm" variant="outline" onClick={exportCsv} disabled={!data}>
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>
          <select
            className="flex h-10 max-w-md rounded-xl border border-border bg-card px-3 text-sm"
            value={effectiveCourseId ?? ""}
            onChange={(e) => setCourseId(e.target.value)}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          {error ? (
            <p className="mt-2 text-sm text-accent">{(error as unknown as ApiError)?.message}</p>
          ) : null}
        </div>
        {!data || data.rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-muted-foreground">No grade rows yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Avg</th>
                  {data.assignments.map((a) => (
                    <th key={a.id} className="px-4 py-3">
                      {a.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.student.id} className="border-b border-border/60">
                    <td className="px-4 py-3 font-semibold">{row.student.name}</td>
                    <td className="px-4 py-3">
                      {row.average != null ? `${row.average}%` : "—"}
                    </td>
                    {row.grades.map((g) => {
                      const assignment = data.assignments.find((a) => a.id === g.assignmentId);
                      return (
                        <td key={g.assignmentId} className="px-4 py-3">
                          <button
                            type="button"
                            className="rounded-md px-1.5 py-0.5 font-medium text-primary hover:bg-primary/10"
                            onClick={() =>
                              openOverride({
                                assignmentId: g.assignmentId,
                                assignmentTitle: assignment?.title ?? "Assessment",
                                studentId: row.student.id,
                                studentName: row.student.name,
                                current: g.scorePercent,
                              })
                            }
                          >
                            {g.scorePercent != null ? `${g.scorePercent}%` : g.status}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminModal
        open={Boolean(overrideTarget)}
        title="Override grade"
        description={
          overrideTarget
            ? `${overrideTarget.studentName} · ${overrideTarget.assignmentTitle}`
            : undefined
        }
        onClose={() => !override.isPending && setOverrideTarget(null)}
        className="sm:max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={override.isPending}
              onClick={() => setOverrideTarget(null)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={override.isPending} onClick={() => void saveOverride()}>
              {override.isPending ? "Saving…" : "Save override"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">Score percent (0–100)</span>
            <Input
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value)}
              inputMode="decimal"
              disabled={override.isPending}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">Reason (optional)</span>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Late penalty waived"
              disabled={override.isPending}
            />
          </label>
          {overrideError ? <p className="text-sm text-accent">{overrideError}</p> : null}
        </div>
      </AdminModal>
    </>
  );
}
