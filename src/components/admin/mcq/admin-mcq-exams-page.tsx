"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Clock, Download, Pencil, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { AdminAssessmentBuilderModal } from "@/components/admin/mcq/admin-assessment-builder-modal";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import {
  useAdminCourses,
  useAdminMcqResults,
  useAdminSubjectsTree,
  useCourseAssignments,
  useDeleteAssignment,
  useDeleteMcqExam,
  useProgramAssignments,
  useUpdateAssignment,
  useUpdateMcqExam,
} from "@/hooks";
import { downloadCsv } from "@/lib/export-csv";
import { richTextToPlain } from "@/lib/rich-text";
import type { ApiError } from "@/types";
import type { StudentAssignment } from "@/types/student-dashboard.types";
import { cn } from "@/utils";

type ScopeFilter = "course" | "program";
export type AdminExamKind = "MCQ" | "WRITTEN";

function typeBadgeClass(type: string) {
  const t = type.toUpperCase();
  if (t === "MCQ") return "bg-primary-muted text-primary";
  if (t === "WRITTEN") return "bg-[#fff7ed] text-[#ea580c]";
  return "bg-muted text-muted-foreground";
}

function statusBadgeClass(status: string) {
  const s = status.toUpperCase();
  if (s === "PUBLISHED") return "bg-[#ecfdf3] text-accent-green";
  if (s === "CLOSED") return "bg-muted text-muted-foreground";
  return "bg-[#fff7ed] text-[#ea580c]";
}

function matchesExamKind(type: string, kind: AdminExamKind) {
  const t = type.toUpperCase();
  if (kind === "MCQ") return t === "MCQ";
  return t === "WRITTEN" || t === "FILE";
}

