"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { QuestionbankOverviewPage } from "@/components/public/questionbank/questionbank-overview-page";
import { MockExamsPage } from "@/components/public/subjects/mock-exams-page";
import { PastPapersPage } from "@/components/public/subjects/past-papers-page";
import { PracticeExamsPage } from "@/components/public/subjects/practice-exams-page";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useSubjectsMenu } from "@/hooks";

type Props = {
  programSlug: string;
  resourceSlug: string;
};

export function SubjectResourcePage({ programSlug, resourceSlug }: Props) {
  const { data: menu = [], isLoading } = useSubjectsMenu();

  const match = useMemo(() => {
    for (const category of menu) {
      for (const subject of category.subjects) {
        for (const program of subject.programs) {
          if (program.slug !== programSlug) continue;
          const resource = program.resources.find((r) => r.slug === resourceSlug);
          if (resource) {
            return { category, subject, program, resource };
          }
        }
      }
    }
    return null;
  }, [menu, programSlug, resourceSlug]);

  if (resourceSlug === "questionbank") {
    return <QuestionbankOverviewPage programSlug={programSlug} />;
  }

  if (resourceSlug === "past-papers") {
    return <PastPapersPage programSlug={programSlug} />;
  }

  if (resourceSlug === "practice-exams") {
    return <PracticeExamsPage programSlug={programSlug} />;
  }

  if (isLoading && !match) {
    return <PageLoader label="Loading resource..." />;
  }

  if (!match) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-accent">Resource not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={ROUTES.home}>Back home</Link>
        </Button>
      </div>
    );
  }

  if (match.resource.resourceType === "QUESTIONBANK") {
    return <QuestionbankOverviewPage programSlug={programSlug} />;
  }

  if (match.resource.resourceType === "PAST_PAPERS") {
    return <PastPapersPage programSlug={programSlug} />;
  }

  if (match.resource.resourceType === "PRACTICE_EXAMS") {
    return <PracticeExamsPage programSlug={programSlug} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href={ROUTES.home}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Home
        </Link>
      </Button>
      <p className="text-sm text-muted-foreground">
        {match.program.name} · {match.subject.name}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">{match.resource.title}</h1>
      <p className="mt-4 text-sm text-muted-foreground">This resource is coming soon.</p>
      <Button asChild className="mt-6">
        <Link href={ROUTES.subjectQuestionbank(programSlug)}>Open Questionbank</Link>
      </Button>
    </div>
  );
}

export { MockExamsPage };
