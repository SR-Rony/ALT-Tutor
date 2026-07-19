"use client";

import { useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  useAdminCourses,
  useAdminSubjectsTree,
  useGradebook,
  useGradeOverride,
} from "@/hooks";
import { downloadCsv } from "@/lib/export-csv";
import type { ApiError } from "@/types";

export function AdminGradebookPage() {
  const { data: courses = [] } = useAdminCourses();
  const { data: subjectsTree = [] } = useAdminSubjectsTree();
  const [scope, setScope] = useState<"course" | "program">("course");
  const [courseId, setCourseId] = useState("");
  const [programId, setProgramId] = useState("");
  const effectiveCourseId = courseId || courses[0]?.id;
  const programs = useMemo(
    () =>
      subjectsTree.flatMap((cat) =>
        (cat.subjects ?? []).flatMap((sub) =>
          (sub.programs ?? []).map((p) => ({
            id: p.id,
            label: `${cat.name} / ${sub.name} / ${p.name}`,
          }))
        )
      ),
    [subjectsTree]
  );
  const effectiveProgramId = programId || programs[0]?.id;

  const filters =
    scope === "course"
      ? { courseId: effectiveCourseId }
      : { programId: effectiveProgramId };

  const { data, isLoading, error, refetch, isFetching } = useGradebook(filters);
  const override = useGradeOverride();
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const exportCsv = () => {
    if (!data) return;
    const header = ["Student", "Phone", "Average", ...data.assignments.map((a) => a.title)];
    const rows = data.rows.map((row) => [
      row.student.name,
      row.student.phone,
      row.average ?? "",
      ...row.grades.map((g) => (g.scorePercent == null ? g.status : g.scorePercent)),
    ]);
    downloadCsv("gradebook.csv", [header, ...rows]);
  };

  const onOverride = async (assignmentId: string, studentId: string) => {
    const raw = window.prompt("Override score percent (0-100)");
    if (raw == null) return;
    const scorePercent = Number.parseFloat(raw);
    if (Number.isNaN(scorePercent)) return;
    const note = window.prompt("Note (optional)") ?? undefined;
    setOverrideError(null);
    try {
      await override.mutateAsync({ assignmentId, studentId, scorePercent, note });
    } catch (err) {
      setOverrideError((err as ApiError)?.message || "Override failed");
    }
  };

  if (isLoading && !data) {
    return <PageLoader label="Loading gradebook..." />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="border-b border-border px-5 py-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <PageHeader
            title="Gradebook"
            description="Released MCQ/written scores with override audit support."
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
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={scope === "course" ? "default" : "outline"}
            onClick={() => setScope("course")}
          >
            Course
          </Button>
          <Button
            type="button"
            size="sm"
            variant={scope === "program" ? "default" : "outline"}
            onClick={() => setScope("program")}
          >
            Program
          </Button>
        </div>
        {scope === "course" ? (
          <select
            className="mt-3 flex h-10 max-w-md rounded-xl border border-border bg-card px-3 text-sm"
            value={effectiveCourseId ?? ""}
            onChange={(e) => setCourseId(e.target.value)}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        ) : (
          <select
            className="mt-3 flex h-10 max-w-xl rounded-xl border border-border bg-card px-3 text-sm"
            value={effectiveProgramId ?? ""}
            onChange={(e) => setProgramId(e.target.value)}
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        )}
        {error ? (
          <p className="mt-2 text-sm text-accent">{(error as unknown as ApiError)?.message}</p>
        ) : null}
        {overrideError ? <p className="mt-2 text-sm text-accent">{overrideError}</p> : null}
      </div>

      {!data || data.assignments.length === 0 ? (
        <p className="px-5 py-10 text-center text-muted-foreground">
          No published assessments in this scope.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Avg</th>
                {data.assignments.map((a) => (
                  <th key={a.id} className="px-4 py-3">
                    <div className="font-semibold text-foreground normal-case">{a.title}</div>
                    <div className="font-normal">{a.type}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.student.id} className="border-b border-border/60">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{row.student.name}</div>
                    <div className="text-xs text-muted-foreground">{row.student.phone}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {row.average != null ? `${row.average}%` : "—"}
                  </td>
                  {row.grades.map((g) => (
                    <td key={g.assignmentId} className="px-4 py-3">
                      <button
                        type="button"
                        className="text-left hover:underline"
                        onClick={() => void onOverride(g.assignmentId, row.student.id)}
                        title="Click to override"
                      >
                        {g.scorePercent != null ? `${g.scorePercent}%` : g.status}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
