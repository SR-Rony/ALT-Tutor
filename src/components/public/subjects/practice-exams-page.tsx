"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, FileText, Layers, ListChecks, Sparkles, Timer } from "lucide-react";
import { GoldUnlockModal } from "@/components/public/questionbank/gold-unlock-modal";
import { PageLoader } from "@/components/shared";
import { ROUTES } from "@/constants";
import { usePracticeExamHistory, usePracticeExamTemplates } from "@/hooks";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import {
  PRACTICE_EXAM_CATEGORIES,
  practiceExamTypeLabel,
  type PracticeExamMode,
  type PracticeExamTemplate,
  type PracticeExamType,
} from "@/types/practice-exam.types";
import { cn } from "@/utils";
import { PracticeExamTemplateList } from "./practice-exam-template-list";
import { ResourceGridSkeleton } from "./resource-grid-skeleton";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = { programSlug: string };

const FORMAT_OPTIONS: Array<{
  id: PracticeExamMode | "ANY";
  label: string;
  hint: string;
  icon: typeof ListChecks;
}> = [
  { id: "ANY", label: "All", hint: "MCQ + Written", icon: Timer },
  { id: "MCQ", label: "MCQ", hint: "Auto-marked online", icon: ListChecks },
  { id: "WRITTEN", label: "Written", hint: "Per question or full paper", icon: FileText },
];

