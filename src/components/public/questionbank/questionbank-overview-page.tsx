"use client";

import Link from "next/link";
import { ArrowUp, Home, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared";
import { ROUTES } from "@/constants";
import { useQbProgram } from "@/hooks/use-questionbank";
import type { ApiError } from "@/types";
import { cn } from "@/utils";

type Props = { programSlug: string };

export function QuestionbankOverviewPage({ programSlug }: Props) {
  const { data, isLoading, error } = useQbProgram(programSlug);
  const [showTop, setShowTop] = useState(false);

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

  return (
    <div className="bg-background">
      <div className="border-b border-border bg-gradient-to-b from-primary-muted/70 to-background">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Link href={ROUTES.home} className="hover:text-primary">
              <Home className="h-4 w-4" />
            </Link>
            <span>/</span>
            <span>{data.subject.category.name}</span>
            <span>/</span>
            <span>{data.subject.name}</span>
            <span>/</span>
            <span className="font-medium text-foreground">{data.name}</span>
            <span>/</span>
            <span className="font-medium text-foreground">Questionbank</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {data.name} Questionbank
          </h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Topic-sorted practice with Easy, Medium, and Hard filters. Open a study set to practice
            with mark schemes.
          </p>
          <Button asChild size="pill" className="mt-6">
            <Link href={ROUTES.auth.register}>
              <Sparkles className="h-4 w-4" />
              Generate my Exam
            </Link>
          </Button>
        </div>

        <div className="border-t border-border/80 bg-primary-muted/50">
          <div className="mx-auto flex max-w-7xl gap-0 overflow-x-auto px-4 md:px-6">
            {data.qbTopics.map((topic, index) => (
              <a
                key={topic.id}
                href={`#topic-${topic.number}`}
                className={cn(
                  "shrink-0 whitespace-nowrap px-4 py-3.5 text-sm font-medium text-foreground/80 hover:text-primary",
                  index > 0 && "border-l border-border"
                )}
              >
                Theme {String.fromCharCode(64 + topic.number)}: {topic.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 md:px-6 md:py-16">
        {data.qbTopics.length === 0 ? (
          <p className="text-center text-muted-foreground">No topics yet for this questionbank.</p>
        ) : null}
        {data.qbTopics.map((topic) => (
          <section key={topic.id} id={`topic-${topic.number}`} className="scroll-mt-28">
            <p className="text-sm font-medium text-primary">Theme {String.fromCharCode(64 + topic.number)}</p>
            <h2 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">{topic.title}</h2>
            {topic.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{topic.description}</p>
            ) : null}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {topic.subtopics.map((sub) => (
                <article
                  key={sub.id}
                  className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_8px_24px_-16px_rgba(24,119,242,0.18)]"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-foreground">{sub.title}</h3>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase text-white",
                        String(sub.badge).toUpperCase() === "GOLD" ? "bg-[#d4a017]" : "bg-primary"
                      )}
                    >
                      {String(sub.badge).toUpperCase() === "GOLD" ? "ALT Gold" : "ALT Free"}
                    </span>
                  </div>
                  <p className="mb-2 flex-1 text-sm text-muted-foreground">{sub.description}</p>
                  <p className="mb-4 text-xs font-medium text-muted-foreground">
                    {sub._count?.questions ?? 0} questions
                  </p>
                  <Button asChild variant="outline" size="pill" className="w-full">
                    <Link href={ROUTES.subjectQuestionbankStudy(programSlug, sub.slug)}>
                      Open Study
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {showTop ? (
        <button
          type="button"
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card shadow-lg hover:text-primary"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}
