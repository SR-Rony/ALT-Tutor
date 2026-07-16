"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock3, Lock, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared";
import { ROUTES } from "@/constants";
import { useQbProgram } from "@/hooks/use-questionbank";
import { buildKeyConceptSections } from "@/utils/program-resource.utils";
import { ResourceGridSkeleton } from "./resource-grid-skeleton";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = { programSlug: string };

export function KeyConceptsPage({ programSlug }: Props) {
  const { programName, isLoading: menuLoading } = useProgramContext(programSlug);
  const { data: qbProgram, isLoading: qbLoading, isFetching } = useQbProgram(programSlug);
  const sections = buildKeyConceptSections(programSlug, qbProgram);

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "key-concepts",
    resourceLabel: "Key Concepts",
    resourceHref: ROUTES.subjectResource(programSlug, "key-concepts"),
  });

  if (menuLoading && qbLoading) {
    return <PageLoader label="Loading key concepts..." />;
  }

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title={`${programName} Key Concepts`}
        description="Short, focused lessons for each chapter and topic — linked to your live questionbank study sets."
        icon={<PlayCircle className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      >
        <div className="rounded-xl border border-accent/20 bg-card px-3 py-2 text-xs font-semibold text-accent">
          <Lock className="mr-1 inline h-3.5 w-3.5" />
          No download / screenshot lock enabled
        </div>
      </ResourceHero>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 md:px-6 md:py-14">
        {isFetching ? (
          <p className="text-sm text-muted-foreground" role="status">
            Refreshing lessons…
          </p>
        ) : null}

        {qbLoading ? (
          <ResourceGridSkeleton count={4} columns="4" />
        ) : sections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No key concept topics yet. Study sets will appear here from the questionbank.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href={ROUTES.subjectQuestionbank(programSlug)}>Open Questionbank</Link>
            </Button>
          </div>
        ) : (
          sections.map((section) => (
            <section key={section.id}>
              <h2 className="text-lg font-bold text-foreground sm:text-xl md:text-2xl">
                {section.chapterTitle}
              </h2>
              <p className="mt-1 text-sm font-semibold text-primary">{section.topicTitle}</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {section.videos.map((video) => (
                  <article
                    key={video.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_24px_-16px_rgba(24,119,242,0.16)] transition hover:border-primary/30 hover:shadow-[0_12px_30px_-14px_rgba(24,119,242,0.24)]"
                  >
                    <div className="relative h-28 w-full bg-primary-muted sm:h-32">
                      <Image src={video.thumbnail} alt={video.title} fill className="object-cover" />
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold text-foreground">
                        {video.title}
                      </h3>
                      <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden />
                        {video.duration}
                      </p>
                      <Button
                        asChild
                        size="pill"
                        variant="outline"
                        className="mt-4 w-full border-primary/30"
                      >
                        <Link href={video.href}>Open study set</Link>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
