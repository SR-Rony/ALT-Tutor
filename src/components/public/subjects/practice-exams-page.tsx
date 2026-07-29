"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, FileText, Globe, Layers, ListChecks, Timer } from "lucide-react";
import { GoldUnlockModal } from "@/components/public/questionbank/gold-unlock-modal";
import { PageLoader } from "@/components/shared";
import { ROUTES } from "@/constants";
import { usePracticeExamHistory, usePracticeExamTemplates } from "@/hooks";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import type {
  PracticeExamMode,
  PracticeExamTemplate,
  PracticeExamType,
} from "@/types/practice-exam.types";
import { cn } from "@/utils";
import { PracticeExamTemplateList } from "./practice-exam-template-list";
import { ResourceGridSkeleton } from "./resource-grid-skeleton";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = { programSlug: string };

type StyleFilter = PracticeExamType | null;

const STYLE_FILTERS: Array<{
  id: PracticeExamType;
  label: string;
  hint: string;
  icon: typeof Timer;
}> = [
  { id: "TOPIC_QUIZ", label: "Topic Quizzes", hint: "Short practice by topic", icon: ClipboardList },
  { id: "LADDER", label: "Revision Ladder", hint: "Step-by-step revision", icon: Layers },
  { id: "MOCK", label: "Mock Exams", hint: "Full timed mocks", icon: Timer },
];

const FORMAT_OPTIONS: Array<{
  id: PracticeExamMode | "ANY";
  label: string;
  hint: string;
  icon: typeof ListChecks;
}> = [
  { id: "ANY", label: "Any", hint: "MCQ + Written", icon: Globe },
  { id: "MCQ", label: "MCQ", hint: "Auto-marked", icon: ListChecks },
  { id: "WRITTEN", label: "Written", hint: "Download & upload", icon: FileText },
];

export function PracticeExamsPage({ programSlug }: Props) {
  const { programName, isLoading: menuLoading } = useProgramContext(programSlug);
  const { data, isLoading, isFetching, error, refetch } = usePracticeExamTemplates(programSlug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data: history = [] } = usePracticeExamHistory(programSlug);
  const [styleFilter, setStyleFilter] = useState<StyleFilter>(null);
  const [formatFilter, setFormatFilter] = useState<PracticeExamMode | "ANY">("ANY");
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<{
    title: string;
    requiredTier: string;
  }>({ title: "", requiredTier: "GOLD" });

  const templates = data?.templates ?? [];

  const byFormat = useMemo(() => {
    if (formatFilter === "ANY") return templates;
    return templates.filter((t) => (t.mode ?? "MCQ") === formatFilter);
  }, [templates, formatFilter]);

  const filtered = useMemo(() => {
    if (!styleFilter) return byFormat;
    return byFormat.filter((t) => t.type === styleFilter);
  }, [byFormat, styleFilter]);

  const formatCounts = useMemo(() => {
    const base = { ANY: templates.length, MCQ: 0, WRITTEN: 0 };
    for (const t of templates) {
      if (t.mode === "WRITTEN") base.WRITTEN += 1;
      else base.MCQ += 1;
    }
    return base;
  }, [templates]);

  const styleCounts = useMemo(() => {
    const base = { TOPIC_QUIZ: 0, MOCK: 0, LADDER: 0 };
    for (const t of byFormat) base[t.type] += 1;
    return base;
  }, [byFormat]);

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
    if (filtered.length === 0 && templates.length === 0) {
      return "No practice exams published yet for this program.";
    }
    const formatBit =
      formatFilter === "ANY" ? "" : formatFilter === "MCQ" ? " MCQ" : " Written";
    const styleBit = styleFilter
      ? STYLE_FILTERS.find((f) => f.id === styleFilter)?.label.toLowerCase()
      : "exams";
    return `No${formatBit} ${styleBit ?? "exams"} available right now. Try another filter.`;
  })();

  if (menuLoading && isLoading) {
    return <PageLoader label="Loading practice exams..." />;
  }

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title={`${programName} Practice Exams`}
        description="MCQ exams are auto-marked. Written exams let you download the paper and upload your answers."
        icon={<Timer className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      />

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 md:px-6 md:py-14">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground md:text-2xl">Choose an exam</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Start with format, then pick a quiz, ladder, or mock. Locked exams need a Practice Pass
                or course access.
              </p>
            </div>
            {isFetching ? (
              <p className="text-sm text-muted-foreground" role="status">
                Updating…
              </p>
            ) : null}
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Format
              </p>
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
              <p className="mt-2 text-xs text-muted-foreground">
                {FORMAT_OPTIONS.find((o) => o.id === formatFilter)?.hint}
              </p>
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Exam style
                </p>
                {styleFilter ? (
                  <button
                    type="button"
                    onClick={() => setStyleFilter(null)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Show all styles
                  </button>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {STYLE_FILTERS.map((filter) => {
                  const Icon = filter.icon;
                  const active = styleFilter === filter.id;
                  const count = styleCounts[filter.id];
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setStyleFilter(active ? null : filter.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      {filter.label}
                      <span
                        className={cn(
                          "rounded-full px-1.5 text-[11px]",
                          active ? "bg-white/20" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
                <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-3.5 py-2 text-sm font-semibold text-muted-foreground opacity-70">
                  <Globe className="h-4 w-4" aria-hidden />
                  Prediction · Soon
                </span>
              </div>
            </div>
          </div>

          {error ? (
            <p className="mt-4 text-sm text-accent">
              {(error as unknown as ApiError)?.message || "Failed to load practice exams"}
            </p>
          ) : null}

          <div className="mt-6">
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

          {styleFilter === "MOCK" && filtered.length > 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Prefer a dedicated mock list?{" "}
              <Link
                href={ROUTES.subjectPracticeMockExams(programSlug)}
                className="font-semibold text-primary hover:underline"
              >
                Open Mock Exams
              </Link>
            </p>
          ) : null}
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
