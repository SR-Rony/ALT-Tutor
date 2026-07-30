"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Expand,
  ExternalLink,
  FileText,
  HelpCircle,
  Lock,
  PlayCircle,
  ThumbsDown,
  ThumbsUp,
  Timer,
  Upload,
  XCircle,
} from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import {
  useSavePracticeExamAnswer,
  useSavePracticeExamAnswerFiles,
  useStartPracticeExamAttempt,
  useSubmitPracticeExamAttempt,
} from "@/hooks";
import { useAppSelector } from "@/store";
import { uploadService } from "@/services/upload.service";
import type { ApiError } from "@/types";
import type {
  PracticeExamAttemptPayload,
  PracticeExamAttemptQuestion,
} from "@/types/practice-exam.types";
import { cn } from "@/utils";
import { downloadQuestionPaperPdf } from "@/utils/qb-pdf-export";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = {
  programSlug: string;
  templateSlug: string;
};

const LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

function formatTimer(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function difficultyMeta(d: string) {
  const key = d.toUpperCase();
  if (key === "HARD") return { label: "Hard", color: "text-accent", filled: 4, total: 4 };
  if (key === "MEDIUM") return { label: "Medium", color: "text-[#f59e0b]", filled: 2, total: 4 };
  return { label: "Easy", color: "text-accent-green", filled: 1, total: 4 };
}

function DifficultyDots({ difficulty }: { difficulty: string }) {
  const meta = difficultyMeta(difficulty);
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-semibold", meta.color)}>
      {meta.label}
      <span className="inline-flex gap-1">
        {Array.from({ length: meta.total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 w-2 rounded-full",
              i < meta.filled
                ? meta.label === "Hard"
                  ? "bg-accent"
                  : meta.label === "Medium"
                    ? "bg-[#f59e0b]"
                    : "bg-accent-green"
                : "bg-border"
            )}
          />
        ))}
      </span>
    </span>
  );
}

function paperLabel(paper?: string | null) {
  const key = String(paper ?? "").toUpperCase();
  if (key === "PAPER_3" || key === "3") return "Paper 3";
  if (key === "PAPER_2" || key === "2") return "Paper 2";
  return "Paper 1";
}

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
  } catch {
    return null;
  }
  return null;
}

