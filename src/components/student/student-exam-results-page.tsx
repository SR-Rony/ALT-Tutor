"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  Hourglass,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/dashboard/admin-stat-card";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useMyPastPaperResults, useMyPracticeExamResults } from "@/hooks";
import { formatShortDate } from "@/lib/format";
import type { ApiError } from "@/types";
import type { PastPaperHistoryItem } from "@/types/past-paper.types";
import type { PracticeExamHistoryItem } from "@/types/practice-exam.types";
import { cn } from "@/utils";

type ResultKind = "MCQ" | "WRITTEN" | "PAST_PAPER";
type ResultStatus = "IN_PROGRESS" | "AWAITING" | "MARKED" | "COMPLETED" | "ABANDONED";
type FilterTab = "ALL" | ResultKind;

type ResultRow = {
  id: string;
  kind: ResultKind;
  title: string;
  detail: string | null;
  program: { id: string; name: string; slug: string };
  status: ResultStatus;
  score: number | null;
  earnedMarks: number | null;
  totalMarks: number | null;
  correctCount: number | null;
  totalQuestions: number;
  date: string;
  hasCheckedScript: boolean;
  feedback: string | null;
  href: string;
};

const KIND_LABEL: Record<ResultKind, string> = {
  MCQ: "MCQ exam",
  WRITTEN: "Written exam",
  PAST_PAPER: "Past paper",
};

const STATUS_META: Record<ResultStatus, { label: string; className: string }> = {
  IN_PROGRESS: { label: "In progress", className: "bg-primary/10 text-primary" },
  AWAITING: { label: "Awaiting marking", className: "bg-[#fff4e5] text-[#b45309]" },
  MARKED: { label: "Marked", className: "bg-[#ecfdf3] text-accent-green" },
  COMPLETED: { label: "Completed", className: "bg-[#ecfdf3] text-accent-green" },
  ABANDONED: { label: "Abandoned", className: "bg-muted text-muted-foreground" },
};

function fromPracticeExam(item: PracticeExamHistoryItem): ResultRow {
  const written = item.template.mode === "WRITTEN";
  const status: ResultStatus =
    item.status === "IN_PROGRESS"
      ? "IN_PROGRESS"
      : item.status === "ABANDONED"
        ? "ABANDONED"
        : written
          ? item.status === "GRADED"
            ? "MARKED"
            : "AWAITING"
          : "COMPLETED";
  const programSlug = item.program.slug;
  const templateSlug = item.template.slug;
  return {
    id: item.id,
    kind: written ? "WRITTEN" : "MCQ",
    title: item.template.title,
    detail: null,
    program: item.program,
    status,
    score: status === "AWAITING" || status === "IN_PROGRESS" ? null : item.score,
    earnedMarks: status === "AWAITING" ? null : item.earnedMarks,
    totalMarks: item.totalMarks,
    correctCount: written ? null : item.correctCount,
    totalQuestions: item.totalQuestions,
    date: item.submittedAt ?? item.startedAt,
    hasCheckedScript: status === "MARKED" && (item.markedFileUrls?.length ?? 0) > 0,
    feedback: status === "MARKED" ? item.feedback ?? null : null,
    href:
      status === "IN_PROGRESS"
        ? ROUTES.subjectPracticeExamTake(programSlug, templateSlug)
        : ROUTES.subjectPracticeExamResult(programSlug, templateSlug, item.id),
  };
}

function fromPastPaper(item: PastPaperHistoryItem): ResultRow {
  const status: ResultStatus =
    item.status === "IN_PROGRESS"
      ? "IN_PROGRESS"
      : item.status === "ABANDONED"
        ? "ABANDONED"
        : "COMPLETED";
  const { paper } = item;
  const detail = [paper.year, paper.session, paper.paperCode].filter(Boolean).join(" · ") || null;
  return {
    id: item.id,
    kind: "PAST_PAPER",
    title: paper.title,
    detail,
    program: item.program,
    status,
    score: status === "IN_PROGRESS" ? null : item.score,
    earnedMarks: item.earnedMarks,
    totalMarks: item.totalMarks,
    correctCount: item.correctCount,
    totalQuestions: item.totalQuestions,
    date: item.submittedAt ?? item.startedAt,
    hasCheckedScript: false,
    feedback: null,
    href:
      status === "IN_PROGRESS"
        ? ROUTES.subjectPastPaperTake(item.program.slug, paper.slug)
        : ROUTES.subjectPastPaperResult(item.program.slug, paper.slug, item.id),
  };
}

function scoreTone(score: number) {
  if (score >= 70) return "text-accent-green";
  if (score >= 40) return "text-[#b45309]";
  return "text-accent";
}

