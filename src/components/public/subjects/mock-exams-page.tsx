"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Clock, HelpCircle } from "lucide-react";
import { GoldUnlockModal } from "@/components/public/questionbank/gold-unlock-modal";
import { PageLoader } from "@/components/shared";
import { ROUTES } from "@/constants";
import { usePracticeExamTemplates } from "@/hooks";
import type { ApiError } from "@/types";
import type { PracticeExamTemplate } from "@/types/practice-exam.types";
import { PracticeExamTemplateList } from "./practice-exam-template-list";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = { programSlug: string };

export function MockExamsPage({ programSlug }: Props) {
  const { programName, isLoading: menuLoading } = useProgramContext(programSlug);
  const { data, isLoading, isFetching, error, refetch } = usePracticeExamTemplates(programSlug);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<{
    title: string;
    requiredTier: string;
  }>({ title: "", requiredTier: "GOLD" });

  const mocks = useMemo(
    () => (data?.templates ?? []).filter((t) => t.type === "MOCK"),
    [data?.templates]
  );

  const summary = useMemo(() => {
    if (mocks.length === 0) {
      return { questionCount: 0, durationMins: 0, count: 0 };
    }
    return {
      count: mocks.length,
      questionCount: Math.max(...mocks.map((m) => m.totalQuestions)),
      durationMins: Math.max(...mocks.map((m) => m.durationMin)),
    };
  }, [mocks]);

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "practice-exams",
    resourceLabel: "Practice Exams",
    resourceHref: ROUTES.subjectResource(programSlug, "practice-exams"),
    topicLabel: "Mock Exams",
  });

  const openUnlock = (template: PracticeExamTemplate) => {
    setUnlockTarget({
      title: template.title,
      requiredTier: String(template.accessTier ?? "GOLD"),
    });
    setUnlockOpen(true);
  };

  if (menuLoading && isLoading) {
    return <PageLoader label="Loading mock exams..." />;
  }

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title={`${programName} - Mock Exams`}
        subtitle={
          summary.count > 0
            ? `${summary.count} published mock${summary.count === 1 ? "" : "s"}`
            : "Trial examinations"
        }
        description="Full-length trial papers with a stopwatch, hidden mark schemes during the exam, and solutions after submission."
        icon={<Clock className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge icon={<HelpCircle className="h-3.5 w-3.5" />} label={`${summary.questionCount || "—"} Q max`} />
          <Badge icon={<Clock className="h-3.5 w-3.5" />} label={`${summary.durationMins || "—"} mins max`} />
        </div>
      </ResourceHero>

      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 md:px-6">
        {isFetching ? (
          <p className="text-xs text-muted-foreground" role="status">
            Updating…
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-accent">
            {(error as unknown as ApiError)?.message || "Failed to load mock exams"}
          </p>
        ) : null}
        {isLoading ? (
          <PageLoader label="Loading mock exam sets..." className="min-h-[180px]" />
        ) : (
          <PracticeExamTemplateList
            programSlug={programSlug}
            templates={mocks}
            emptyLabel="No mock exams published yet for this program."
            onUnlock={openUnlock}
          />
        )}
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
          returnPath={ROUTES.subjectPracticeMockExams(programSlug)}
        />
      ) : null}
    </div>
  );
}

function Badge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground sm:px-3 sm:text-xs">
      {icon}
      {label}
    </span>
  );
}
