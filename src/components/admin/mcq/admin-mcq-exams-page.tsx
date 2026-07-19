"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Clock, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import {
  useAdminCourses,
  useAdminMcqExams,
  useAdminMcqResults,
  useCourseAssignments,
  useCreateMcqExam,
  useDeleteMcqExam,
} from "@/hooks";
import type { ApiError } from "@/types";
import type { CreateMcqExamInput } from "@/types/mcq.types";
import { cn } from "@/utils";

const LETTERS = ["A", "B", "C", "D"];

function emptyQuestion() {
  return { text: "", options: ["", "", "", ""], correctAnswer: "A" };
}

export function AdminMcqExamsPage() {
  const { data: courses = [] } = useAdminCourses();
  const [courseId, setCourseId] = useState("");
  const effectiveCourseId = courseId || courses[0]?.id;
  const { data: exams = [], isLoading, error, refetch, isFetching } = useAdminMcqExams(
    effectiveCourseId
  );
  // Assessment workspace: MCQ builder below; written grading lives in /admin/grading.
  const { data: courseAssignments = [] } = useCourseAssignments(effectiveCourseId);
  const createExam = useCreateMcqExam();
  const deleteExam = useDeleteMcqExam();

  const [modal, setModal] = useState<"create" | null>(null);
  const [resultsId, setResultsId] = useState<string | null>(null);
  const { data: results = [] } = useAdminMcqResults(resultsId ?? undefined);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("15");
  const [maxAttempts, setMaxAttempts] = useState("2");
  const [passingScore, setPassingScore] = useState("60");
  const [questions, setQuestions] = useState([emptyQuestion(), emptyQuestion()]);
  const [actionError, setActionError] = useState<string | null>(null);

  const busy = createExam.isPending || deleteExam.isPending;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDurationMinutes("15");
    setMaxAttempts("2");
    setPassingScore("60");
    setQuestions([emptyQuestion(), emptyQuestion()]);
  };

  const onSave = async () => {
    if (!effectiveCourseId) return;
    setActionError(null);
    const payload: CreateMcqExamInput = {
      title: title.trim(),
      description: description.trim(),
      courseId: effectiveCourseId,
      durationMinutes: Number.parseInt(durationMinutes, 10) || 15,
      maxAttempts: Number.parseInt(maxAttempts, 10) || 1,
      passingScore: Number.parseInt(passingScore, 10) || 60,
      questions: questions
        .filter((q) => q.text.trim())
        .map((q, i) => {
          const letterIdx = LETTERS.indexOf(q.correctAnswer as (typeof LETTERS)[number]);
          const correct =
            letterIdx >= 0 && q.options[letterIdx]?.trim()
              ? q.options[letterIdx].trim()
              : q.correctAnswer;
          return {
            text: q.text.trim(),
            options: q.options.filter(Boolean),
            correctAnswer: correct,
            order: i,
          };
        }),
    };
    if (payload.questions.length < 1) {
      setActionError("Add at least one question");
      return;
    }
    try {
      await createExam.mutateAsync(payload);
      setModal(null);
      resetForm();
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to create exam");
    }
  };

  const resultSummary = useMemo(() => {
    if (!results.length) return null;
    const avg = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
    const passed = results.filter((r) => r.passed).length;
    return { avg, passed, total: results.length };
  }, [results]);

  const otherAssignments = useMemo(
    () => courseAssignments.filter((a) => String(a.type).toUpperCase() !== "MCQ"),
    [courseAssignments]
  );

  function typeBadgeClass(type: string) {
    const t = type.toUpperCase();
    if (t === "MCQ") return "bg-primary-muted text-primary";
    if (t === "WRITTEN") return "bg-[#fff7ed] text-[#ea580c]";
    return "bg-muted text-muted-foreground";
  }

  if (isLoading && exams.length === 0 && courses.length > 0) {
    return <PageLoader label="Loading MCQ exams..." />;
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="MCQ Exams"
              description="Timed exams with start-on-click timer, auto marking, pass score, and retakes."
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
              <Button
                type="button"
                size="sm"
                disabled={!effectiveCourseId}
                onClick={() => {
                  resetForm();
                  setModal("create");
                }}
              >
                <Plus className="h-4 w-4" />
                New exam
              </Button>
            </div>
          </div>
          <label className="block max-w-md space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Course
            </span>
            <select
              value={effectiveCourseId ?? ""}
              onChange={(e) => setCourseId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          {error ? (
            <p className="mt-2 text-sm text-accent">{(error as unknown as ApiError)?.message}</p>
          ) : null}
          <p className="mt-3 text-sm text-muted-foreground">
            Written and file assignments are created via{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /assignments</code> with type{" "}
            <strong>WRITTEN</strong> or <strong>FILE</strong>. Grade them in the{" "}
            <Link href={ROUTES.admin.gradingQueue} className="font-semibold text-primary hover:underline">
              grading queue
            </Link>
            .
          </p>
        </div>

        {otherAssignments.length > 0 ? (
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Other assessments
            </h3>
            <div className="mt-3 space-y-2">
              {otherAssignments.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3">
                  <div>
                    <p className="font-semibold text-foreground">{a.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{a.description}</p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", typeBadgeClass(String(a.type)))}>
                    {String(a.type)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="divide-y divide-border">
          {exams.length === 0 ? (
            <p className="px-5 py-10 text-center text-muted-foreground">No MCQ exams for this course.</p>
          ) : null}
          {exams.map((exam) => (
            <div key={exam.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <h3 className="font-semibold text-foreground">{exam.title}</h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", typeBadgeClass("MCQ"))}>
                    MCQ
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{exam.description}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
                    <Clock className="h-3 w-3" />
                    {exam.durationMinutes} min
                  </span>
                  <span className="rounded-md bg-muted px-2 py-0.5">
                    {exam.questions?.length ?? exam._count?.questions ?? 0} questions
                  </span>
                  <span className="rounded-md bg-muted px-2 py-0.5">
                    {exam.maxAttempts ?? 1} attempt{(exam.maxAttempts ?? 1) > 1 ? "s" : ""}
                  </span>
                  {exam.passingScore != null ? (
                    <span className="rounded-md bg-primary-muted px-2 py-0.5 text-primary">
                      Pass {exam.passingScore}%
                    </span>
                  ) : null}
                  <span className="rounded-md bg-muted px-2 py-0.5">
                    {exam._count?.mcqAttempts ?? 0} attempts taken
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setResultsId(exam.id)}>
                  <Users className="h-4 w-4" />
                  Results
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-accent"
                  onClick={() => {
                    if (window.confirm(`Delete "${exam.title}"?`)) {
                      void deleteExam.mutateAsync(exam.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AdminModal
        open={modal === "create"}
        title="Create MCQ exam"
        description="Timer starts when student clicks Start. Marks calculated on submit."
        onClose={() => !busy && setModal(null)}
        className="sm:max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onSave()}>
              {busy ? "Saving..." : "Create exam"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input placeholder="Exam title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Duration (min)</span>
              <Input value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Max attempts</span>
              <Input value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Pass %</span>
              <Input value={passingScore} onChange={(e) => setPassingScore(e.target.value)} />
            </label>
          </div>
          {questions.map((q, qi) => (
            <div key={qi} className="rounded-xl border border-border p-3">
              <Input
                placeholder={`Question ${qi + 1}`}
                value={q.text}
                onChange={(e) => {
                  const next = [...questions];
                  next[qi] = { ...next[qi], text: e.target.value };
                  setQuestions(next);
                }}
                className="mb-2"
              />
              {LETTERS.map((letter, oi) => (
                <Input
                  key={letter}
                  placeholder={`Option ${letter}`}
                  value={q.options[oi] ?? ""}
                  onChange={(e) => {
                    const next = [...questions];
                    const opts = [...next[qi].options];
                    opts[oi] = e.target.value;
                    next[qi] = { ...next[qi], options: opts };
                    setQuestions(next);
                  }}
                  className="mb-1"
                />
              ))}
              <select
                value={q.correctAnswer}
                onChange={(e) => {
                  const next = [...questions];
                  next[qi] = { ...next[qi], correctAnswer: e.target.value };
                  setQuestions(next);
                }}
                className="mt-1 flex h-9 w-full rounded-lg border border-border px-2 text-sm"
              >
                {LETTERS.map((l) => (
                  <option key={l} value={l}>
                    Correct: {l}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
          >
            Add question
          </Button>
          {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}
        </div>
      </AdminModal>

      <AdminModal
        open={Boolean(resultsId)}
        title="Exam results"
        description={resultSummary ? `Avg ${resultSummary.avg}% · ${resultSummary.passed}/${resultSummary.total} passed` : undefined}
        onClose={() => setResultsId(null)}
        className="sm:max-w-3xl"
        footer={
          <Button type="button" variant="outline" onClick={() => setResultsId(null)}>
            Close
          </Button>
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
