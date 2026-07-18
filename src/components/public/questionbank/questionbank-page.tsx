"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUp,
  BookOpen,
  ChevronDown,
  HelpCircle,
  Home,
  Lock,
  Plus,
  Sparkles,
  SquareSigma,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared";
import { ROUTES } from "@/constants";
import { getQuestionbankBySlug } from "@/data/mock/questionbank.mock";
import { useCourseDetail } from "@/hooks";
import { useAppSelector } from "@/store";
import type { QuestionbankBadge, QuestionbankTopic } from "@/types/questionbank.types";
import { cn } from "@/utils";

type Props = { slug: string; titleOverride?: string };

function BadgePill({ badge }: { badge?: QuestionbankBadge }) {
  if (!badge) return null;
  const isGold = badge === "gold";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
        isGold ? "bg-[#d4a017]" : "bg-primary"
      )}
    >
      <Lock className="h-3 w-3" aria-hidden />
      {isGold ? "ALT Gold" : "ALT Free"}
    </span>
  );
}

function TopicCard({
  title,
  description,
  badge,
  href,
}: {
  title: string;
  description: string;
  badge?: QuestionbankBadge;
  href: string;
}) {
  return (
    <article className="relative flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_8px_24px_-16px_rgba(24,119,242,0.2)]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <BadgePill badge={badge} />
      </div>
      <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <Button asChild variant="outline" size="pill" className="w-full border-foreground/20">
        <Link href={href}>Open Study</Link>
      </Button>
    </article>
  );
}

function TopicSection({
  topic,
  slug,
  isAuthenticated,
}: {
  topic: QuestionbankTopic;
  slug: string;
  isAuthenticated: boolean;
}) {
  return (
    <section id={`topic-${topic.number}`} className="scroll-mt-28">
      <p className="text-sm font-medium text-primary">Topic {topic.number}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        {topic.title}
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topic.subtopics.map((sub) => {
          const target = ROUTES.questionbankStudy(slug, sub.id);
          return (
            <TopicCard
              key={sub.id}
              title={sub.title}
              description={sub.description}
              badge={sub.badge}
              href={
                isAuthenticated
                  ? target
                  : `${ROUTES.auth.login}?next=${encodeURIComponent(target)}`
              }
            />
          );
        })}
      </div>
    </section>
  );
}

export function QuestionbankPage({ slug, titleOverride }: Props) {
  const { data: course, isLoading } = useCourseDetail(slug, !titleOverride);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [showTop, setShowTop] = useState(false);

  const bank = useMemo(
    () => getQuestionbankBySlug(slug, titleOverride ?? course?.title),
    [slug, titleOverride, course?.title]
  );

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isLoading && !course && !titleOverride) {
    return <PageLoader label="Loading questionbank..." />;
  }

  const title = `${bank.courseTitle} Questionbank`;

  return (
    <div className="bg-background">
      {/* Hero */}
      <div className="border-b border-border bg-gradient-to-b from-primary-muted/60 to-background">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Link href={ROUTES.home} className="inline-flex items-center hover:text-primary">
              <Home className="h-4 w-4" aria-hidden />
              <span className="sr-only">Home</span>
            </Link>
            <span aria-hidden>/</span>
            <Link href={ROUTES.courses} className="hover:text-primary">
              Subjects
            </Link>
            <span aria-hidden>/</span>
            <Link href={ROUTES.courseDetail(slug)} className="inline-flex items-center gap-1 hover:text-primary">
              {bank.courseTitle}
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <span aria-hidden>/</span>
            <span className="font-medium text-foreground">Questionbank</span>
          </nav>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">
                {bank.categoryName} · {bank.levelLabel}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {title}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">
                {bank.description}
              </p>
              <Button asChild size="pill" className="mt-6">
                <Link href={`${ROUTES.auth.register}?next=${encodeURIComponent(ROUTES.questionbank(slug))}`}>
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Generate my Exam
                </Link>
              </Button>
            </div>

            <div className="flex shrink-0 gap-2 self-end lg:flex-col lg:self-start">
              <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <span className="inline-flex h-12 w-12 items-center justify-center bg-primary text-primary-foreground">
                  <SquareSigma className="h-5 w-5" aria-hidden />
                </span>
                <span className="inline-flex h-12 w-12 items-center justify-center border-t border-border text-muted-foreground">
                  <HelpCircle className="h-5 w-5" aria-hidden />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Topic nav */}
        <div className="border-t border-border/80 bg-primary-muted/40">
          <div className="mx-auto flex max-w-7xl gap-0 overflow-x-auto px-4 md:px-6">
            {bank.topics.map((topic, index) => (
              <a
                key={topic.id}
                href={`#topic-${topic.number}`}
                className={cn(
                  "shrink-0 whitespace-nowrap px-4 py-3.5 text-sm font-medium text-foreground/80 transition-colors hover:text-primary",
                  index > 0 && "border-l border-border"
                )}
              >
                Topic {topic.number}: {topic.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Topics */}
      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 md:px-6 md:py-16">
        {bank.topics.map((topic) => (
          <TopicSection
            key={topic.id}
            topic={topic}
            slug={slug}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      {/* More resources */}
      <div className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            More {bank.courseTitle} resources
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bank.resources.map((resource) => {
              const href =
                resource.hrefKey === "questionbank"
                  ? ROUTES.questionbank(slug)
                  : ROUTES.courseDetail(slug);
              return (
                <Link
                  key={resource.id}
                  href={href}
                  className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_24px_-16px_rgba(24,119,242,0.18)] transition hover:-translate-y-0.5 hover:border-primary/30"
                >
                  <span
                    className={cn(
                      "mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl",
                      resource.hrefKey === "questionbank"
                        ? "bg-accent/10 text-accent"
                        : "bg-primary-muted text-primary"
                    )}
                  >
                    <BookOpen className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="text-lg font-bold text-foreground">{resource.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {resource.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl">
          Frequently Asked Questions
        </h2>
        <div className="mt-8 space-y-3">
          {bank.faqs.map((faq) => {
            const open = openFaq === faq.id;
            return (
              <div key={faq.id} className="overflow-hidden rounded-xl bg-muted">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-4 text-left text-sm font-semibold text-foreground"
                  aria-expanded={open}
                  onClick={() => setOpenFaq(open ? null : faq.id)}
                >
                  <Plus
                    className={cn(
                      "h-5 w-5 shrink-0 text-primary transition-transform",
                      open && "rotate-45"
                    )}
                    aria-hidden
                  />
                  {faq.question}
                </button>
                {open ? (
                  <p className="border-t border-border/60 px-4 pb-4 pl-12 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {showTop ? (
        <button
          type="button"
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition hover:border-primary hover:text-primary"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp className="h-5 w-5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
