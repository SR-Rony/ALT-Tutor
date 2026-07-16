"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, ClipboardList, Globe, Layers, Timer } from "lucide-react";
import { PageLoader } from "@/components/shared";
import { ROUTES } from "@/constants";
import { getPracticeExamCards } from "@/data/demo/practice-exams.demo";
import { useSubjectsMenu } from "@/hooks";
import { cn } from "@/utils";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";

type Props = { programSlug: string };

const CARD_ICONS: Record<string, ReactNode> = {
  "topic-quizzes": <ClipboardList className="h-8 w-8" aria-hidden />,
  "revision-ladder": <Layers className="h-8 w-8" aria-hidden />,
  "mock-exams": <Timer className="h-8 w-8" aria-hidden />,
  prediction: <Globe className="h-8 w-8" aria-hidden />,
};

export function PracticeExamsPage({ programSlug }: Props) {
  const { data: menu = [], isLoading } = useSubjectsMenu();
  const cards = getPracticeExamCards(programSlug);

  const program = (() => {
    for (const category of menu) {
      for (const subject of category.subjects) {
        for (const p of subject.programs) {
          if (p.slug === programSlug) return p;
        }
      }
    }
    return null;
  })();

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "practice-exams",
    resourceLabel: "Practice Exams",
    resourceHref: ROUTES.subjectResource(programSlug, "practice-exams"),
  });

  if (isLoading && !program) {
    return <PageLoader label="Loading practice exams..." />;
  }

  const programName = program?.name ?? programSlug;

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title={`${programName} Practice Exams`}
        description="Topic Quizzes, Revision Ladder, and Mock Exams — timed practice with auto-marking for MCQ and mark schemes unlocked after submission."
        icon={<Timer className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <h2 className="text-xl font-bold text-foreground md:text-2xl">Choose Revision Type</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const inner = (
              <article
                className={cn(
                  "group relative flex h-full min-h-[11rem] flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_8px_24px_-16px_rgba(24,119,242,0.12)] transition",
                  card.disabled
                    ? "cursor-not-allowed opacity-50"
                    : "hover:border-primary/30 hover:shadow-[0_12px_32px_-14px_rgba(24,119,242,0.2)]"
                )}
              >
                <div
                  className={cn(
                    "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl",
                    card.iconBg
                  )}
                >
                  {CARD_ICONS[card.id]}
                </div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary">
                  {card.title}
                </h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{card.subtitle}</p>
                {!card.disabled ? (
                  <ChevronDown
                    className="mt-3 h-5 w-5 text-muted-foreground transition group-hover:text-primary"
                    aria-hidden
                  />
                ) : (
                  <span className="mt-3 text-xs font-medium text-muted-foreground">Coming soon</span>
                )}
              </article>
            );

            if (card.disabled || !card.href) {
              return <div key={card.id}>{inner}</div>;
            }

            return (
              <Link key={card.id} href={card.href} className="block h-full">
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
