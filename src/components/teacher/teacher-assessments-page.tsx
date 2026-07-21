"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Clock, Download, Pencil, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ROUTES } from "@/constants";
import {
  useAdminMcqExams,
  useAdminMcqResults,
  useCourseAssignments,
  useCreateAssignment,
  useCreateMcqExam,
  useDeleteAssignment,
  useDeleteMcqExam,
  useTeacherCourses,
  useUpdateAssignment,
  useUpdateMcqExam,
} from "@/hooks";
import { downloadCsv } from "@/lib/export-csv";
import { formatShortDate } from "@/lib/format";
import { isRichTextEmpty, richTextToPlain, serializeRichText } from "@/lib/rich-text";
import { mcqService } from "@/services/mcq.service";
import type { ApiError } from "@/types";
import type { CreateMcqExamInput, McqExam } from "@/types/mcq.types";
import type { StudentAssignment } from "@/types/student-dashboard.types";
import { cn } from "@/utils";

const LETTERS = ["A", "B", "C", "D"] as const;
const MCQ_STEPS = ["Basics", "Questions", "Publish"] as const;

type KindFilter = "all" | "mcq" | "written";
type DraftStatus = "DRAFT" | "PUBLISHED";
type QuestionDraft = { text: string; options: string[]; correctAnswer: string };

function emptyQuestion(): QuestionDraft {
  return { text: "", options: ["", "", "", ""], correctAnswer: "A" };
}

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
  return "bg-[#fff7ed] text-[#c2410c]";
}

function mapQuestions(questions: QuestionDraft[]) {
  return questions
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
    });
}

