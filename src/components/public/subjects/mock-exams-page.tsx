"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, HelpCircle, ListOrdered, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared";
import { ROUTES } from "@/constants";
import { getMockExamSets } from "@/data/demo/practice-exams.demo";
import { useSubjectsMenu } from "@/hooks";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";

type Props = { programSlug: string };

export function MockExamsPage({ programSlug }: Props) {
  const { data: menu = [], isLoading } = useSubjectsMenu();
  const sets = getMockExamSets(programSlug);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [difficulty, setDifficulty] = useState<Set<string>>(new Set(["MEDIUM"]));
  const [view, setView] = useState<"ALL" | "COMPLETE" | "INCOMPLETE">("ALL");

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
    topicLabel: "Mock Exams",
  });

  if (isLoading && !program) {
    return <PageLoader label="Loading mock exams..." />;
  }

  const programName = program?.name ?? programSlug;

  const toggleDifficulty = (d: string) => {
    setDifficulty((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title={`${programName} - Mock Exams`}
        subtitle="Mock Exam Set 1 — Paper 2"
        description="Trial examinations with a stopwatch, hidden mark schemes during the exam, and full solutions after submission."
        icon={<Clock className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
            Paper 2
          </span>
          <Badge icon={<HelpCircle className="h-3.5 w-3.5" />} label="6 questions" />
          <Badge icon={<Clock className="h-3.5 w-3.5" />} label="90 mins" />
          <Badge icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="51 marks" />
        </div>
      </ResourceHero>

      <div className="sticky top-16 z-30 border-b border-primary/10 bg-primary-muted/40 lg:top-[4.5rem]">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Filters
            </button>
            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <ListOrdered className="h-4 w-4" />
              Go to Question
            </button>
          </div>

          {filtersOpen ? (
            <div className="mt-3 rounded-xl border border-primary/15 bg-primary-muted/70 p-4">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Difficulty
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {["Easy", "Medium", "Hard"].map((d) => (
                      <label key={d} className="inline-flex cursor-pointer items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={difficulty.has(d.toUpperCase())}
                          onChange={() => toggleDifficulty(d.toUpperCase())}
                        />
                        {d}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    View
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {(["ALL", "COMPLETE", "INCOMPLETE"] as const).map((v) => (
                      <label key={v} className="inline-flex cursor-pointer items-center gap-1.5 text-sm">
                        <input
                          type="radio"
                          name="mock-view"
                          className="h-4 w-4 accent-primary"
                          checked={view === v}
                          onChange={() => setView(v)}
                        />
                        {v === "ALL" ? "All" : v === "COMPLETE" ? "Complete" : "Incomplete"}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 md:px-6">
        {sets.map((set) => (
          <article
            key={set.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div>
              <h3 className="text-lg font-bold text-foreground">{set.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {set.paper} · {set.questionCount} questions · {set.durationMins} mins · {set.totalMarks}{" "}
                marks
              </p>
            </div>
            <Button asChild size="pill">
              <Link
                href={ROUTES.subjectQuestionbankStudyExam(programSlug, "a1-kinematics", {
                  paper: "PAPER_2",
                })}
              >
                Start Exam
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}

function Badge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card px-3 py-1 text-xs font-semibold text-foreground">
      {icon}
      {label}
    </span>
  );
}
