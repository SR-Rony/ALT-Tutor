"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, HelpCircle, Lock, Timer } from "lucide-react";
import { GoldUnlockModal } from "@/components/public/questionbank/gold-unlock-modal";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { usePracticeExamTemplate } from "@/hooks";
import { normalizeAccessBadge, tierBadgeClass, tierLabel } from "@/lib/access-tier";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import { cn } from "@/utils";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = {
  programSlug: string;
  templateSlug: string;
};

export function PracticeExamDetailPage({ programSlug, templateSlug }: Props) {
  const { programName, isLoading: menuLoading } = useProgramContext(programSlug);
  const { data, isLoading, error, refetch } = usePracticeExamTemplate(programSlug, templateSlug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [unlockOpen, setUnlockOpen] = useState(false);

  const template = data?.template;
  const locked = Boolean(template?.locked);
  const badge = normalizeAccessBadge(template?.accessTier);

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "practice-exams",
    resourceLabel: "Practice Exams",
    resourceHref: ROUTES.subjectResource(programSlug, "practice-exams"),
    topicLabel: template?.title ?? "Exam",
  });

  if ((menuLoading && isLoading) || (isLoading && !template)) {
    return <PageLoader label="Loading exam..." />;
  }

  if (error || !template) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Practice exam not found"}
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href={ROUTES.subjectResource(programSlug, "practice-exams")}>
            Back to Practice Exams
          </Link>
        </Button>
      </div>
    );
  }

  const loginHref = `${ROUTES.auth.login}?next=${encodeURIComponent(
    ROUTES.subjectPracticeExam(programSlug, templateSlug)
  )}`;

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title={template.title}
        subtitle={`${programName} · ${template.typeLabel ?? template.type}`}
        description={
          template.description ||
          "Timed practice pulled from the Questionbank. Mark schemes stay hidden until you submit."
        }
        icon={<Timer className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase text-white",
              tierBadgeClass(badge)
            )}
          >
            {badge !== "FREE" ? <Lock className="h-3 w-3" aria-hidden /> : null}
            {tierLabel(badge)}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card px-3 py-1 text-xs font-semibold">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden />
            {template.totalQuestions} questions
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card px-3 py-1 text-xs font-semibold">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {template.durationMin} mins
          </span>
          {template.passMarkPercent != null ? (
            <span className="rounded-full border border-primary/15 bg-card px-3 py-1 text-xs font-semibold">
              Pass {template.passMarkPercent}%
            </span>
          ) : null}
        </div>
      </ResourceHero>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 md:px-6">
        {template.blueprintSummary?.length ? (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Blueprint
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-foreground">
              {template.blueprintSummary.map((rule, index) => (
                <li key={index} className="flex flex-wrap gap-x-2">
                  <span className="font-semibold">{rule.count}×</span>
                  <span>{rule.difficulty || "any difficulty"}</span>
                  <span className="text-muted-foreground">
                    {rule.subtopicId
                      ? "· scoped subtopic"
                      : rule.topicId
                        ? "· scoped topic"
                        : "· any topic"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-base font-bold text-foreground">Ready to start?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The timed exam runner (countdown, answer save, auto-submit, results) ships in the next
            step. This template is live in the API — start will wire there next.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {locked ? (
              <Button
                type="button"
                size="pill"
                className="border-[#d4a017]/50 bg-[#fff8ef] text-[#9a3412] hover:bg-[#fff1df]"
                onClick={() => setUnlockOpen(true)}
              >
                <Lock className="h-4 w-4" aria-hidden />
                Unlock {tierLabel(badge)}
              </Button>
            ) : !isAuthenticated ? (
              <Button asChild size="pill">
                <Link href={loginHref}>Log in to start</Link>
              </Button>
            ) : (
              <Button type="button" size="pill" disabled title="Timed runner lands in Step 2.6">
                Start Exam (next step)
              </Button>
            )}
            <Button asChild variant="outline" size="pill">
              <Link href={ROUTES.subjectResource(programSlug, "practice-exams")}>
                All practice exams
              </Link>
            </Button>
          </div>
        </section>
      </div>

      {data?.program ? (
        <GoldUnlockModal
          open={unlockOpen}
          onClose={() => setUnlockOpen(false)}
          programId={data.program.id}
          programName={data.program.name}
          programSlug={programSlug}
          subtopicTitle={template.title}
          requiredTier={String(template.accessTier)}
          onUnlocked={() => {
            void refetch();
          }}
          returnPath={ROUTES.subjectPracticeExam(programSlug, templateSlug)}
        />
      ) : null}
    </div>
  );
}