export function TeacherAssessmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: courseData, isLoading: coursesLoading } = useTeacherCourses();
  const courses = courseData?.all ?? [];
  const [courseId, setCourseId] = useState("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const effectiveCourseId = courseId || courses[0]?.id;

  useEffect(() => {
    const fromQuery = searchParams.get("courseId");
    if (!fromQuery || !courses.length) return;
    if (courses.some((c) => c.id === fromQuery)) {
      setCourseId(fromQuery);
    }
  }, [courses, searchParams]);

  const setCourseAndUrl = (id: string) => {
    setCourseId(id);
    router.replace(`${ROUTES.teacher.assessments}?courseId=${id}`);
  };

  const { data: exams = [], isLoading, error, refetch, isFetching } = useAdminMcqExams(effectiveCourseId);
  const { data: courseAssignments = [], refetch: refetchAssignments } =
    useCourseAssignments(effectiveCourseId);
  const createExam = useCreateMcqExam();
  const updateExam = useUpdateMcqExam();
  const deleteExam = useDeleteMcqExam();
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();

  const [modal, setModal] = useState<"mcq" | "written" | null>(null);
  const [editMcq, setEditMcq] = useState<McqExam | null>(null);
  const [editWritten, setEditWritten] = useState<StudentAssignment | null>(null);
  const [mcqStep, setMcqStep] = useState(0);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [resultsId, setResultsId] = useState<string | null>(null);
  const { data: results = [] } = useAdminMcqResults(resultsId ?? undefined);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("15");
  const [maxAttempts, setMaxAttempts] = useState("2");
  const [passingScore, setPassingScore] = useState("60");
  const [mcqStatus, setMcqStatus] = useState<DraftStatus>("PUBLISHED");
  const [totalMarks, setTotalMarks] = useState("100");
  const [dueDate, setDueDate] = useState("");
  const [writtenType, setWrittenType] = useState<"WRITTEN" | "FILE">("WRITTEN");
  const [writtenStatus, setWrittenStatus] = useState<DraftStatus>("PUBLISHED");
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion(), emptyQuestion()]);
  const [actionError, setActionError] = useState<string | null>(null);

  const busy =
    createExam.isPending ||
    updateExam.isPending ||
    deleteExam.isPending ||
    createAssignment.isPending ||
    updateAssignment.isPending ||
    deleteAssignment.isPending ||
    loadingEdit;

  const mappedQuestions = useMemo(() => mapQuestions(questions), [questions]);

  const resetMcqForm = () => {
    setMcqStep(0);
    setEditMcq(null);
    setTitle("");
    setDescription("");
    setDurationMinutes("15");
    setMaxAttempts("2");
    setPassingScore("60");
    setMcqStatus("PUBLISHED");
    setQuestions([emptyQuestion(), emptyQuestion()]);
    setActionError(null);
  };

  const resetWrittenForm = (item?: StudentAssignment | null) => {
    setTitle(item?.title ?? "");
    setDescription(item?.description ?? "");
    setInstructions(item?.instructions ?? "");
    setTotalMarks(item?.totalMarks != null ? String(item.totalMarks) : "100");
    setDueDate(item?.dueDate ? item.dueDate.slice(0, 10) : "");
    setWrittenType(
      String(item?.type ?? "WRITTEN").toUpperCase() === "FILE" ? "FILE" : "WRITTEN"
    );
    setWrittenStatus(
      String(item?.status ?? "PUBLISHED").toUpperCase() === "DRAFT" ? "DRAFT" : "PUBLISHED"
    );
  };

  const openMcqCreate = () => {
    resetMcqForm();
    setModal("mcq");
  };

  const openMcqEdit = async (examId: string) => {
    setActionError(null);
    setLoadingEdit(true);
    setModal("mcq");
    setMcqStep(0);
    try {
      const detail = await mcqService.adminGet(examId);
      setEditMcq(detail);
      setTitle(detail.title ?? "");
      setDescription(detail.description ?? "");
      setDurationMinutes(String(detail.durationMinutes ?? 15));
      setMaxAttempts(String(detail.maxAttempts ?? 2));
      setPassingScore(String(detail.passingScore ?? 60));
      setMcqStatus(
        String(detail.status ?? "PUBLISHED").toUpperCase() === "DRAFT" ? "DRAFT" : "PUBLISHED"
      );
      const custom = (detail.questions ?? []).filter((q) => !q.sourceQuestionId);
      setQuestions(
        custom.length
          ? custom.map((q) => {
              const idx = q.options.findIndex((o) => o === q.correctAnswer);
              return {
                text: q.text,
                options: [...q.options, "", "", "", ""].slice(0, 4),
                correctAnswer: idx >= 0 ? LETTERS[idx] : "A",
              };
            })
          : [emptyQuestion()]
      );
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to load exam");
      setModal(null);
    } finally {
      setLoadingEdit(false);
    }
  };

  const mcqStepError = (index: number): string | null => {
    if (index === 0) {
      if (!title.trim()) return "Title is required";
      if (isRichTextEmpty(description)) return "Description is required";
      const duration = Number.parseInt(durationMinutes, 10);
      if (!duration || duration < 1) return "Duration must be at least 1 minute";
      return null;
    }
    if (index === 1) {
      if (mappedQuestions.length < 1) return "Add at least one question";
      if (mappedQuestions.some((q) => q.options.length < 2)) {
        return "Each question needs at least two options";
      }
      return null;
    }
    return null;
  };

  const goMcqNext = () => {
    const err = mcqStepError(mcqStep);
    if (err) {
      setActionError(err);
      return;
    }
    setActionError(null);
    setMcqStep((s) => Math.min(s + 1, MCQ_STEPS.length - 1));
  };

  const onSaveMcq = async () => {
    if (!effectiveCourseId) return;
    const blocked = mcqStepError(0) || mcqStepError(1);
    if (blocked) {
      setActionError(blocked);
      return;
    }
    setActionError(null);
    const payload: CreateMcqExamInput = {
      title: title.trim(),
      description: serializeRichText(description),
      courseId: effectiveCourseId,
      status: mcqStatus,
      durationMinutes: Number.parseInt(durationMinutes, 10) || 15,
      maxAttempts: Number.parseInt(maxAttempts, 10) || 1,
      passingScore: Number.parseInt(passingScore, 10) || 60,
      questions: mappedQuestions,
    };
    try {
      if (editMcq?.id) {
        const { courseId: _c, ...rest } = payload;
        await updateExam.mutateAsync({ id: editMcq.id, payload: rest });
      } else {
        await createExam.mutateAsync(payload);
      }
      setModal(null);
      resetMcqForm();
      void refetch();
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save exam");
    }
  };

  const onSaveWritten = async () => {
    if (!effectiveCourseId) return;
    setActionError(null);
    if (!title.trim() || isRichTextEmpty(description)) {
      setActionError("Title and description are required");
      return;
    }
    const marks = Number.parseInt(totalMarks, 10);
    if (!marks || marks < 1) {
      setActionError("Total marks must be at least 1");
      return;
    }
    try {
      if (editWritten) {
        await updateAssignment.mutateAsync({
          id: editWritten.id,
          payload: {
            title: title.trim(),
            description: serializeRichText(description),
            instructions: serializeRichText(instructions) || undefined,
            status: writtenStatus,
            totalMarks: marks,
            dueDate: dueDate ? new Date(`${dueDate}T23:59:59.000Z`).toISOString() : undefined,
          },
        });
      } else {
        await createAssignment.mutateAsync({
          title: title.trim(),
          description: serializeRichText(description),
          instructions: serializeRichText(instructions) || undefined,
          type: writtenType,
          status: writtenStatus,
          courseId: effectiveCourseId,
          totalMarks: marks,
          dueDate: dueDate ? new Date(`${dueDate}T23:59:59.000Z`).toISOString() : undefined,
        });
      }
      setModal(null);
      setEditWritten(null);
      void refetchAssignments();
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save assessment");
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

  const showMcq = kindFilter === "all" || kindFilter === "mcq";
  const showWritten = kindFilter === "all" || kindFilter === "written";

  const exportResults = () => {
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
    ]);
  };

  if (coursesLoading) return <PageLoader label="Loading your courses…" />;

  if (courses.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Assessments"
          description="Create MCQ and written assessments for courses you teach."
        />
        <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center text-sm text-muted-foreground">
          No managed courses yet. Create or request access from{" "}
          <Link href={ROUTES.teacher.courses} className="font-semibold text-primary hover:underline">
            My Courses
          </Link>
          .
        </div>
      </div>
    );
  }

  if (isLoading && exams.length === 0) {
    return <PageLoader label="Loading assessments…" />;
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="Assessments"
              description="Course-scoped MCQ and written exams. Use the short wizard to create, then grade in Grading."
              className="mb-0"
            />
            <div className="flex flex-wrap gap-2">
              <AdminIconAction
                label="Refresh"
                icon={RefreshCw}
                tone="primary"
                disabled={isFetching}
                onClick={() => {
                  void refetch();
                  void refetchAssignments();
                }}
                className={isFetching ? "animate-spin" : undefined}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!effectiveCourseId}
                onClick={() => {
                  resetWrittenForm();
                  setEditWritten(null);
                  setActionError(null);
                  setModal("written");
                }}
              >
                <Plus className="h-4 w-4" />
                Written / file
              </Button>
              <Button type="button" size="sm" disabled={!effectiveCourseId} onClick={openMcqCreate}>
                <Plus className="h-4 w-4" />
                New MCQ
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="block min-w-[220px] flex-1 space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Course
              </span>
              <select
                value={effectiveCourseId ?? ""}
                onChange={(e) => setCourseAndUrl(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
              {(
                [
                  ["all", "All"],
                  ["mcq", "MCQ"],
                  ["written", "Written"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setKindFilter(key)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    kindFilter === key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="mt-2 text-sm text-accent">{(error as unknown as ApiError)?.message}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <Link
              href={ROUTES.teacher.gradingQueue}
              className="font-semibold text-primary hover:underline"
            >
              Open grading queue
            </Link>
            {effectiveCourseId ? (
              <Link
                href={`${ROUTES.teacher.gradebook}?courseId=${effectiveCourseId}`}
                className="font-semibold text-primary hover:underline"
              >
                Open gradebook for this course
              </Link>
            ) : null}
          </div>
        </div>

        {showWritten ? (
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Written &amp; file assessments
            </h3>
            {otherAssignments.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No written assessments yet.{" "}
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => {
                    resetWrittenForm();
                    setEditWritten(null);
                    setActionError(null);
                    setModal("written");
                  }}
                >
                  Create one
                </button>
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {otherAssignments.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{a.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {richTextToPlain(a.description)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 font-semibold",
                            statusBadgeClass(String(a.status ?? "PUBLISHED"))
                          )}
                        >
                          {String(a.status ?? "PUBLISHED")}
                        </span>
                        {a.dueDate ? <span>Due {formatShortDate(a.dueDate)}</span> : null}
                        {a.totalMarks != null ? <span>{a.totalMarks} marks</span> : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          typeBadgeClass(String(a.type))
                        )}
                      >
                        {String(a.type)}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditWritten(a);
                          resetWrittenForm(a);
                          setActionError(null);
                          setModal("written");
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-accent"
                        onClick={() => {
                          if (window.confirm(`Delete "${a.title}"?`)) {
                            void deleteAssignment.mutateAsync(a.id).then(() => refetchAssignments());
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {showMcq ? (
          <div className="divide-y divide-border">
            <div className="px-5 py-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                MCQ exams
              </h3>
            </div>
            {exams.length === 0 ? (
              <p className="px-5 py-10 text-center text-muted-foreground">
                No MCQ exams for this course.{" "}
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={openMcqCreate}
                >
                  Create MCQ
                </button>
              </p>
            ) : null}
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{exam.title}</h3>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase",
                        statusBadgeClass(String(exam.status ?? "PUBLISHED"))
                      )}
                    >
                      {String(exam.status ?? "PUBLISHED").toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {richTextToPlain(exam.description)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
                      <Clock className="h-3 w-3" />
                      {exam.durationMinutes} min
                    </span>
                    <span className="rounded-md bg-muted px-2 py-0.5">
                      {exam.questions?.length ?? exam._count?.questions ?? 0} questions
                    </span>
                    <span className="rounded-md bg-muted px-2 py-0.5">
                      {exam._count?.mcqAttempts ?? 0} attempts
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void openMcqEdit(exam.id)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
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
        ) : null}
      </div>

      <AdminModal
        open={modal === "mcq"}
        title={editMcq ? "Edit MCQ exam" : "New MCQ exam"}
        description="Short wizard for your course — Basics → Questions → Publish. No Questionbank picker (admin-only)."
        onClose={() => {
          if (!busy) {
            setModal(null);
            resetMcqForm();
          }
        }}
        className="sm:max-w-2xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy || mcqStep === 0}
              onClick={() => {
                setActionError(null);
                setMcqStep((s) => Math.max(0, s - 1));
              }}
            >
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setModal(null);
                  resetMcqForm();
                }}
              >
                Cancel
              </Button>
              {mcqStep < MCQ_STEPS.length - 1 ? (
                <Button type="button" disabled={busy} onClick={goMcqNext}>
                  Next
                </Button>
              ) : (
                <Button type="button" disabled={busy} onClick={() => void onSaveMcq()}>
                  {busy
                    ? "Saving..."
                    : mcqStatus === "PUBLISHED"
                      ? editMcq
                        ? "Save & publish"
                        : "Publish exam"
                      : editMcq
                        ? "Save draft"
                        : "Save draft"}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-1">
          {MCQ_STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              disabled={busy}
              onClick={() => {
                if (i > mcqStep) {
                  const err = mcqStepError(mcqStep);
                  if (err) {
                    setActionError(err);
                    return;
                  }
                }
                setActionError(null);
                setMcqStep(i);
              }}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                i === mcqStep
                  ? "bg-primary text-primary-foreground"
                  : i < mcqStep
                    ? "bg-primary-muted text-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>

        {loadingEdit ? <p className="text-sm text-muted-foreground">Loading exam…</p> : null}

        {mcqStep === 0 ? (
          <div className="space-y-3">
            <Input
              placeholder="Exam title"
              value={title}
              disabled={busy}
              onChange={(e) => setTitle(e.target.value)}
            />
            <RichTextEditor
              placeholder="Description"
              value={description}
              onChange={setDescription}
              disabled={busy}
              minHeight="100px"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="font-semibold">Duration (min)</span>
                <Input
                  value={durationMinutes}
                  disabled={busy}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-semibold">Max attempts</span>
                <Input
                  value={maxAttempts}
                  disabled={busy}
                  onChange={(e) => setMaxAttempts(e.target.value)}
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-semibold">Pass %</span>
                <Input
                  value={passingScore}
                  disabled={busy}
                  onChange={(e) => setPassingScore(e.target.value)}
                />
              </label>
            </div>
          </div>
        ) : null}

        {mcqStep === 1 ? (
          <div className="space-y-3">
            {questions.map((q, qi) => (
              <div key={qi} className="rounded-xl border border-border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Question {qi + 1}
                  </span>
                  {questions.length > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() => setQuestions((prev) => prev.filter((_, idx) => idx !== qi))}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                <Input
                  placeholder={`Question ${qi + 1} text`}
                  value={q.text}
                  disabled={busy}
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
                    disabled={busy}
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
                  disabled={busy}
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
              disabled={busy}
              onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
            >
              Add question
            </Button>
          </div>
        ) : null}

        {mcqStep === 2 ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <p>
                <span className="font-semibold">Title:</span> {title || "—"}
              </p>
              <p>
                <span className="font-semibold">Questions:</span> {mappedQuestions.length}
              </p>
              <p>
                <span className="font-semibold">Rules:</span> {durationMinutes} min · {maxAttempts}{" "}
                attempts · pass {passingScore}%
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={mcqStatus === "DRAFT" ? "default" : "outline"}
                disabled={busy}
                onClick={() => setMcqStatus("DRAFT")}
              >
                Save as draft
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mcqStatus === "PUBLISHED" ? "default" : "outline"}
                disabled={busy}
                onClick={() => setMcqStatus("PUBLISHED")}
              >
                Publish now
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {mcqStatus === "PUBLISHED"
                ? "Students in this course can attempt the exam once it is published."
                : "Draft stays hidden from students until you publish."}
            </p>
          </div>
        ) : null}

        {actionError ? <p className="mt-3 text-sm text-accent">{actionError}</p> : null}
      </AdminModal>

      <AdminModal
        open={modal === "written"}
        title={editWritten ? "Edit written assessment" : "Create written / file assessment"}
        description="Students submit text and/or files. Grade them under Grading."
        onClose={() => {
          if (!busy) {
            setModal(null);
            setEditWritten(null);
          }
        }}
        className="sm:max-w-xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setModal(null);
                setEditWritten(null);
              }}
            >
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onSaveWritten()}>
              {busy ? "Saving…" : editWritten ? "Save changes" : "Create"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <RichTextEditor
            placeholder="Description"
            value={description}
            onChange={setDescription}
            minHeight="100px"
          />
          <RichTextEditor
            placeholder="Instructions (optional)"
            value={instructions}
            onChange={setInstructions}
            minHeight="100px"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {!editWritten ? (
              <label className="space-y-1 text-sm">
                <span className="font-semibold">Type</span>
                <select
                  value={writtenType}
                  onChange={(e) => setWrittenType(e.target.value as "WRITTEN" | "FILE")}
                  className="flex h-10 w-full rounded-xl border border-border px-3 text-sm"
                >
                  <option value="WRITTEN">Written</option>
                  <option value="FILE">File</option>
                </select>
              </label>
            ) : null}
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Status</span>
              <select
                value={writtenStatus}
                onChange={(e) => setWrittenStatus(e.target.value as DraftStatus)}
                className="flex h-10 w-full rounded-xl border border-border px-3 text-sm"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Total marks</span>
              <Input value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-semibold">Due date</span>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
          </div>
          {actionError ? <p className="text-sm text-accent">{actionError}</p> : null}
        </div>
      </AdminModal>

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
            <Button type="button" variant="outline" disabled={!results.length} onClick={exportResults}>
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