function VideoEmbed({ url }: { url: string }) {
  const yt = youtubeEmbedUrl(url);
  if (yt) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-sm">
        <iframe
          src={yt}
          title="Video solution"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  const lower = url.toLowerCase();
  if (/\.(mp4|webm|ogg)(\?|$)/.test(lower)) {
    return (
      <video
        controls
        className="aspect-video w-full rounded-xl border border-border bg-black shadow-sm"
        src={url}
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
      <PlayCircle className="mx-auto mb-2 h-8 w-8 text-primary" />
      <p className="text-sm text-muted-foreground">Inline preview is unavailable for this link.</p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        Watch video <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

function isHttpAnswerUrl(value: string | null | undefined) {
  return Boolean(value && /^https?:\/\//i.test(value.trim()));
}

export function PracticeExamTakePage({ programSlug, templateSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceNew = searchParams.get("new") === "1";
  const { programName } = useProgramContext(programSlug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const startAttempt = useStartPracticeExamAttempt();
  const saveAnswer = useSavePracticeExamAnswer();
  const saveAnswerFiles = useSavePracticeExamAnswerFiles();
  const submitAttempt = useSubmitPracticeExamAttempt();

  const [payload, setPayload] = useState<PracticeExamAttemptPayload | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [answerFileUrls, setAnswerFileUrls] = useState<string[]>([]);
  const [answerUploadName, setAnswerUploadName] = useState<string | null>(null);
  const [answerUploading, setAnswerUploading] = useState(false);
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);
  const answerFileRef = useRef<HTMLInputElement>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const bootedRef = useRef(false);
  const autoSubmitRef = useRef(false);

  const applyPayload = useCallback((data: PracticeExamAttemptPayload, opts?: { openResult?: boolean }) => {
    const submitted =
      data.attempt.status === "SUBMITTED" || data.attempt.status === "GRADED";
    setPayload(data);
    setExamSubmitted(submitted);
    const restored: Record<string, string> = {};
    for (const q of data.questions) {
      if (q.studentAnswer) restored[q.id] = q.studentAnswer;
    }
    setSelectedAnswers(restored);
    setAnswerFileUrls(data.attempt.answerFileUrls ?? []);
    if (submitted) {
      setRemainingSeconds(null);
      if (opts?.openResult) setResultModalOpen(true);
    } else if (data.attempt.expiresAt) {
      setRemainingSeconds(
        Math.max(
          0,
          Math.floor((new Date(data.attempt.expiresAt).getTime() - Date.now()) / 1000)
        )
      );
    } else {
      setRemainingSeconds(null);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      const next = ROUTES.subjectPracticeExamTake(programSlug, templateSlug, {
        new: forceNew || undefined,
      });
      router.replace(`${ROUTES.auth.login}?next=${encodeURIComponent(next)}`);
      return;
    }
    if (bootedRef.current) return;
    bootedRef.current = true;
    void (async () => {
      setBootError(null);
      try {
        const data = await startAttempt.mutateAsync({
          programSlug,
          templateSlug,
          forceNew: forceNew || undefined,
        });
        applyPayload(data);
        if (forceNew) {
          router.replace(ROUTES.subjectPracticeExamTake(programSlug, templateSlug));
        }
      } catch (err) {
        setBootError((err as ApiError)?.message || "Failed to start practice exam");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once per mount
  }, [isAuthenticated, programSlug, templateSlug, forceNew]);

  useEffect(() => {
    if (!payload?.attempt.expiresAt || examSubmitted) return;
    const tick = () => {
      const left = Math.max(
        0,
        Math.floor((new Date(payload.attempt.expiresAt!).getTime() - Date.now()) / 1000)
      );
      setRemainingSeconds(left);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [payload?.attempt.expiresAt, examSubmitted]);

  const handleSubmit = useCallback(async () => {
    if (!payload || submitting || submitAttempt.isPending || examSubmitted) return;
    const isWritten = payload.template.mode === "WRITTEN";
    const perQuestion = payload.template.writtenStyle === "PER_QUESTION";
    if (isWritten) {
      if (perQuestion) {
        const missing = payload.questions.some((q) => !isHttpAnswerUrl(selectedAnswers[q.id]));
        if (missing) {
          setBootError("Upload an answer file for every question before submitting.");
          return;
        }
      } else if (answerFileUrls.length === 0) {
        setBootError("Upload your answer script before submitting.");
        return;
      }
    }
    setSubmitting(true);
    try {
      const data = await submitAttempt.mutateAsync(payload.attempt.id);
      applyPayload(data, { openResult: true });
      setSubmitting(false);
    } catch (err) {
      setBootError((err as ApiError)?.message || "Failed to submit exam");
      setSubmitting(false);
    }
  }, [
    payload,
    submitting,
    submitAttempt,
    examSubmitted,
    applyPayload,
    answerFileUrls.length,
    selectedAnswers,
  ]);

  useEffect(() => {
    if (remainingSeconds !== 0 || !payload || examSubmitted || autoSubmitRef.current) return;
    if (payload.template.mode === "WRITTEN") {
      const perQuestion = payload.template.writtenStyle === "PER_QUESTION";
      const ready = perQuestion
        ? payload.questions.every((q) => isHttpAnswerUrl(selectedAnswers[q.id]))
        : answerFileUrls.length > 0;
      if (!ready) return;
    }
    autoSubmitRef.current = true;
    void handleSubmit();
  }, [
    remainingSeconds,
    payload,
    examSubmitted,
    handleSubmit,
    answerFileUrls.length,
    selectedAnswers,
  ]);

  const handleSelectAnswer = async (questionId: string, letter: string) => {
    if (!payload || submitting || examSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: letter }));
    setSavingQuestionId(questionId);
    try {
      const result = await saveAnswer.mutateAsync({
        attemptId: payload.attempt.id,
        questionId,
        answer: letter,
      });
      if (result.expired && result.result) {
        applyPayload(result.result, { openResult: true });
      }
    } catch (err) {
      setBootError((err as ApiError)?.message || "Failed to save answer");
    } finally {
      setSavingQuestionId(null);
    }
  };

  const handleDownloadQuestions = () => {
    if (!payload) return;
    downloadQuestionPaperPdf({
      title: `${programName} — ${payload.template.title}`,
      subtitle: `${payload.questions.length} questions · Written practice exam`,
      questions: payload.questions,
    });
  };

  const needsLateFileAttach =
    Boolean(payload) &&
    payload!.template.mode === "WRITTEN" &&
    payload!.template.writtenStyle !== "PER_QUESTION" &&
    payload!.attempt.status === "SUBMITTED" &&
    (payload!.attempt.answerFileUrls?.length ?? 0) === 0;

  const perQuestionWritten =
    Boolean(payload) &&
    payload!.template.mode === "WRITTEN" &&
    payload!.template.writtenStyle === "PER_QUESTION";

  const canUploadAnswers =
    Boolean(payload) &&
    payload!.template.mode === "WRITTEN" &&
    !perQuestionWritten &&
    (!examSubmitted || needsLateFileAttach);

  const handleUploadQuestionAnswer = async (questionId: string, file: File | null) => {
    if (!file || !payload || examSubmitted || !perQuestionWritten) return;
    setBootError(null);
    setUploadingQuestionId(questionId);
    try {
      const uploaded = await uploadService.upload(file, "assignments");
      const result = await saveAnswer.mutateAsync({
        attemptId: payload.attempt.id,
        questionId,
        answer: uploaded.url,
      });
      if ("expired" in result && result.expired && result.result) {
        applyPayload(result.result, { openResult: result.result.attempt.status !== "IN_PROGRESS" });
      } else {
        setSelectedAnswers((prev) => ({ ...prev, [questionId]: uploaded.url }));
      }
    } catch (err) {
      setBootError((err as ApiError)?.message || "Could not upload answer file");
    } finally {
      setUploadingQuestionId(null);
    }
  };

  const handleUploadAnswers = async (file: File | null) => {
    if (!file || !payload || !canUploadAnswers) return;
    setBootError(null);
    setAnswerUploading(true);
    try {
      const uploaded = await uploadService.upload(file, "assignments");
      const nextUrls = [...new Set([...answerFileUrls, uploaded.url])].slice(0, 10);
      const result = await saveAnswerFiles.mutateAsync({
        attemptId: payload.attempt.id,
        fileUrls: nextUrls,
      });
      if ("expired" in result && result.expired && result.result) {
        applyPayload(result.result, { openResult: true });
      } else if ("answerFileUrls" in result) {
        setAnswerFileUrls(result.answerFileUrls);
        setAnswerUploadName(file.name);
        if (needsLateFileAttach) {
          applyPayload({
            ...payload,
            attempt: {
              ...payload.attempt,
              answerFileUrls: result.answerFileUrls,
            },
          });
        }
      }
    } catch (err) {
      setBootError((err as ApiError)?.message || "Could not upload answer file");
    } finally {
      setAnswerUploading(false);
      if (answerFileRef.current) answerFileRef.current.value = "";
    }
  };

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "practice-exams",
    resourceLabel: "Practice Exams",
    resourceHref: ROUTES.subjectResource(programSlug, "practice-exams"),
    topicLabel: payload?.template.title ?? "Exam",
  });

  const answeredCount = useMemo(() => Object.keys(selectedAnswers).length, [selectedAnswers]);
  const writtenReady = useMemo(() => {
    if (!payload || payload.template.mode !== "WRITTEN") return false;
    if (payload.template.writtenStyle === "PER_QUESTION") {
      return payload.questions.every((q) => isHttpAnswerUrl(selectedAnswers[q.id]));
    }
    return answerFileUrls.length > 0;
  }, [payload, selectedAnswers, answerFileUrls.length]);
  const perQuestionAnsweredCount = useMemo(() => {
    if (!payload) return 0;
    return payload.questions.filter((q) => isHttpAnswerUrl(selectedAnswers[q.id])).length;
  }, [payload, selectedAnswers]);

  const reviewIncorrect = () => {
    const firstWrong = payload?.questions.find((q) => q.isCorrect === false);
    const el = firstWrong
      ? document.getElementById(`pe-q-${firstWrong.id}`)
      : document.querySelector("[data-pe-q]");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setResultModalOpen(false);
  };

  if (!isAuthenticated || (!payload && !bootError)) {
    return <PageLoader label="Starting exam..." />;
  }

  if (bootError && !payload) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-accent">{bootError}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline">
            <Link href={ROUTES.subjectPracticeExam(programSlug, templateSlug)}>Back</Link>
          </Button>
          <Button
            type="button"
            onClick={() => {
              bootedRef.current = false;
              setBootError(null);
              router.refresh();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!payload) return <PageLoader label="Loading exam..." />;

  const { attempt, template } = payload;
  const passed = attempt.passed;
  const writtenMode = template.mode === "WRITTEN";

  return (
    <div className="bg-background pb-24">
      <ResourceHero
        title={template.title}
        subtitle={`${programName} · ${writtenMode ? "written exam" : "timed exam"}`}
        description={
          examSubmitted
            ? writtenMode
              ? "Exam submitted. Mark schemes and video solutions are unlocked for self-review."
              : "Exam submitted. Review correct/incorrect answers and unlock mark schemes & videos."
            : writtenMode
              ? "Download the full question paper, write your answers offline, then upload your script and submit."
              : "Mark schemes and videos stay locked until you submit. Answers autosave."
        }
        icon={<Timer className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card px-3 py-1 text-xs font-semibold">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden />
            {writtenMode
              ? `${payload.questions.length} questions`
              : examSubmitted
                ? `${attempt.correctCount}/${attempt.totalQuestions} correct`
                : `${answeredCount}/${payload.questions.length} answered`}
          </span>
          {writtenMode ? (
            <span className="rounded-full border border-primary/15 bg-card px-3 py-1 text-xs font-semibold">
              Written
            </span>
          ) : null}
          {!examSubmitted && remainingSeconds != null ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                remainingSeconds < 300
                  ? "bg-accent/15 text-accent"
                  : "border border-primary/15 bg-card text-foreground"
              )}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {formatTimer(remainingSeconds)}
            </span>
          ) : null}
          {examSubmitted && !writtenMode ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-green)]/30 bg-[#ecfdf3] px-3 py-1 text-xs font-bold text-[var(--accent-green)]">
              Score {attempt.score}%
            </span>
          ) : null}
        </div>
      </ResourceHero>

      {bootError ? (
        <p className="mx-auto max-w-5xl px-4 pt-4 text-sm text-accent md:px-6">{bootError}</p>
      ) : null}

      {perQuestionWritten && !examSubmitted ? (
        <div className="mx-auto max-w-5xl px-4 pt-6 md:px-6">
          <div className="rounded-xl border border-[#c5d9ef] bg-[#e8f0fa] px-4 py-4">
            <p className="text-sm font-semibold text-foreground">Per-question written exam</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Upload one answer file for each question below
              {payload.questions.length === 1
                ? " (single-question exam)."
                : ` (${perQuestionAnsweredCount}/${payload.questions.length} uploaded).`}{" "}
              Accepted: PDF, Word, images, or ZIP.
              {remainingSeconds === 0
                ? " Time is up — finish uploading all answers to submit."
                : ""}
            </p>
          </div>
        </div>
      ) : null}

      {writtenMode && canUploadAnswers ? (
        <div className="mx-auto max-w-5xl px-4 pt-6 md:px-6">
          <div className="rounded-xl border border-[#c5d9ef] bg-[#e8f0fa] px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {needsLateFileAttach ? "Attach answer script" : "Written exam pack"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {needsLateFileAttach
                    ? "This attempt was submitted without an answer file. Upload your script so an admin can mark it."
                    : remainingSeconds === 0
                      ? "Time is up — upload your answer script to finish the exam."
                      : `Download all ${payload.questions.length} questions as one PDF, complete your answers offline, then upload your answer script before submitting.`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!needsLateFileAttach ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-primary/30 bg-card"
                    onClick={handleDownloadQuestions}
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    Download questions
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  disabled={answerUploading || submitting}
                  onClick={() => answerFileRef.current?.click()}
                >
                  <Upload className="mr-1.5 h-4 w-4" />
                  {answerUploading ? "Uploading…" : "Upload answers"}
                </Button>
                <input
                  ref={answerFileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                  className="hidden"
                  onChange={(event) => void handleUploadAnswers(event.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            {answerUploadName || writtenReady ? (
              <p className="mt-3 text-xs font-medium text-accent-green">
                {answerUploadName
                  ? `Uploaded: ${answerUploadName}`
                  : `${answerFileUrls.length} answer file(s) saved`}
                {needsLateFileAttach ? "." : ". You can submit when ready."}
              </p>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Accepted: PDF, Word, images, or ZIP.
              </p>
            )}
          </div>
        </div>
      ) : null}

      {examSubmitted && !needsLateFileAttach ? (
        <div className="mx-auto max-w-5xl px-4 pt-6 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--accent-green)]/40 bg-[var(--accent-green)]/10 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">
              {writtenMode
                ? `Written exam submitted${answerFileUrls.length ? ` · ${answerFileUrls.length} file(s)` : ""}. Waiting for admin marks — mark schemes are unlocked for self-review.`
                : `Exam submitted — ${attempt.correctCount}/${attempt.totalQuestions} correct (${attempt.score}%). Mark schemes and video solutions are unlocked.`}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setResultModalOpen(true)}>
                View result
              </Button>
              {!writtenMode ? (
                <Button type="button" variant="outline" size="sm" onClick={reviewIncorrect}>
                  Review answers
                </Button>
              ) : null}
            </div>
          </div>
          {writtenMode && answerFileUrls.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {answerFileUrls.map((url, i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Answer file {i + 1}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : !writtenMode ? (
        <div className="mx-auto max-w-5xl px-4 pt-6 md:px-6">
          <div className="rounded-xl border border-primary/20 bg-primary-muted/60 px-4 py-3 text-sm">
            <p className="inline-flex items-center gap-2 font-medium text-foreground">
              <Lock className="h-4 w-4 text-primary" />
              Solutions are locked during the exam
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              After you submit, correct/incorrect answers, mark schemes, and videos appear on this
              page.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 md:px-6">
        {writtenMode ? (
          <>
            {!examSubmitted && !perQuestionWritten ? (
              <p className="text-sm text-muted-foreground">
                Preview of questions below (same set as the downloadable PDF). Write answers offline —
                do not answer here.
              </p>
            ) : null}
            {payload.questions.map((question, index) => (
              <WrittenQuestionCard
                key={question.id}
                index={index}
                question={question}
                solutionsUnlocked={examSubmitted}
                perQuestionUpload={perQuestionWritten}
                answerFileUrl={selectedAnswers[question.id] ?? null}
                uploading={uploadingQuestionId === question.id}
                disabled={submitting || examSubmitted}
                onUploadFile={(file) => void handleUploadQuestionAnswer(question.id, file)}
              />
            ))}
          </>
        ) : (
          payload.questions.map((question, index) => (
            <ExamQuestionCard
              key={question.id}
              index={index}
              question={question}
              selected={selectedAnswers[question.id] ?? null}
              saving={savingQuestionId === question.id}
              solutionsUnlocked={examSubmitted}
              disabled={submitting || examSubmitted}
              onSelect={(letter) => void handleSelectAnswer(question.id, letter)}
            />
          ))
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          {examSubmitted ? (
            <>
              <p className="text-sm text-muted-foreground">
                {writtenMode
                  ? "Submitted · awaiting admin marks"
                  : `${attempt.correctCount}/${attempt.totalQuestions} correct · ${attempt.score}%`}
              </p>
              <div className="flex flex-wrap gap-2">
                {!writtenMode ? (
                  <Button type="button" variant="outline" size="pill" onClick={reviewIncorrect}>
                    Review answers
                  </Button>
                ) : null}
                <Button asChild size="pill">
                  <Link
                    href={ROUTES.subjectPracticeExamTake(programSlug, templateSlug, { new: true })}
                  >
                    Retry exam
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {writtenMode
                  ? writtenReady
                    ? perQuestionWritten
                      ? "All question answers uploaded — ready to submit"
                      : "Answer script uploaded — ready to submit"
                    : perQuestionWritten
                      ? `Upload answers for each question (${perQuestionAnsweredCount}/${payload.questions.length})`
                      : "Download questions, then upload your answers"
                  : answeredCount < payload.questions.length
                    ? `${payload.questions.length - answeredCount} unanswered`
                    : "All questions answered"}
              </p>
              <Button
                type="button"
                size="pill"
                disabled={
                  submitting ||
                  submitAttempt.isPending ||
                  (writtenMode && !writtenReady)
                }
                onClick={() => {
                  if (writtenMode) {
                    if (!writtenReady) {
                      setBootError(
                        perQuestionWritten
                          ? "Upload an answer file for every question before submitting."
                          : "Upload your answer script before submitting."
                      );
                      return;
                    }
                    void handleSubmit();
                    return;
                  }
                  const unanswered = payload.questions.length - answeredCount;
                  if (
                    unanswered > 0 &&
                    !window.confirm(`Submit with ${unanswered} unanswered question(s)?`)
                  ) {
                    return;
                  }
                  void handleSubmit();
                }}
              >
                {submitting || submitAttempt.isPending ? "Submitting…" : "Submit exam"}
              </Button>
            </>
          )}
        </div>
      </div>

      <AdminModal
        open={resultModalOpen && examSubmitted}
        title="Exam result"
        description={`${template.title} · ${programName}`}
        onClose={() => setResultModalOpen(false)}
        className="sm:max-w-md"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            {!writtenMode ? (
              <Button type="button" variant="outline" size="pill" onClick={reviewIncorrect}>
                Review answers
              </Button>
            ) : null}
            <Button type="button" size="pill" onClick={() => setResultModalOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-center">
          <p
            className={cn(
              "mx-auto flex h-14 w-14 items-center justify-center rounded-full",
              writtenMode
                ? "bg-primary-muted text-primary"
                : passed === true
                  ? "bg-[#ecfdf3] text-[var(--accent-green)]"
                  : passed === false
                    ? "bg-accent/10 text-accent"
                    : "bg-primary-muted text-primary"
            )}
          >
            {passed === false && !writtenMode ? (
              <XCircle className="h-7 w-7" aria-hidden />
            ) : (
              <CheckCircle2 className="h-7 w-7" aria-hidden />
            )}
          </p>
          <div>
            {writtenMode ? (
              <>
                <p className="text-2xl font-bold text-foreground">Submitted</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {payload.questions.length} questions · awaiting admin marks
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  You can self-review with mark schemes meanwhile. Your score appears after marking.
                </p>
              </>
            ) : (
              <>
                <p className="text-4xl font-bold text-foreground">{attempt.score}%</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {attempt.correctCount}/{attempt.totalQuestions} correct
                  {attempt.totalMarks > 0
                    ? ` · ${attempt.earnedMarks}/${attempt.totalMarks} marks`
                    : ""}
                </p>
                {template.passMarkPercent != null ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Pass mark {template.passMarkPercent}%
                  </p>
                ) : null}
                {passed != null ? (
                  <p
                    className={cn(
                      "mt-3 text-sm font-bold",
                      passed ? "text-[var(--accent-green)]" : "text-accent"
                    )}
                  >
                    {passed ? "Passed" : "Not passed"}
                  </p>
                ) : null}
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {writtenMode
              ? "Use Mark Scheme and Video Solutions on each question to check your work."
              : "Correct and incorrect answers are highlighted on this page. Use Mark Scheme and Video Solutions on each question to review."}
          </p>
        </div>
      </AdminModal>
    </div>
  );
}

function WrittenQuestionCard({
  index,
  question,
  solutionsUnlocked,
  perQuestionUpload = false,
  answerFileUrl = null,
  uploading = false,
  disabled = false,
  onUploadFile,
}: {
  index: number;
  question: PracticeExamAttemptQuestion;
  solutionsUnlocked: boolean;
  perQuestionUpload?: boolean;
  answerFileUrl?: string | null;
  uploading?: boolean;
  disabled?: boolean;
  onUploadFile?: (file: File | null) => void;
}) {
  const [modal, setModal] = useState<"scheme" | "video" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const displayNumber = question.number || index + 1;
  const hasFile = isHttpAnswerUrl(answerFileUrl);

  return (
    <article
      id={`pe-q-${question.id}`}
      data-pe-q
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className="rounded-md bg-primary-muted px-2 py-0.5 text-primary">
          Question {displayNumber}
        </span>
        <span>{paperLabel(question.paper)}</span>
        {question.difficulty ? <DifficultyDots difficulty={question.difficulty} /> : null}
        {question.marks ? <span>{question.marks} marks</span> : null}
        {perQuestionUpload && hasFile ? (
          <span className="rounded-md bg-[#ecfdf3] px-2 py-0.5 text-[var(--accent-green)]">
            Answer uploaded
          </span>
        ) : null}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground md:text-base">
        {question.prompt}
      </p>
      {question.body ? (
        <div className="prose prose-sm mt-3 max-w-none whitespace-pre-wrap text-foreground">
          {question.body}
        </div>
      ) : null}
      {question.diagramUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.diagramUrl}
          alt={`Diagram for question ${displayNumber}`}
          className="mt-4 max-h-80 rounded-xl border border-border object-contain"
        />
      ) : null}

      {perQuestionUpload ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!disabled ? (
            <>
              <Button
                type="button"
                size="sm"
                disabled={uploading || disabled}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="mr-1.5 h-4 w-4" />
                {uploading ? "Uploading…" : hasFile ? "Replace answer" : "Upload answer"}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
                className="hidden"
                onChange={(event) => onUploadFile?.(event.target.files?.[0] ?? null)}
              />
            </>
          ) : null}
          {hasFile && answerFileUrl ? (
            <a
              href={answerFileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <FileText className="h-3.5 w-3.5" />
              View uploaded file
            </a>
          ) : null}
        </div>
      ) : null}

      {solutionsUnlocked ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!question.markScheme}
            onClick={() => setModal("scheme")}
          >
            <FileText className="mr-1.5 h-4 w-4" />
            Mark scheme
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!question.videoUrl}
            onClick={() => setModal("video")}
          >
            <PlayCircle className="mr-1.5 h-4 w-4" />
            Video
          </Button>
        </div>
      ) : (
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Mark scheme unlocks after submit
        </p>
      )}

      <AdminModal
        open={modal === "scheme"}
        title={`Mark scheme · Q${displayNumber}`}
        onClose={() => setModal(null)}
        className="sm:max-w-lg"
      >
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
          {question.markScheme || "No mark scheme."}
        </div>
      </AdminModal>
      <AdminModal
        open={modal === "video"}
        title={`Video · Q${displayNumber}`}
        onClose={() => setModal(null)}
        className="sm:max-w-2xl"
      >
        {question.videoUrl ? <VideoEmbed url={question.videoUrl} /> : null}
      </AdminModal>
    </article>
  );
}

function ExamQuestionCard({
  index,
  question,
  selected,
  saving,
  solutionsUnlocked,
  disabled,
  onSelect,
}: {
  index: number;
  question: PracticeExamAttemptQuestion;
  selected: string | null;
  saving: boolean;
  solutionsUnlocked: boolean;
  disabled: boolean;
  onSelect: (letter: string) => void;
}) {
  const [modal, setModal] = useState<"scheme" | "video" | null>(null);
  const [completed, setCompleted] = useState(false);
  const displayNumber = question.number || index + 1;
  const qLabel = `Question ${displayNumber}`;
  const answered = selected !== null;
  const correctAnswer = (question.correctAnswer ?? "").toUpperCase();
  const correct = question.isCorrect === true;
  const optionCount = Math.max(question.options.length, 1);
  const letters = LETTERS.slice(0, optionCount);
  const markScheme = question.markScheme;
  const videoUrl = question.videoUrl;
  const isMcq = question.options.length > 0;

  return (
    <section id={`pe-q-${question.id}`} className="scroll-mt-28" data-pe-q>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">{qLabel}</h2>
        <div className="flex items-center gap-2 text-muted-foreground">
          {solutionsUnlocked && question.isCorrect != null ? (
            question.isCorrect ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent-green)]">
                <CheckCircle2 className="h-4 w-4" /> Correct
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-accent">
                <XCircle className="h-4 w-4" /> Incorrect
              </span>
            )
          ) : (
            <>
              <ThumbsUp className="h-4 w-4" />
              <ThumbsDown className="h-4 w-4" />
            </>
          )}
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4",
          solutionsUnlocked ? "lg:grid-cols-[minmax(0,1fr)_10rem]" : "grid-cols-1"
        )}
      >
        <article className="rounded-2xl border border-border bg-card p-4 shadow-[0_8px_28px_-16px_rgba(24,119,242,0.2)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {question.calculatorAllowed ? (
                <span className="rounded-md bg-primary-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                  Calculator
                </span>
              ) : (
                <span className="rounded-md bg-primary-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                  No calculator
                </span>
              )}
              {question.difficulty ? (
                <DifficultyDots difficulty={String(question.difficulty)} />
              ) : null}
              <span className="rounded-md border border-primary/15 bg-primary-muted/40 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                {paperLabel(question.paper)}
                {isMcq ? " · MCQ" : ""}
              </span>
              {question.marks != null && question.marks > 0 ? (
                <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-bold uppercase text-foreground">
                  [{question.marks}]
                </span>
              ) : null}
            </div>
            <Expand className="h-4 w-4 text-muted-foreground" />
          </div>

          <p className="text-sm leading-relaxed text-foreground md:text-base">{question.prompt}</p>
          {question.body ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{question.body}</p>
          ) : null}

          {question.diagramUrl ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={question.diagramUrl}
                alt={`Diagram for ${qLabel}`}
                className="mx-auto max-h-[28rem] w-auto max-w-full object-contain p-3"
              />
            </div>
          ) : null}

          {isMcq ? (
            <ul className="mt-4 space-y-1.5 text-sm text-foreground">
              {question.options.map((opt, i) => (
                <li key={`${i}-${opt}`}>
                  <span className="font-semibold">{LETTERS[i] ?? i + 1}.</span> {opt}
                </li>
              ))}
            </ul>
          ) : null}

          {isMcq ? (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Choose an answer
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {letters.map((letter) => {
                  const isSelected = selected === letter;
                  const isCorrectChoice = correctAnswer ? letter === correctAnswer : false;
                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={saving || disabled}
                      onClick={() => onSelect(letter)}
                      className={cn(
                        "relative flex h-12 items-center justify-center rounded-xl border text-sm font-bold transition",
                        !answered &&
                          "border-border bg-muted/40 hover:border-primary hover:bg-primary-muted",
                        answered &&
                          solutionsUnlocked &&
                          isCorrectChoice &&
                          "border-accent-green bg-[#ecfdf3] text-accent-green",
                        answered &&
                          solutionsUnlocked &&
                          isSelected &&
                          !correct &&
                          "border-accent bg-accent/10 text-accent",
                        answered &&
                          solutionsUnlocked &&
                          !isSelected &&
                          !isCorrectChoice &&
                          "opacity-50",
                        answered &&
                          !solutionsUnlocked &&
                          isSelected &&
                          "border-primary bg-primary-muted text-primary"
                      )}
                    >
                      {letter}
                      {answered && solutionsUnlocked && isCorrectChoice ? (
                        <CheckCircle2 className="absolute right-2 h-4 w-4" />
                      ) : null}
                      {answered && solutionsUnlocked && isSelected && !correct ? (
                        <XCircle className="absolute right-2 h-4 w-4" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </article>

        {solutionsUnlocked ? (
          <aside className="flex flex-row flex-wrap gap-2 lg:flex-col lg:flex-nowrap">
            <div className="flex gap-2 lg:justify-end">
              <button
                type="button"
                className="rounded-lg border border-border p-2 text-muted-foreground hover:text-primary"
                aria-label="Bookmark"
              >
                <Bookmark className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCompleted((v) => !v)}
                className={cn(
                  "rounded-lg border p-2 transition",
                  completed
                    ? "border-accent-green bg-[#ecfdf3] text-accent-green"
                    : "border-border text-muted-foreground hover:text-accent-green"
                )}
                aria-label={completed ? "Mark incomplete" : "Mark complete"}
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              className="justify-start border-primary/40 text-primary hover:bg-primary-muted hover:text-primary"
              onClick={() => setModal("scheme")}
              disabled={!markScheme}
            >
              <FileText className="mr-1.5 h-4 w-4" />
              Mark Scheme
            </Button>
            <Button
              type="button"
              className="justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setModal("video")}
              disabled={!videoUrl}
            >
              Video Solutions
              {videoUrl ? (
                <span className="ml-auto rounded-full bg-white/25 px-1.5 text-[10px] font-bold text-white">
                  1
                </span>
              ) : null}
            </Button>
          </aside>
        ) : null}
      </div>

      <AdminModal
        open={modal === "scheme"}
        title="Mark Scheme"
        description={`${qLabel} · Official solution guidance`}
        onClose={() => setModal(null)}
        className="sm:max-w-2xl"
        footer={
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => setModal(null)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-lg bg-primary-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <FileText className="h-3.5 w-3.5" />
            Solution notes
          </div>
          <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm leading-relaxed text-foreground md:text-[15px]">
            <p className="whitespace-pre-wrap">{markScheme}</p>
          </div>
          {correctAnswer ? (
            <p className="text-xs text-muted-foreground">
              Correct answer:{" "}
              <span className="font-semibold text-foreground">{correctAnswer}</span>
            </p>
          ) : null}
        </div>
      </AdminModal>

      <AdminModal
        open={modal === "video"}
        title="Video Solution"
        description={`${qLabel} · Short worked explanation`}
        onClose={() => setModal(null)}
        className="sm:max-w-3xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            {videoUrl ? (
              <a
                href={videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Open in new tab <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span />
            )}
            <Button type="button" variant="outline" onClick={() => setModal(null)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-lg bg-primary-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
            <PlayCircle className="h-3.5 w-3.5" />
            1 video available
          </div>
          {videoUrl ? <VideoEmbed key={videoUrl} url={videoUrl} /> : null}
        </div>
      </AdminModal>
    </section>
  );
}
