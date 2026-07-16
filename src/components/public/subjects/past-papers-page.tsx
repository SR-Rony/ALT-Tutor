"use client";

import Link from "next/link";
import { FileText, MonitorPlay } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/store";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared";
import { queryKeys, ROUTES } from "@/constants";
import { useQbProgram } from "@/hooks/use-questionbank";
import { mcqService } from "@/services/mcq.service";
import { buildPastPaperSessions } from "@/utils/program-resource.utils";
import { cn } from "@/utils";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = { programSlug: string };

export function PastPapersPage({ programSlug }: Props) {
  const { programName, isLoading: menuLoading } = useProgramContext(programSlug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data: qbProgram, isLoading: qbLoading, isFetching } = useQbProgram(programSlug);
  const { data: mcqExams = [] } = useQuery({
    queryKey: queryKeys.mcq.mine,
    queryFn: () => mcqService.listMyExams(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const sessions = buildPastPaperSessions(programSlug, qbProgram, mcqExams, isAuthenticated);

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "past-papers",
    resourceLabel: "Past Papers",
    resourceHref: ROUTES.subjectResource(programSlug, "past-papers"),
  });

  if (menuLoading && qbLoading) {
    return <PageLoader label="Loading past papers..." />;
  }

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title={`${programName} Past Papers`}
        description="Worked solutions and videos from experienced teachers. MCQ papers open your enrolled exams; structured papers use the questionbank exam viewer."
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
        {isFetching ? (
          <p className="text-sm text-muted-foreground" role="status">
            Refreshing papers…
          </p>
        ) : null}

        {qbLoading ? (
          <PageLoader label="Loading question sets..." className="min-h-[200px]" />
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No past papers available for this program yet.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={ROUTES.subjectQuestionbank(programSlug)}>Open Questionbank</Link>
            </Button>
          </div>
        ) : (
          sessions.map((block) => (
            <section key={`${block.year}-${block.session}`}>
              <p className="text-3xl font-bold text-primary sm:text-4xl md:text-5xl">{block.year}</p>
              <h2 className="mt-1 text-base font-semibold text-primary/90 sm:text-lg">
                {block.session}
              </h2>
              <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">
                {block.papers.map((paper) => (
                  <PaperButton
                    key={`${block.year}-${paper.id}`}
                    label={paper.label}
                    kind={paper.kind}
                    href={paper.href}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        {!isAuthenticated ? (
          <p className="text-center text-sm text-muted-foreground">
            <Link href={ROUTES.auth.login} className="font-semibold text-primary hover:underline">
              Sign in
            </Link>{" "}
            to access MCQ past papers from your enrolled courses.
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
        "h-auto min-w-0 flex-1 rounded-xl border-2 px-3 py-2.5 text-xs font-semibold shadow-sm transition hover:bg-primary-muted/50 sm:min-w-[9.5rem] sm:flex-none sm:px-5 sm:py-3 sm:text-sm",
        kind === "MCQ"
          ? "border-[var(--accent-green)] text-foreground hover:border-[var(--accent-green)]"
          : "border-primary/40 text-foreground hover:border-primary"
      )}
    >
      <Link href={href}>{label}</Link>
    </Button>
  );
}
