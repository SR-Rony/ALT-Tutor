"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, BookOpen } from "lucide-react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useSubjectsMenu } from "@/hooks";
import { QuestionbankPage } from "@/components/public/questionbank";

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

  if (resourceSlug === "questionbank" || match.resource.resourceType === "QUESTIONBANK") {
    return <QuestionbankPage slug={programSlug} titleOverride={match.program.name} />;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href={ROUTES.home}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Home
        </Link>
      </Button>
      <PageHeader
        title={match.resource.title}
        description={`${match.program.name} · ${match.subject.name} · ${match.category.name}`}
        className="mb-6"
      />
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-muted text-primary">
          <BookOpen className="h-6 w-6" aria-hidden />
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This is a demo landing page for <strong>{match.resource.title}</strong>. Content and study
          tools can be connected to the curriculum and assignment systems next.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link href={ROUTES.subjectQuestionbank(programSlug)}>Open Questionbank</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.courses}>Browse courses</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
