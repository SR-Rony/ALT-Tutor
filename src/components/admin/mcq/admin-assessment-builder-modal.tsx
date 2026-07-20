"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  useAdminQuestionbank,
  useCourseProgramLinks,
  useCreateAssignment,
  useCreateMcqExam,
  useUpdateAssignment,
  useUpdateMcqExam,
} from "@/hooks";
import { isRichTextEmpty, serializeRichText } from "@/lib/rich-text";
import { mcqService } from "@/services/mcq.service";
import type { ApiError } from "@/types";
import type { CreateMcqExamInput, ResultReleaseMode } from "@/types/mcq.types";
import type { QbQuestion } from "@/types/qb.types";
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
  const [selectedQbIds, setSelectedQbIds] = useState<string[]>([]);
  const [qbBrowseProgramId, setQbBrowseProgramId] = useState("");
  const [qbTopicId, setQbTopicId] = useState("");
  const [qbSubtopicId, setQbSubtopicId] = useState("");
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

  const { data: courseProgramLinks = [] } = useCourseProgramLinks(
    scopeKind === "course" && courseId ? courseId : ""
  );

  const linkedPrograms = useMemo(
    () =>
      courseProgramLinks.map((l) => ({
        id: l.program.id,
        name: l.program.name,
        label: l.program.subject ? `${l.program.subject.name} / ${l.program.name}` : l.program.name,
      })),
    [courseProgramLinks]
  );

  const effectiveQbProgramId =
    scopeKind === "program"
      ? programId
      : qbBrowseProgramId || linkedPrograms[0]?.id || "";

  const { data: qbTopics = [], isLoading: qbLoading } = useAdminQuestionbank(
    type === "MCQ" && step === 2 && effectiveQbProgramId ? effectiveQbProgramId : undefined
  );

  const qbTopicsSafe = qbTopics ?? [];
  const activeTopicId = qbTopicId || qbTopicsSafe[0]?.id || "";
  const activeTopic = qbTopicsSafe.find((t) => t.id === activeTopicId);
  const subtopics = activeTopic?.subtopics ?? [];
  const activeSubtopicId = qbSubtopicId || subtopics[0]?.id || "";
  const activeSubtopic = subtopics.find((s) => s.id === activeSubtopicId);
  const pickerQuestions = useMemo(
    () =>
      (activeSubtopic?.questions ?? []).filter(
        (q) =>
          q.isActive &&
          String(q.questionType).toUpperCase() === "MULTIPLE_CHOICE" &&
          (q.options?.length ?? 0) >= 2
      ),
    [activeSubtopic]
  );

  const selectedQbPreview = useMemo(() => {
    const all: QbQuestion[] = [];
    for (const topic of qbTopicsSafe) {
      for (const st of topic.subtopics ?? []) {
        for (const q of st.questions ?? []) {
          if (selectedQbIds.includes(q.id)) all.push(q);
        }
      }
    }
    return selectedQbIds
      .map((id) => all.find((q) => q.id === id))
      .filter(Boolean) as QbQuestion[];
  }, [qbTopicsSafe, selectedQbIds]);

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
    setSelectedQbIds([]);
    setQbBrowseProgramId("");
    setQbTopicId("");
    setQbSubtopicId("");
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
          const customOnly = (detail.questions ?? []).filter((q) => !q.sourceQuestionId);
          setQuestions(
            customOnly.length
              ? customOnly.map((q) => {
                  const idx = q.options.findIndex((o) => o === q.correctAnswer);
                  return {
                    text: q.text,
                    options: [...q.options, "", "", "", ""].slice(0, 4),
                    correctAnswer: idx >= 0 ? LETTERS[idx] : "A",
                  };
                })
              : [emptyQuestion()]
          );
          setSelectedQbIds(detail.selectedQuestionbankIds ?? []);
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
        setSelectedQbIds([]);
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
      if (isRichTextEmpty(description)) return "Description is required";
      return null;
    }
    if (index === 1) {
      if (scopeKind === "course" && !courseId) return "Select a course";
      if (scopeKind === "program" && !programId) return "Select a subject program";
      return null;
    }
    if (index === 2) {
      if (type === "MCQ") {
        const total = mappedQuestions.length + selectedQbIds.length;
        if (total < 1) return "Add custom questions or select from questionbank";
        if (mappedQuestions.some((q) => q.options.length < 2)) {
          return "Each custom question needs at least two options";
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
        if (mappedQuestions.length + selectedQbIds.length < 1) {
          return "Published MCQ needs at least one question";
        }
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
          description: serializeRichText(description),
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
          questionbankQuestionIds: selectedQbIds,
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
          description: serializeRichText(description),
          instructions: serializeRichText(instructions) || undefined,
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
          <RichTextEditor
            placeholder="Description"
            value={description}
            onChange={setDescription}
            disabled={busy}
            minHeight="100px"
          />
          {type !== "MCQ" ? (
            <RichTextEditor
              placeholder="Instructions (optional)"
              value={instructions}
              onChange={setInstructions}
              disabled={busy}
              minHeight="100px"
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
        <div className="space-y-4">
          {type === "MCQ" ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    Questionbank snapshot
                  </h3>
                  <span className="text-xs text-muted-foreground">{selectedQbIds.length} selected</span>
                </div>
                {scopeKind === "course" ? (
                  linkedPrograms.length === 0 ? (
                    <p className="text-sm text-accent">
                      Link a subject program to this course first (Course → Questionbank tab).
                    </p>
                  ) : (
                    <select
                      value={effectiveQbProgramId}
                      disabled={busy}
                      onChange={(e) => {
                        setQbBrowseProgramId(e.target.value);
                        setQbTopicId("");
                        setQbSubtopicId("");
                      }}
                      className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                    >
                      {linkedPrograms.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  )
                ) : null}
                {effectiveQbProgramId ? (
                  <>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <select
                        value={activeTopicId}
                        disabled={busy || qbLoading}
                        onChange={(e) => {
                          setQbTopicId(e.target.value);
                          setQbSubtopicId("");
                        }}
                        className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                      >
                        {qbTopicsSafe.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                      <select
                        value={activeSubtopicId}
                        disabled={busy || qbLoading || !subtopics.length}
                        onChange={(e) => setQbSubtopicId(e.target.value)}
                        className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                      >
                        {subtopics.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    {qbLoading ? (
                      <p className="text-sm text-muted-foreground">Loading questionbank…</p>
                    ) : pickerQuestions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No active multiple-choice questions in this subtopic.
                      </p>
                    ) : (
                      <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
                        {pickerQuestions.map((q) => {
                          const checked = selectedQbIds.includes(q.id);
                          return (
                            <label
                              key={q.id}
                              className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/60"
                            >
                              <input
                                type="checkbox"
                                className="mt-1"
                                checked={checked}
                                disabled={busy}
                                onChange={() =>
                                  setSelectedQbIds((prev) =>
                                    checked ? prev.filter((id) => id !== q.id) : [...prev, q.id]
                                  )
                                }
                              />
                              <span className="min-w-0">
                                <span className="font-medium text-foreground line-clamp-2">
                                  {q.number}. {q.prompt}
                                </span>
                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                  {String(q.difficulty)} · {String(q.paper)}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {selectedQbPreview.length > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Selected: {selectedQbPreview.map((q) => `#${q.number}`).join(", ")}
                        {selectedQbIds.length > selectedQbPreview.length
                          ? ` (+${selectedQbIds.length - selectedQbPreview.length} from other topics)`
                          : ""}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      On publish, selected items are copied into immutable exam questions. Later
                      questionbank edits will not change this exam.
                    </p>
                  </>
                ) : null}
              </div>

              <div className="border-t border-border pt-3 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  Custom questions
                </h3>
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
                  Add custom question
                </Button>
              </div>
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
              <span className="font-semibold">Questions:</span> {selectedQbIds.length} from
              questionbank + {mappedQuestions.length} custom · {durationMinutes} min ·{" "}
              {maxAttempts} attempts · pass {passingScore}%
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
