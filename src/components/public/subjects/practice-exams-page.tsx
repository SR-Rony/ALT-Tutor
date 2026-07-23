"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardList, Globe, Layers, Timer } from "lucide-react";
import { GoldUnlockModal } from "@/components/public/questionbank/gold-unlock-modal";
import { PageLoader } from "@/components/shared";
import { ROUTES } from "@/constants";
import { usePracticeExamHistory, usePracticeExamTemplates } from "@/hooks";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import type { PracticeExamTemplate, PracticeExamType } from "@/types/practice-exam.types";
import { cn } from "@/utils";
import { PracticeExamTemplateList } from "./practice-exam-template-list";
import { ResourceGridSkeleton } from "./resource-grid-skeleton";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = { programSlug: string };

type TypeFilter = "ALL" | PracticeExamType;

const TYPE_FILTERS: Array<{ id: TypeFilter; label: string; icon: typeof Timer }> = [
  { id: "ALL", label: "All", icon: Timer },
  { id: "TOPIC_QUIZ", label: "Topic Quizzes", icon: ClipboardList },
  { id: "LADDER", label: "Revision Ladder", icon: Layers },
  { id: "MOCK", label: "Mock Exams", icon: Timer },
];

export function PracticeExamsPage({ programSlug }: Props) {
  const { programName, isLoading: menuLoading } = useProgramContext(programSlug);
  const { data, isLoading, isFetching, error, refetch } = usePracticeExamTemplates(programSlug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data: history = [] } = usePracticeExamHistory(programSlug);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<{
    title: string;
    requiredTier: string;
  }>({ title: "", requiredTier: "GOLD" });

  const templates = data?.templates ?? [];
  const filtered = useMemo(() => {
    if (typeFilter === "ALL") return templates;
    return templates.filter((t) => t.type === typeFilter);
  }, [templates, typeFilter]);

  const counts = useMemo(() => {
    const base = { ALL: templates.length, TOPIC_QUIZ: 0, MOCK: 0, LADDER: 0 };
    for (const t of templates) base[t.type] += 1;
    return base;
  }, [templates]);

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

  if (menuLoading && isLoading) {
    return <PageLoader label="Loading practice exams..." />;
  }

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title={`${programName} Practice Exams`}
        description="Timed Topic Quizzes, Revision Ladders, and Mock Exams — pulled from the Questionbank with auto-marking after you submit."
        icon={<Timer className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      />

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 md:px-6 md:py-14">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground md:text-2xl">Choose an exam</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Published templates for this program. Locked ones need a Practice Pass or course access.
              </p>
            </div>
            {isFetching ? (
              <p className="text-sm text-muted-foreground" role="status">
                Updating…
              </p>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {TYPE_FILTERS.map((filter) => {
              const Icon = filter.icon;
              const active = typeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setTypeFilter(filter.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition",
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
                    {counts[filter.id]}
                  </span>
                </button>
              );
            })}
            <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-3 py-1.5 text-sm font-semibold text-muted-foreground opacity-70">
              <Globe className="h-4 w-4" aria-hidden />
              Prediction · Coming soon
            </span>
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
                emptyLabel={
                  typeFilter === "ALL"
                    ? "No practice exams published yet for this program."
                    : `No ${TYPE_FILTERS.find((f) => f.id === typeFilter)?.label ?? "exams"} published yet.`
                }
                onUnlock={openUnlock}
              />
            )}
          </div>

          {typeFilter === "MOCK" && filtered.length > 0 ? (
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