export function AdminMcqExamsPage({ examKind = "MCQ" }: { examKind?: AdminExamKind }) {
  const isMcqPage = examKind === "MCQ";
  const pageTitle = isMcqPage ? "MCQ Exams" : "Written Exams";
  const pageDescription = isMcqPage
    ? "Manage MCQ exams here. Create with the step-by-step wizard: Basics → Scope → Questions → Schedule → Preview → Publish."
    : "Manage written / file exams here. Create with the step-by-step wizard, then grade in Exams → Grading.";
  const newButtonLabel = isMcqPage ? "New MCQ exam" : "New written exam";
  const emptyLabel = isMcqPage
    ? "No MCQ exams for this scope."
    : "No written exams for this scope.";
  const allowedTypes = isMcqPage
    ? (["MCQ"] as const)
    : (["WRITTEN", "FILE"] as const);
  const { data: courses = [] } = useAdminCourses();
  const { data: subjectsTree = [] } = useAdminSubjectsTree();

  const programs = useMemo(
    () =>
      subjectsTree.flatMap((cat) =>
        (cat.subjects ?? []).flatMap((sub) =>
          (sub.programs ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            label: `${cat.name} / ${sub.name} / ${p.name}`,
          }))
        )
      ),
    [subjectsTree]
  );

  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("course");
  const [courseId, setCourseId] = useState("");
  const [programId, setProgramId] = useState("");
  const effectiveCourseId = courseId || courses[0]?.id;
  const effectiveProgramId = programId || programs[0]?.id;

  const courseQuery = useCourseAssignments(
    scopeFilter === "course" ? effectiveCourseId : undefined
  );
  const programQuery = useProgramAssignments(
    scopeFilter === "program" ? effectiveProgramId : undefined
  );

  const assessmentsRaw = scopeFilter === "course" ? courseQuery.data ?? [] : programQuery.data ?? [];
  const assessments = useMemo(
    () => assessmentsRaw.filter((item) => matchesExamKind(String(item.type), examKind)),
    [assessmentsRaw, examKind]
  );
  const isLoading = scopeFilter === "course" ? courseQuery.isLoading : programQuery.isLoading;
  const isFetching = scopeFilter === "course" ? courseQuery.isFetching : programQuery.isFetching;
  const error = scopeFilter === "course" ? courseQuery.error : programQuery.error;
  const refetch = () =>
    scopeFilter === "course" ? void courseQuery.refetch() : void programQuery.refetch();

  const updateExam = useUpdateMcqExam();
  const updateAssignment = useUpdateAssignment();
  const deleteExam = useDeleteMcqExam();
  const deleteAssignment = useDeleteAssignment();

  const [builderOpen, setBuilderOpen] = useState(false);
  const [editItem, setEditItem] = useState<StudentAssignment | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [resultsId, setResultsId] = useState<string | null>(null);
  const { data: results = [] } = useAdminMcqResults(resultsId ?? undefined);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([id]) => id),
    [selected]
  );

  const resultSummary = useMemo(() => {
    if (!results.length) return null;
    const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
    const passed = results.filter((r) => r.passed).length;
    return { avg, passed, total: results.length };
  }, [results]);

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    for (const a of assessments) next[a.id] = checked;
    setSelected(next);
  };

  const setStatusBulk = async (status: "PUBLISHED" | "CLOSED") => {
    if (!selectedIds.length) return;
    setBulkError(null);
    setBulkBusy(true);
    try {
      for (const id of selectedIds) {
        const item = assessments.find((a) => a.id === id);
        if (!item) continue;
        if (String(item.type).toUpperCase() === "MCQ") {
          await updateExam.mutateAsync({ id, payload: { status } });
        } else {
          await updateAssignment.mutateAsync({ id, payload: { status } });
        }
      }
      setSelected({});
      refetch();
    } catch (err) {
      setBulkError((err as ApiError)?.message || "Bulk update failed");
    } finally {
      setBulkBusy(false);
    }
  };

  const onDelete = async (item: StudentAssignment) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    if (String(item.type).toUpperCase() === "MCQ") {
      await deleteExam.mutateAsync(item.id);
    } else {
      await deleteAssignment.mutateAsync(item.id);
    }
    refetch();
  };

  const exportListCsv = () => {
    downloadCsv(isMcqPage ? "mcq-exams.csv" : "written-exams.csv", [
      ["Title", "Type", "Status", "Scope", "Duration", "Questions", "Attempts", "Submissions"],
      ...assessments.map((a) => [
        a.title,
        String(a.type),
        String(a.status ?? ""),
        a.course?.title ?? a.program?.name ?? "",
        a.durationMinutes ?? "",
        a._count?.questions ?? "",
        a._count?.mcqAttempts ?? "",
        a._count?.submissions ?? "",
      ]),
    ]);
  };

  if (isLoading && assessments.length === 0 && (courses.length > 0 || programs.length > 0)) {
    return <PageLoader label={`Loading ${isMcqPage ? "MCQ" : "written"} exams...`} />;
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader title={pageTitle} description={pageDescription} className="mb-0" />
            <div className="flex flex-wrap gap-2">
              <AdminIconAction
                label="Refresh"
                icon={RefreshCw}
                tone="primary"
                disabled={isFetching}
                onClick={refetch}
                className={isFetching ? "animate-spin" : undefined}
              />
              <Button type="button" size="sm" variant="outline" onClick={exportListCsv}>
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setEditItem(null);
                  setBuilderOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                {newButtonLabel}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={scopeFilter === "course" ? "default" : "outline"}
              onClick={() => setScopeFilter("course")}
            >
              Course
            </Button>
            <Button
              type="button"
              size="sm"
              variant={scopeFilter === "program" ? "default" : "outline"}
              onClick={() => setScopeFilter("program")}
            >
              Program
            </Button>
          </div>

          {scopeFilter === "course" ? (
            <label className="mt-3 block max-w-md space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Course
              </span>
              <select
                value={effectiveCourseId ?? ""}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setSelected({});
                }}
                className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="mt-3 block max-w-xl space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Subject program
              </span>
              <select
                value={effectiveProgramId ?? ""}
                onChange={(e) => {
                  setProgramId(e.target.value);
                  setSelected({});
                }}
                className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {error ? (
            <p className="mt-2 text-sm text-accent">{(error as unknown as ApiError)?.message}</p>
          ) : null}

          <p className="mt-3 text-sm text-muted-foreground">
            {isMcqPage ? (
              <>
                Need written work? Open{" "}
                <Link
                  href={ROUTES.admin.examsWritten}
                  className="font-semibold text-primary hover:underline"
                >
                  Written Exams
                </Link>
                .
              </>
            ) : (
              <>
                Grade submissions in the{" "}
                <Link
                  href={ROUTES.admin.gradingQueue}
                  className="font-semibold text-primary hover:underline"
                >
                  grading queue
                </Link>
                . MCQ exams live under{" "}
                <Link
                  href={ROUTES.admin.examsMcq}
                  className="font-semibold text-primary hover:underline"
                >
                  MCQ Exams
                </Link>
                .
              </>
            )}
          </p>
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-5 py-3">
            <span className="text-sm font-semibold">{selectedIds.length} selected</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={bulkBusy}
              onClick={() => void setStatusBulk("PUBLISHED")}
            >
              Publish
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={bulkBusy}
              onClick={() => void setStatusBulk("CLOSED")}
            >
              Close
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setSelected({})}>
              Clear
            </Button>
            {bulkError ? <p className="w-full text-sm text-accent">{bulkError}</p> : null}
          </div>
        ) : null}

        <div className="divide-y divide-border">
          <div className="flex items-center gap-3 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <input
              type="checkbox"
              checked={assessments.length > 0 && selectedIds.length === assessments.length}
              onChange={(e) => toggleAll(e.target.checked)}
              aria-label="Select all"
            />
            <span>{isMcqPage ? "MCQ exams" : "Written exams"}</span>
          </div>
          {assessments.length === 0 ? (
            <p className="px-5 py-10 text-center text-muted-foreground">{emptyLabel}</p>
          ) : null}
          {assessments.map((item) => {
            const isMcq = String(item.type).toUpperCase() === "MCQ";
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Boolean(selected[item.id])}
                    onChange={(e) =>
                      setSelected((prev) => ({ ...prev, [item.id]: e.target.checked }))
                    }
                    aria-label={`Select ${item.title}`}
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          typeBadgeClass(String(item.type))
                        )}
                      >
                        {String(item.type)}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                          statusBadgeClass(String(item.status ?? "DRAFT"))
                        )}
                      >
                        {String(item.status ?? "DRAFT")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {richTextToPlain(item.description)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {isMcq ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
                          <Clock className="h-3 w-3" />
                          {item.durationMinutes ?? "—"} min
                        </span>
                      ) : null}
                      {isMcq ? (
                        <span className="rounded-md bg-muted px-2 py-0.5">
                          {item._count?.questions ?? 0} questions
                        </span>
                      ) : null}
                      <span className="rounded-md bg-muted px-2 py-0.5">
                        {item.course?.title ?? item.program?.name ?? "—"}
                      </span>
                      {isMcq ? (
                        <span className="rounded-md bg-muted px-2 py-0.5">
                          {item._count?.mcqAttempts ?? 0} attempts
                        </span>
                      ) : (
                        <span className="rounded-md bg-muted px-2 py-0.5">
                          {item._count?.submissions ?? 0} submissions
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isMcq ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => setResultsId(item.id)}>
                      <Users className="h-4 w-4" />
                      Results
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditItem(item);
                      setBuilderOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-accent"
                    onClick={() => void onDelete(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AdminAssessmentBuilderModal
        open={builderOpen}
        onClose={() => {
          setBuilderOpen(false);
          setEditItem(null);
          refetch();
        }}
        courses={courses.map((c) => ({ id: c.id, title: c.title }))}
        programs={programs}
        editItem={editItem}
        defaultCourseId={scopeFilter === "course" ? effectiveCourseId : undefined}
        defaultProgramId={scopeFilter === "program" ? effectiveProgramId : undefined}
        allowedTypes={[...allowedTypes]}
      />

      <AdminModal
        open={Boolean(resultsId)}
        title="Exam results"
        description={
          resultSummary
            ? `Avg ${resultSummary.avg}% · ${resultSummary.passed}/${resultSummary.total} passed`
            : undefined
        }
        onClose={() => setResultsId(null)}
        className="sm:max-w-3xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!results.length}
              onClick={() =>
                downloadCsv(`mcq-results-${resultsId ?? "export"}.csv`, [
                  ["Student", "Phone", "Attempt", "Score", "Passed", "Submitted"],
                  ...results.map((r) => [
                    r.student.name,
                    r.student.phone,
                    r.attemptNumber,
                    r.score,
                    r.passed ? "Pass" : "Fail",
                    r.submittedAt ? new Date(r.submittedAt).toISOString() : "",
                  ]),
                ])
              }
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button type="button" variant="outline" onClick={() => setResultsId(null)}>
              Close
            </Button>
          </div>
        }
      >
        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground">No student attempts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Student</th>
                  <th className="py-2">Attempt</th>
                  <th className="py-2">Score</th>
                  <th className="py-2">Result</th>
                  <th className="py-2">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="py-2">{r.student.name}</td>
                    <td className="py-2">#{r.attemptNumber}</td>
                    <td className="py-2 font-semibold">{r.score}%</td>
                    <td className="py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          r.passed ? "bg-[#ecfdf3] text-accent-green" : "bg-accent/10 text-accent"
                        )}
                      >
                        {r.passed ? "Pass" : "Fail"}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminModal>
    </>
  );
}