export function PracticeExamsPage({ programSlug }: Props) {
  const { programName, isLoading: menuLoading } = useProgramContext(programSlug);
  const { data, isLoading, isFetching, error, refetch } = usePracticeExamTemplates(programSlug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data: history = [] } = usePracticeExamHistory(programSlug);
  const [categoryFilter, setCategoryFilter] = useState<PracticeExamType>("TOPIC_QUIZ");
  const [formatFilter, setFormatFilter] = useState<PracticeExamMode | "ANY">("ANY");
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<{
    title: string;
    requiredTier: string;
  }>({ title: "", requiredTier: "GOLD" });

  const templates = useMemo(() => data?.templates ?? [], [data?.templates]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<PracticeExamType, number> = {
      TOPIC_QUIZ: 0,
      LADDER: 0,
      MOCK: 0,
    };
    for (const t of templates) {
      const type = t.type || "TOPIC_QUIZ";
      if (counts[type] !== undefined) {
        counts[type] += 1;
      } else {
        counts.TOPIC_QUIZ += 1;
      }
    }
    return counts;
  }, [templates]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const type = t.type || "TOPIC_QUIZ";
      if (type !== categoryFilter) return false;
      if (formatFilter !== "ANY" && (t.mode ?? "MCQ") !== formatFilter) return false;
      return true;
    });
  }, [templates, categoryFilter, formatFilter]);

  const formatCounts = useMemo(() => {
    const categoryTemplates = templates.filter((t) => (t.type || "TOPIC_QUIZ") === categoryFilter);
    const base = { ANY: categoryTemplates.length, MCQ: 0, WRITTEN: 0 };
    for (const t of categoryTemplates) {
      if (t.mode === "WRITTEN") base.WRITTEN += 1;
      else base.MCQ += 1;
    }
    return base;
  }, [templates, categoryFilter]);

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "practice-exams",
    resourceLabel: "Practice Exams",
    resourceHref: ROUTES.subjectResource(programSlug, "practice-exams"),
  });

  const openUnlock = (template: PracticeExamTemplate) => {
    setUnlockTarget({
      title: template.title,
      requiredTier: String(template.accessTier ?? "GOLD"),
    });
    setUnlockOpen(true);
  };

  const emptyLabel = (() => {
    const catLabel = practiceExamTypeLabel(categoryFilter);
    if (filtered.length === 0 && formatCounts.ANY === 0) {
      return `No ${catLabel} published yet for this program.`;
    }
    if (formatFilter === "MCQ") return `No MCQ ${catLabel} available right now.`;
    if (formatFilter === "WRITTEN") return `No Written ${catLabel} available right now.`;
    return `No ${catLabel} available right now.`;
  })();

  if (menuLoading && isLoading) {
    return <PageLoader label="Loading practice exams..." />;
  }

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        programSlug={programSlug}
        title={`${programName} Practice Exams`}
        description="Choose Topical Tests, Chapter-wise Tests, or full Mock Tests in MCQ or Written format."
        icon={<Timer className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      />

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 md:px-6 md:py-14">
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground md:text-2xl">Practice Exam Categories</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Select an exam category below to view and start practice exams.
              </p>
            </div>
            {isFetching ? (
              <p className="text-sm text-muted-foreground" role="status">
                Updating…
              </p>
            ) : null}
          </div>

          {/* 3 Categories Section (Topical Tests, Chapter-wise Tests, Mock Tests) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PRACTICE_EXAM_CATEGORIES.map((cat) => {
              const isSelected = categoryFilter === cat.id;
              const count = categoryCounts[cat.id] ?? 0;
              const Icon = cat.id === "TOPIC_QUIZ" ? BookOpen : cat.id === "LADDER" ? Layers : Sparkles;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    "group flex flex-col items-start justify-between rounded-2xl border p-5 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary"
                      : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                  )}
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl transition",
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-base font-bold text-foreground sm:text-lg">{cat.label}</span>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-bold",
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {count}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{cat.description}</p>
                  </div>

                  <div className="mt-4 flex w-full items-center justify-between border-t border-border/60 pt-3 text-xs font-semibold">
                    <span className={isSelected ? "font-bold text-primary" : "text-muted-foreground group-hover:text-foreground"}>
                      {isSelected ? "Active category" : "Click to view"}
                    </span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isSelected ? "translate-x-1 text-primary" : "text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground"
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sub-filters (Format: All / MCQ / Written) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div
              className="inline-flex flex-wrap rounded-2xl border border-border bg-muted/40 p-1"
              role="tablist"
              aria-label="Exam format"
            >
              {FORMAT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = formatFilter === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFormatFilter(option.id)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                      active
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    <span>{option.label}</span>
                    <span
                      className={cn(
                        "rounded-md px-1.5 text-[11px] font-bold",
                        active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {formatCounts[option.id]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Showing <strong>{filtered.length}</strong> {practiceExamTypeLabel(categoryFilter)}
            </p>
          </div>

          {error ? (
            <p className="mt-4 text-sm text-accent">
              {(error as unknown as ApiError)?.message || "Failed to load practice exams"}
            </p>
          ) : null}

          <div className="mt-4">
            {isLoading ? (
              <ResourceGridSkeleton count={3} columns="2" />
            ) : (
              <PracticeExamTemplateList
                programSlug={programSlug}
                templates={filtered}
                emptyLabel={emptyLabel}
                onUnlock={openUnlock}
              />
            )}
          </div>
        </section>

        {isAuthenticated ? (
          <section>
            <h2 className="text-lg font-bold text-foreground">Your recent attempts</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Resume in-progress exams or review submitted scores.
            </p>
            {history.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                No attempts yet — open a free template to get started.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
                {history.slice(0, 8).map((item) => {
                  const inProgress = item.status === "IN_PROGRESS";
                  const href = inProgress
                    ? ROUTES.subjectPracticeExamTake(programSlug, item.template.slug)
                    : ROUTES.subjectPracticeExamResult(
                        programSlug,
                        item.template.slug,
                        item.id
                      );
                  return (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{item.template.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.template.mode === "WRITTEN" ? "Written" : "MCQ"}
                          {" · "}
                          {item.status}
                          {item.status === "SUBMITTED" && item.score != null
                            ? ` · ${item.correctCount ?? 0}/${item.totalQuestions} (${item.score}%)`
                            : inProgress
                              ? ` · ${item.answeredCount}/${item.totalQuestions} answered`
                              : ""}
                        </p>
                      </div>
                      <Link
                        href={href}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {inProgress ? "Resume" : "View result"}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}
      </div>

      {data?.program ? (
        <GoldUnlockModal
          open={unlockOpen}
          onClose={() => setUnlockOpen(false)}
          programId={data.program.id}
          programName={data.program.name}
          programSlug={programSlug}
          subtopicTitle={unlockTarget.title}
          requiredTier={unlockTarget.requiredTier}
          onUnlocked={() => {
            void refetch();
          }}
          returnPath={`${ROUTES.subjectResource(programSlug, "practice-exams")}?unlocked=1`}
        />
      ) : null}
    </div>
  );
}