function ResultRowItem({ row }: { row: ResultRow }) {
  const status = STATUS_META[row.status];
  const scored = row.score != null && (row.status === "MARKED" || row.status === "COMPLETED");
  const actionLabel =
    row.status === "IN_PROGRESS"
      ? "Continue"
      : row.hasCheckedScript
        ? "View result & script"
        : row.status === "AWAITING"
          ? "View submission"
          : "View result";

  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-4 transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-5",
        row.hasCheckedScript ? "border-[#c7d7fe]" : "border-border"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-primary-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
            {KIND_LABEL[row.kind]}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              status.className
            )}
          >
            {status.label}
          </span>
          {row.hasCheckedScript ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#eef4ff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              <FileCheck2 className="h-3 w-3" aria-hidden />
              Checked script
            </span>
          ) : null}
        </div>
        <Link
          href={row.href}
          className="mt-1.5 block truncate text-base font-bold text-foreground hover:text-primary"
        >
          {row.title}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>{row.program.name}</span>
          {row.detail ? <span>{row.detail}</span> : null}
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" aria-hidden />
            {formatShortDate(row.date)}
          </span>
        </p>
        {row.feedback ? (
          <p className="mt-2 line-clamp-2 rounded-lg bg-muted/40 px-3 py-1.5 text-xs text-foreground">
            <span className="font-semibold">Teacher feedback: </span>
            {row.feedback}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-5 sm:justify-end">
        <div className="text-left sm:text-right">
          {scored ? (
            <>
              <p className={cn("text-2xl font-bold leading-none", scoreTone(row.score!))}>
                {row.score}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {row.correctCount != null
                  ? `${row.correctCount}/${row.totalQuestions} correct`
                  : `${row.totalQuestions} question${row.totalQuestions === 1 ? "" : "s"}`}
                {row.totalMarks && row.earnedMarks != null
                  ? ` · ${row.earnedMarks}/${row.totalMarks} marks`
                  : ""}
              </p>
            </>
          ) : row.status === "AWAITING" ? (
            <p className="inline-flex items-center gap-1 text-sm font-semibold text-[#b45309]">
              <Hourglass className="h-4 w-4" aria-hidden />
              Not marked yet
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </div>
        <Button asChild size="sm" variant={row.status === "IN_PROGRESS" ? "outline" : "default"}>
          <Link href={row.href}>
            {actionLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      </div>
    </li>
  );
}

export function StudentExamResultsPage() {
  const practice = useMyPracticeExamResults();
  const pastPapers = useMyPastPaperResults();
  const [tab, setTab] = useState<FilterTab>("ALL");
  const [programId, setProgramId] = useState("ALL");

  const rows = useMemo(() => {
    const all = [
      ...(practice.data ?? []).map(fromPracticeExam),
      ...(pastPapers.data ?? []).map(fromPastPaper),
    ];
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [practice.data, pastPapers.data]);

  const programs = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) map.set(row.program.id, row.program.name);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const bySubject = useMemo(
    () => (programId === "ALL" ? rows : rows.filter((r) => r.program.id === programId)),
    [rows, programId]
  );
  const visible = tab === "ALL" ? bySubject : bySubject.filter((r) => r.kind === tab);

  const stats = useMemo(() => {
    const scored = bySubject.filter(
      (r) => r.score != null && (r.status === "MARKED" || r.status === "COMPLETED")
    );
    const scores = scored.map((r) => r.score!);
    return {
      taken: bySubject.filter((r) => r.status !== "IN_PROGRESS").length,
      average: scores.length
        ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
        : 0,
      best: scores.length ? Math.max(...scores) : 0,
      awaiting: bySubject.filter((r) => r.status === "AWAITING").length,
    };
  }, [bySubject]);

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "ALL", label: "All", count: bySubject.length },
    { id: "MCQ", label: "MCQ", count: bySubject.filter((r) => r.kind === "MCQ").length },
    { id: "WRITTEN", label: "Written", count: bySubject.filter((r) => r.kind === "WRITTEN").length },
    {
      id: "PAST_PAPER",
      label: "Past papers",
      count: bySubject.filter((r) => r.kind === "PAST_PAPER").length,
    },
  ];

  const isLoading = (practice.isLoading && !practice.data) || (pastPapers.isLoading && !pastPapers.data);
  const error = practice.error ?? pastPapers.error;
  const isFetching = practice.isFetching || pastPapers.isFetching;
  const refetch = () => {
    void practice.refetch();
    void pastPapers.refetch();
  };

  if (isLoading) {
    return <PageLoader label="Loading your results..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Exam Results"
          description="Every practice exam and past paper you’ve taken — scores, marked scripts and feedback in one place."
          className="mb-0"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={isFetching}
          className="shrink-0"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4 text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Could not load all results"}
          <button type="button" className="ml-2 underline" onClick={refetch}>
            Retry
          </button>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Exams taken" value={stats.taken} icon={ClipboardCheck} tone="primary" />
        <AdminStatCard
          label="Average score"
          value={stats.average}
          icon={Award}
          tone="green"
          formatter={(v) => `${Number(v) || 0}%`}
        />
        <AdminStatCard
          label="Best score"
          value={stats.best}
          icon={Trophy}
          tone="neutral"
          formatter={(v) => `${Number(v) || 0}%`}
        />
        <AdminStatCard label="Awaiting marking" value={stats.awaiting} icon={Hourglass} tone="accent" />
      </section>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <Trophy className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-semibold text-foreground">No exam results yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Take a practice exam or past paper from any subject. Your scores and marked scripts
            will appear here.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-4">
            <Link href={ROUTES.home}>Explore subjects</Link>
          </Button>
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div role="tablist" aria-label="Filter results" className="flex flex-wrap gap-2">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                    tab === t.id
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-card text-foreground hover:border-primary/40 hover:text-primary"
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[11px]",
                      tab === t.id ? "bg-white/20" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
            {programs.length > 1 ? (
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                aria-label="Filter by subject"
                className="h-9 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="ALL">All subjects</option>
                {programs.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              No results in this filter yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {visible.map((row) => (
                <ResultRowItem key={`${row.kind}-${row.id}`} row={row} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
