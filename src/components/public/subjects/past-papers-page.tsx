"use client";

import Link from "next/link";
import { FileText, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared";
import { ROUTES } from "@/constants";
import { getPastPapersDemo } from "@/data/demo/past-papers.demo";
import { useSubjectsMenu } from "@/hooks";
import { cn } from "@/utils";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";

type Props = { programSlug: string };

export function PastPapersPage({ programSlug }: Props) {
  const { data: menu = [], isLoading } = useSubjectsMenu();
  const sessions = getPastPapersDemo(programSlug);

  const program = (() => {
    for (const category of menu) {
      for (const subject of category.subjects) {
        for (const p of subject.programs) {
          if (p.slug === programSlug) {
            return { program: p, subject, category };
          }
        }
      }
    }
    return null;
  })();

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "past-papers",
    resourceLabel: "Past Papers",
    resourceHref: ROUTES.subjectResource(programSlug, "past-papers"),
  });

  if (isLoading && !program) {
    return <PageLoader label="Loading past papers..." />;
  }

  const programName = program?.program.name ?? programSlug;

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title={`${programName} Past Papers`}
        description="Worked solutions and videos from experienced teachers. Select a session and paper to begin — MCQ papers are auto-marked; structured papers open in the questionbank-style viewer."
        icon={<FileText className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <span className="text-lg font-bold" aria-hidden>
              ⚛
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-card text-primary shadow-sm">
            <MonitorPlay className="h-6 w-6" aria-hidden />
          </div>
        </div>
      </ResourceHero>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 md:px-6 md:py-14">
        {sessions.map((block) => (
          <section key={`${block.year}-${block.session}`}>
            <p className="text-4xl font-bold text-primary md:text-5xl">{block.year}</p>
            <h2 className="mt-1 text-lg font-semibold text-primary/90">{block.session}</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {block.papers.map((paper) => (
                <PaperButton
                  key={paper.id}
                  label={paper.label}
                  kind={paper.kind}
                  href={
                    paper.kind === "MCQ"
                      ? ROUTES.student.assignments
                      : ROUTES.subjectQuestionbank(programSlug)
                  }
                />
              ))}
            </div>
          </section>
        ))}

        {!program ? (
          <p className="text-center text-sm text-muted-foreground">
            Demo papers shown. Enroll in a course to unlock full access.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PaperButton({
  label,
  kind,
  href,
}: {
  label: string;
  kind: "MCQ" | "SQ";
  href: string;
}) {
  return (
    <Button
      asChild
      variant="outline"
      className={cn(
        "h-auto min-w-[9.5rem] rounded-xl border-2 px-5 py-3 text-sm font-semibold shadow-sm transition hover:bg-primary-muted/50",
        kind === "MCQ"
          ? "border-[var(--accent-green)] text-foreground hover:border-[var(--accent-green)]"
          : "border-primary/40 text-foreground hover:border-primary"
      )}
    >
      <Link href={href}>{label}</Link>
    </Button>
  );
}
