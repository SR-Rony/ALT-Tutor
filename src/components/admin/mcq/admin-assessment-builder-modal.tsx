"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateAssignment,
  useCreateMcqExam,
  useUpdateAssignment,
  useUpdateMcqExam,
} from "@/hooks";
import { mcqService } from "@/services/mcq.service";
import type { ApiError } from "@/types";
import type { CreateMcqExamInput, ResultReleaseMode } from "@/types/mcq.types";
import type { StudentAssignment } from "@/types/student-dashboard.types";
import { cn } from "@/utils";

const LETTERS = ["A", "B", "C", "D"] as const;
const STEPS = ["Basics", "Scope", "Questions", "Schedule", "Preview", "Publish"] as const;

type AssessmentType = "MCQ" | "WRITTEN" | "FILE";
type ScopeKind = "course" | "program";
type DraftStatus = "DRAFT" | "PUBLISHED";

type CourseOption = { id: string; title: string };
type ProgramOption = { id: string; name: string; label: string };

type QuestionDraft = {
  text: string;
  options: string[];
  correctAnswer: string;
};

function emptyQuestion(): QuestionDraft {
  return { text: "", options: ["", "", "", ""], correctAnswer: "A" };
}

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoOrUndefined(value: string) {
  if (!value.trim()) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
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

export type AdminAssessmentBuilderModalProps = {
  open: boolean;
  onClose: () => void;
  courses: CourseOption[];
  programs: ProgramOption[];
  editItem?: StudentAssignment | null;
  defaultCourseId?: string;
  defaultProgramId?: string;
};

export function AdminAssessmentBuilderModal({
  open,
  onClose,
  courses,
  programs,
  editItem,
  defaultCourseId,
  defaultProgramId,
}: AdminAssessmentBuilderModalProps) {
  const createExam = useCreateMcqExam();
  const updateExam = useUpdateMcqExam();
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [type, setType] = useState<AssessmentType>("MCQ");
  const [scopeKind, setScopeKind] = useState<ScopeKind>("course");
  const [courseId, setCourseId] = useState("");
  const [programId, setProgramId] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion(), emptyQuestion()]);
  const [totalMarks, setTotalMarks] = useState("100");
  const [durationMinutes, setDurationMinutes] = useState("15");
  const [maxAttempts, setMaxAttempts] = useState("2");
  const [passingScore, setPassingScore] = useState("60");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [resultReleaseMode, setResultReleaseMode] = useState<ResultReleaseMode>("IMMEDIATE");
  const [publishStatus, setPublishStatus] = useState<DraftStatus>("DRAFT");
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isEdit = Boolean(editItem?.id);
  const busy =
    createExam.isPending ||
    updateExam.isPending ||
    createAssignment.isPending ||
    updateAssignment.isPending ||
    loadingEdit;

  const reset = () => {
    setStep(0);
    setTitle("");
    setDescription("");
    setInstructions("");
    setType("MCQ");
    setScopeKind(defaultProgramId && !defaultCourseId ? "program" : "course");
    setCourseId(defaultCourseId || courses[0]?.id || "");
    setProgramId(defaultProgramId || programs[0]?.id || "");
    setQuestions([emptyQuestion(), emptyQuestion()]);
    setTotalMarks("100");
    setDurationMinutes("15");
    setMaxAttempts("2");
    setPassingScore("60");
    setAvailableFrom("");
    setAvailableUntil("");
    setDueDate("");
    setResultReleaseMode("IMMEDIATE");
    setPublishStatus("DRAFT");
    setActionError(null);
  };

  useEffect(() => {
    if (!open) return;
    if (!editItem) {
      reset();
      return;
    }

    let cancelled = false;
    const hydrate = async () => {
      setLoadingEdit(true);
      setActionError(null);
      setStep(0);
      setTitle(editItem.title ?? "");
      setDescription(editItem.description ?? "");
      setInstructions(editItem.instructions ?? "");
      const t = String(editItem.type ?? "MCQ").toUpperCase() as AssessmentType;
      setType(t === "WRITTEN" || t === "FILE" ? t : "MCQ");
      setScopeKind(editItem.programId ? "program" : "course");
      setCourseId(editItem.courseId ?? "");
      setProgramId(editItem.programId ?? "");
      setTotalMarks(String(editItem.totalMarks ?? 100));
      setDurationMinutes(String(editItem.durationMinutes ?? 15));
      setMaxAttempts(String(editItem.maxAttempts ?? 2));
      setPassingScore(String(editItem.passingScore ?? 60));
      setAvailableFrom(toLocalInput(editItem.availableFrom));
      setAvailableUntil(toLocalInput(editItem.availableUntil));
      setDueDate(toLocalInput(editItem.dueDate));
      setResultReleaseMode(
        (editItem.resultReleaseMode as ResultReleaseMode) || "IMMEDIATE"
      );
      setPublishStatus(
        String(editItem.status ?? "DRAFT").toUpperCase() === "PUBLISHED" ? "PUBLISHED" : "DRAFT"
      );

      if (String(editItem.type).toUpperCase() === "MCQ") {
        try {
          const detail = await mcqService.adminGet(editItem.id);
          if (cancelled) return;
          setQuestions(
            (detail.questions ?? []).length
              ? (detail.questions ?? []).map((q) => {
                  const idx = q.options.findIndex((o) => o === q.correctAnswer);
                  return {
                    text: q.text,
                    options: [...q.options, "", "", "", ""].slice(0, 4),
                    correctAnswer: idx >= 0 ? LETTERS[idx] : "A",
                  };
                })
              : [emptyQuestion()]
          );
          setDurationMinutes(String(detail.durationMinutes ?? 15));
          setMaxAttempts(String(detail.maxAttempts ?? 2));
          setPassingScore(String(detail.passingScore ?? 60));
          if (detail.resultReleaseMode) setResultReleaseMode(detail.resultReleaseMode);
        } catch (err) {
          if (!cancelled) {
            setActionError((err as ApiError)?.message || "Failed to load exam questions");
          }
        }
      } else {
        setQuestions([emptyQuestion(), emptyQuestion()]);
      }
      if (!cancelled) setLoadingEdit(false);
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset intentionally omitted
  }, [open, editItem?.id]);

  const mappedQuestions = useMemo(() => mapQuestions(questions), [questions]);

  const stepError = (index: number): string | null => {
    if (index === 0) {
      if (!title.trim()) return "Title is required";
      if (!description.trim()) return "Description is required";
      return null;
    }
    if (index === 1) {
      if (scopeKind === "course" && !courseId) return "Select a course";
      if (scopeKind === "program" && !programId) return "Select a subject program";
      return null;
    }
    if (index === 2) {
      if (type === "MCQ") {
        if (mappedQuestions.length < 1) return "Add at least one question";
        if (mappedQuestions.some((q) => q.options.length < 2)) {
          return "Each question needs at least two options";
        }
      }
      return null;
    }
    if (index === 3) {
      const from = toIsoOrUndefined(availableFrom);
      const until = toIsoOrUndefined(availableUntil);
      if (from && until && new Date(until).getTime() < new Date(from).getTime()) {
        return "Available until must be after available from";
      }
      if (type === "MCQ") {
        const duration = Number.parseInt(durationMinutes, 10);
        if (!duration || duration < 1) return "Duration must be at least 1 minute";
      }
      return null;
    }
    if (index === 5 && publishStatus === "PUBLISHED") {
      if (scopeKind === "course" && !courseId) return "Course scope is required to publish";
      if (scopeKind === "program" && !programId) return "Program scope is required to publish";
      if (type === "MCQ") {
        if (mappedQuestions.length < 1) return "Published MCQ needs at least one question";
        const duration = Number.parseInt(durationMinutes, 10);
        if (!duration || duration < 1) return "Published MCQ needs a valid duration";
      }
      return null;
    }
    return null;
  };

  const goNext = () => {
    const err = stepError(step);
    if (err) {
      setActionError(err);
      return;
    }
    setActionError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setActionError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const onSave = async () => {
    const err = stepError(5) || stepError(0) || stepError(1) || stepError(2) || stepError(3);
    if (err) {
      setActionError(err);
      return;
    }
    setActionError(null);

    const from = toIsoOrUndefined(availableFrom);
    const until = toIsoOrUndefined(availableUntil);
    const due = toIsoOrUndefined(dueDate);
    const scope =
      scopeKind === "course" ? { courseId } : { programId };

    try {
      if (type === "MCQ") {
        const payload: CreateMcqExamInput = {
          title: title.trim(),
          description: description.trim(),
          ...scope,
          status: publishStatus,
          durationMinutes: Number.parseInt(durationMinutes, 10) || 15,
          maxAttempts: Number.parseInt(maxAttempts, 10) || 1,
          passingScore: Number.parseInt(passingScore, 10) || 60,
          availableFrom: from,
          availableUntil: until,
          dueDate: due,
          resultReleaseMode,
          questions: mappedQuestions,
        };
        if (isEdit && editItem) {
          const { courseId: _c, programId: _p, ...rest } = payload;
          await updateExam.mutateAsync({ id: editItem.id, payload: rest });
        } else {
          await createExam.mutateAsync(payload);
        }
      } else {
        const payload = {
          title: title.trim(),
          description: description.trim(),
          instructions: instructions.trim() || undefined,
          type,
          status: publishStatus,
          ...scope,
          totalMarks: Number.parseInt(totalMarks, 10) || undefined,
          availableFrom: from,
          availableUntil: until,
          dueDate: due,
          resultReleaseMode,
        };
        if (isEdit && editItem) {
          const { courseId: _c, programId: _p, type: _t, ...rest } = payload;
          await updateAssignment.mutateAsync({ id: editItem.id, payload: rest });
        } else {
          await createAssignment.mutateAsync(payload);
        }
      }
      onClose();
      reset();
    } catch (e) {
      setActionError((e as ApiError)?.message || "Failed to save assessment");
    }
  };

  const scopeLabel =
    scopeKind === "course"
      ? courses.find((c) => c.id === courseId)?.title ?? "—"
      : programs.find((p) => p.id === programId)?.label ?? "—";

  return (
    <AdminModal
      open={open}
      title={isEdit ? "Edit assessment" : "New assessment"}
      description="Basics → Scope → Questions → Schedule → Preview → Publish"
      onClose={() => !busy && onClose()}
      className="sm:max-w-3xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="outline" disabled={busy || step === 0} onClick={goBack}>
            Back
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={() => !busy && onClose()}>
              Cancel
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" disabled={busy || loadingEdit} onClick={goNext}>
                Next
              </Button>
            ) : (
              <Button type="button" disabled={busy || loadingEdit} onClick={() => void onSave()}>
                {busy ? "Saving..." : publishStatus === "PUBLISHED" ? "Publish" : "Save draft"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap gap-1">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            disabled={busy}
            onClick={() => {
              if (i > step) {
                const err = stepError(step);
                if (err) {
                  setActionError(err);
                  return;
                }
              }
              setActionError(null);
              setStep(i);
            }}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
              i === step
                ? "bg-primary text-primary-foreground"
                : i < step
                  ? "bg-primary-muted text-primary"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {loadingEdit ? <p className="text-sm text-muted-foreground">Loading assessment…</p> : null}

      {step === 0 ? (
        <div className="space-y-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy} />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            disabled={busy}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm"
          />
          {type !== "MCQ" ? (
            <textarea
              placeholder="Instructions (optional)"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              disabled={busy}
              className="w-full rounded-xl border border-border px-3 py-2 text-sm"
            />
          ) : null}
          <label className="block space-y-1 text-sm">
            <span className="font-semibold">Type</span>
            <select
              value={type}
              disabled={busy || isEdit}
              onChange={(e) => setType(e.target.value as AssessmentType)}
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              <option value="MCQ">MCQ exam</option>
              <option value="WRITTEN">Written</option>
              <option value="FILE">File upload</option>
            </select>
          </label>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={scopeKind === "course" ? "default" : "outline"}
              disabled={busy || isEdit}
              onClick={() => setScopeKind("course")}
            >
              Course
            </Button>
            <Button
              type="button"
              size="sm"
              variant={scopeKind === "program" ? "default" : "outline"}
              disabled={busy || isEdit}
              onClick={() => setScopeKind("program")}
            >
              Subject program
            </Button>
          </div>
          {scopeKind === "course" ? (
            <select
              value={courseId}
              disabled={busy || isEdit}
              onChange={(e) => setCourseId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={programId}
              disabled={busy || isEdit}
              onChange={(e) => setProgramId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              <option value="">Select program…</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          )}
          <p className="text-xs text-muted-foreground">
            Exactly one scope is required. Scope cannot be changed after create.
          </p>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          {type === "MCQ" ? (
            <>
              {questions.map((q, qi) => (
                <div key={qi} className="rounded-xl border border-border p-3">
                  <Input
                    placeholder={`Question ${qi + 1}`}
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
              <p className="text-xs text-muted-foreground">
                Questionbank snapshot import arrives in Phase 9 — custom questions only for now.
              </p>
            </>
          ) : (
            <label className="block space-y-1 text-sm">
              <span className="font-semibold">Total marks</span>
              <Input value={totalMarks} disabled={busy} onChange={(e) => setTotalMarks(e.target.value)} />
            </label>
          )}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {type === "MCQ" ? (
            <>
              <label className="space-y-1 text-sm">
                <span className="font-semibold">Duration (min)</span>
                <Input value={durationMinutes} disabled={busy} onChange={(e) => setDurationMinutes(e.target.value)} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-semibold">Max attempts</span>
                <Input value={maxAttempts} disabled={busy} onChange={(e) => setMaxAttempts(e.target.value)} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-semibold">Pass %</span>
                <Input value={passingScore} disabled={busy} onChange={(e) => setPassingScore(e.target.value)} />
              </label>
            </>
          ) : null}
          <label className="space-y-1 text-sm">
            <span className="font-semibold">Result release</span>
            <select
              value={resultReleaseMode}
              disabled={busy}
              onChange={(e) => setResultReleaseMode(e.target.value as ResultReleaseMode)}
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              <option value="IMMEDIATE">Immediate</option>
              <option value="AFTER_CLOSE">After close</option>
              <option value="MANUAL">Manual</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-semibold">Available from</span>
            <Input
              type="datetime-local"
              value={availableFrom}
              disabled={busy}
              onChange={(e) => setAvailableFrom(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-semibold">Available until</span>
            <Input
              type="datetime-local"
              value={availableUntil}
              disabled={busy}
              onChange={(e) => setAvailableUntil(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-semibold">Due date</span>
            <Input type="datetime-local" value={dueDate} disabled={busy} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm">
          <p>
            <span className="font-semibold">Title:</span> {title || "—"}
          </p>
          <p>
            <span className="font-semibold">Type:</span> {type}
          </p>
          <p>
            <span className="font-semibold">Scope:</span> {scopeKind} · {scopeLabel}
          </p>
          {type === "MCQ" ? (
            <p>
              <span className="font-semibold">Questions:</span> {mappedQuestions.length} ·{" "}
              {durationMinutes} min · {maxAttempts} attempts · pass {passingScore}%
            </p>
          ) : (
            <p>
              <span className="font-semibold">Marks:</span> {totalMarks || "—"}
            </p>
          )}
          <p>
            <span className="font-semibold">Window:</span>{" "}
            {availableFrom ? new Date(availableFrom).toLocaleString() : "open"} →{" "}
            {availableUntil ? new Date(availableUntil).toLocaleString() : "open"}
          </p>
          <p>
            <span className="font-semibold">Due:</span>{" "}
            {dueDate ? new Date(dueDate).toLocaleString() : "—"}
          </p>
          <p>
            <span className="font-semibold">Results:</span> {resultReleaseMode}
          </p>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={publishStatus === "DRAFT" ? "default" : "outline"}
              disabled={busy}
              onClick={() => setPublishStatus("DRAFT")}
            >
              Save as draft
            </Button>
            <Button
              type="button"
              size="sm"
              variant={publishStatus === "PUBLISHED" ? "default" : "outline"}
              disabled={busy}
              onClick={() => setPublishStatus("PUBLISHED")}
            >
              Publish now
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Publish runs the same readiness checks as the API (scope, MCQ questions + duration, schedule
            order).
          </p>
        </div>
      ) : null}

      {actionError ? <p className="mt-3 text-sm text-accent">{actionError}</p> : null}
    </AdminModal>
  );
}
