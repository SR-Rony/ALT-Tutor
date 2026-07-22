"use client";

import Link from "next/link";
import { ArrowUp, Database, Lock, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared";
import { ROUTES } from "@/constants";
import {
  ResourceHero,
  SubjectBreadcrumbNav,
  useSubjectBreadcrumbs,
} from "@/components/public/subjects";
import { useQbProgram } from "@/hooks/use-questionbank";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import { cn } from "@/utils";

type Props = { programSlug: string };

export function QuestionbankOverviewPage({ programSlug }: Props) {
  const { data, isLoading, error, isFetching } = useQbProgram(programSlug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [showTop, setShowTop] = useState(false);
  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "questionbank",
    resourceLabel: "Questionbank",
    resourceHref: ROUTES.subjectQuestionbank(programSlug),
  });

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isLoading) return <PageLoader label="Loading questionbank..." />;

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Questionbank not found."}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={ROUTES.home}>Back home</Link>
        </Button>
      </div>
    );
  }

  const practicePassHref = isAuthenticated
    ? ROUTES.student.practicePass
    : `${ROUTES.auth.login}?next=${encodeURIComponent(ROUTES.student.practicePass)}`;

  const themeTabs = (
    <div className="mx-auto flex max-w-7xl gap-0 overflow-x-auto px-4 md:px-6">
      {data.qbTopics.map((topic, index) => (
        <a
          key={topic.id}
          href={`#topic-${topic.number}`}
          className={cn(
            "shrink-0 whitespace-nowrap border-b-2 border-transparent px-5 py-3.5 text-sm font-semibold text-foreground/75 transition hover:border-primary hover:text-primary",
            index > 0 && "border-l border-primary/10"
          )}
        >
          Theme {String.fromCharCode(64 + topic.number)}: {topic.title}
        </a>
      ))}
    </div>
  );

  return (
    <div className="bg-background">
      <ResourceHero
        title={`${data.name} Questionbank`}
        description="ALT Free topics are open to practice. ALT Gold topics unlock with a Practice Pass or a linked course enrollment."
        icon={<Database className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
        footer={themeTabs}
      >
        <Button asChild size="pill">
          <Link href={practicePassHref}>
            <Sparkles className="h-4 w-4" />
            Get Practice Pass
          </Link>
        </Button>
      </ResourceHero>

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 md:px-6 md:py-16">
        {isFetching ? (
          <p className="text-sm text-muted-foreground" role="status">
            Refreshing topics…
          </p>
        ) : null}
        {data.access && !data.access.canStudyGold ? (
          <div className="rounded-xl border border-[#f5d0a8] bg-[#fff8ef] px-4 py-3 text-sm text-[#9a3412]">
            <span className="font-semibold">ALT Gold locked.</span> Unlock every Gold study set with a{" "}
            <Link href={practicePassHref} className="font-semibold underline underline-offset-2">
              Practice Pass
            </Link>{" "}
            or by enrolling in a linked course.
          </div>
        ) : null}
        {data.qbTopics.length === 0 ? (
          <p className="text-center text-muted-foreground">No topics yet for this questionbank.</p>
        ) : null}
        {data.qbTopics.map((topic) => (
          <section key={topic.id} id={`topic-${topic.number}`} className="scroll-mt-28">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Theme {String.fromCharCode(64 + topic.number)}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">{topic.title}</h2>
            {topic.description ? (
              <RichTextContent html={topic.description} className="mt-2 text-sm text-muted-foreground" />
            ) : null}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {topic.subtopics.map((sub) => {
                const isGold = String(sub.badge).toUpperCase() === "GOLD";
                const locked = Boolean(sub.locked) || (isGold && data.access && !data.access.canStudyGold);
                const studyHref = ROUTES.subjectQuestionbankStudy(programSlug, sub.slug);

                return (
                  <article
                    key={sub.id}
                    className={cn(
                      "group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-[0_8px_24px_-16px_rgba(24,119,242,0.15)] transition",
                      locked
                        ? "border-[#f5d0a8] hover:border-[#d4a017]/60"
                        : "border-border hover:border-primary/30 hover:shadow-[0_12px_32px_-14px_rgba(24,119,242,0.22)]"
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3
                        className={cn(
                          "text-base font-bold text-foreground",
                          !locked && "group-hover:text-primary"
                        )}
                      >
                        {sub.title}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase text-white",
                          isGold ? "bg-[#d4a017]" : "bg-primary"
                        )}
                      >
                        {isGold ? <Lock className="h-3 w-3" aria-hidden /> : null}
                        {isGold ? "ALT Gold" : "ALT Free"}
                      </span>
                    </div>
                    <RichTextContent
                      html={sub.description}
                      className="mb-2 flex-1 text-sm text-muted-foreground"
                    />
                    <p className="mb-4 text-xs font-medium text-muted-foreground">
                      {sub._count?.questions ?? 0} questions
                      {locked ? " · Practice Pass / course required" : ""}
                    </p>
                    {locked ? (
                      <Button asChild variant="outline" size="pill" className="w-full border-[#d4a017]/50 text-[#9a3412]">
                        <Link href={practicePassHref}>
                          <Lock className="h-3.5 w-3.5" aria-hidden />
                          Unlock with Practice Pass
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="outline" size="pill" className="w-full border-primary/30">
                        <Link href={studyHref}>Open Study</Link>
                      </Button>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {showTop ? (
        <button
          type="button"
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-card text-primary shadow-lg hover:bg-primary-muted"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}
