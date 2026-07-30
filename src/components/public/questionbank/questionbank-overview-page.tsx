"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUp, Database, Lock, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared";
import { GoldUnlockModal } from "@/components/public/questionbank/gold-unlock-modal";
import { ROUTES, queryKeys } from "@/constants";
import {
  ResourceHero,
  SubjectBreadcrumbNav,
  useSubjectBreadcrumbs,
} from "@/components/public/subjects";
import { useQbProgram } from "@/hooks/use-questionbank";
import { normalizeAccessBadge, tierBadgeClass, tierLabel, canAccessWithTier } from "@/lib/access-tier";
import { richTextToPlain } from "@/lib/rich-text";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import type { QbSubtopic } from "@/types/qb.types";
import { cn } from "@/utils";

type Props = { programSlug: string };

type UnlockTarget = {
  subtopicTitle?: string | null;
  requiredTier?: string;
};

/** "1. Algebra" → "Algebra" for display (Revision Village style). */
function topicDisplayTitle(title: string): string {
  return title.replace(/^\d+(?:\.\d+)?\.\s*/, "").trim() || title;
}

function StudySetCard({
  sub,
  locked,
  onUnlock,
  onOpenStudy,
}: {
  sub: QbSubtopic;
  locked: boolean;
  onUnlock: () => void;
  onOpenStudy: () => void;
}) {
  const badge = normalizeAccessBadge(sub.badge);
  const isPaid = badge !== "FREE";
  const preview =
    richTextToPlain(sub.description ?? "") ||
    `${sub._count?.questions ?? 0} practice questions in this study set.`;

  return (
    <article className="relative flex h-full flex-col rounded-xl border border-border/80 bg-white px-5 pb-5 pt-7 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition hover:border-primary/25 hover:shadow-[0_8px_24px_-16px_rgba(24,119,242,0.25)]">
      {isPaid ? (
        <span
          className={cn(
            "absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm",
            tierBadgeClass(badge)
          )}
        >
          <Lock className="h-3 w-3" aria-hidden />
          {tierLabel(badge)}
        </span>
      ) : null}

      <h3 className="text-base font-bold leading-snug text-foreground">{sub.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{preview}</p>

      <div className="mt-5 flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="pill"
          className="min-w-[8.5rem] border-foreground/25 font-semibold text-foreground hover:border-primary/40 hover:bg-primary-muted"
          onClick={() => {
            if (locked) {
              onUnlock();
              return;
            }
            onOpenStudy();
          }}
        >
          Open Study
        </Button>
      </div>
    </article>
  );
}

export function QuestionbankOverviewPage({ programSlug }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data, isLoading, error, isFetching, refetch } = useQbProgram(programSlug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [showTop, setShowTop] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<UnlockTarget>({});
  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "questionbank",
    resourceLabel: "Questionbank",
    resourceHref: ROUTES.subjectQuestionbank(programSlug),
  });

  const openUnlock = useCallback((subtopicTitle?: string | null, requiredTier?: string) => {
    setUnlockTarget({ subtopicTitle, requiredTier });
    setUnlockOpen(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const wantsUnlock = searchParams.get("unlock") === "1";
    const justUnlocked = searchParams.get("unlocked") === "1";
    if (!wantsUnlock && !justUnlocked) return;

    if (wantsUnlock && isAuthenticated) {
      setUnlockOpen(true);
    }

    if (justUnlocked) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.questionbank.all });
      void refetch();
    }

    router.replace(ROUTES.subjectQuestionbank(programSlug), { scroll: false });
  }, [searchParams, isAuthenticated, programSlug, queryClient, refetch, router]);

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

  const themeTabs = (
    <div className="mx-auto flex max-w-7xl gap-0 overflow-x-auto px-4 md:px-6">
      {data.qbTopics.map((topic, index) => {
        const displayTitle = topicDisplayTitle(topic.title);
        return (
          <a
            key={topic.id}
            href={`#topic-${topic.number}`}
            className={cn(
              "shrink-0 whitespace-nowrap border-b-2 border-transparent px-5 py-3.5 text-sm font-semibold text-foreground/75 transition hover:border-primary hover:text-primary",
              index > 0 && "border-l border-primary/10"
            )}
          >
            Topic {topic.number}: {displayTitle}
          </a>
        );
      })}
    </div>
  );

  return (
    <div className="bg-background">
      <ResourceHero
        title={`${data.name} Questionbank`}
        description="Practice by topic. Free study sets are open to everyone. Silver, Gold, and Diamond sets unlock with a Practice Pass or linked course."
        icon={<Database className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
        footer={themeTabs}
      >
        {data.access?.canStudyGold ? null : (
          <Button type="button" size="pill" onClick={() => openUnlock()}>
            <Sparkles className="h-4 w-4" />
            Get Practice Pass
          </Button>
        )}
      </ResourceHero>

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 md:px-6 md:py-16">
        {isFetching ? (
          <p className="text-sm text-muted-foreground" role="status">
            Refreshing topics…
          </p>
        ) : null}
        {data.access && !data.access.canStudyGold ? (
          <div className="rounded-xl border border-[#f5d0a8] bg-[#fff8ef] px-4 py-3 text-sm text-[#9a3412]">
            <span className="font-semibold">Paid sets locked.</span> Unlock Silver, Gold, or Diamond
            study sets with a{" "}
            <button
              type="button"
              className="font-semibold underline underline-offset-2"
              onClick={() => openUnlock()}
            >
              Practice Pass
            </button>{" "}
            or by enrolling in a linked course.
          </div>
        ) : data.access?.canStudyGold ? (
          <div className="rounded-xl border border-[#abeec5] bg-[#ecfdf3] px-4 py-3 text-sm text-[#067647]">
            <span className="font-semibold">Paid access unlocked.</span> You can open study sets your
            tier covers in this questionbank.
          </div>
        ) : null}
        {data.qbTopics.length === 0 ? (
          <p className="text-center text-muted-foreground">No topics yet for this questionbank.</p>
        ) : null}
        {data.qbTopics.map((topic) => {
          const displayTitle = topicDisplayTitle(topic.title);
          return (
            <section key={topic.id} id={`topic-${topic.number}`} className="scroll-mt-28">
              <p className="text-sm font-medium text-muted-foreground">Topic {topic.number}</p>
              <h2 className="mt-1 text-2xl font-bold text-foreground md:text-[1.75rem]">
                {displayTitle}
              </h2>
              {topic.description ? (
                <RichTextContent
                  html={topic.description}
                  className="mt-2 max-w-3xl text-sm text-muted-foreground"
                />
              ) : null}
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {topic.subtopics.map((sub) => {
                  const userTier = data.access?.userTier ?? "FREE";
                  const locked =
                    Boolean(sub.locked) || !canAccessWithTier(userTier, sub.badge);
                  const studyHref = ROUTES.subjectQuestionbankStudy(programSlug, sub.slug);
                  const loginThenStudy = `${ROUTES.auth.login}?next=${encodeURIComponent(studyHref)}`;

                  return (
                    <StudySetCard
                      key={sub.id}
                      sub={sub}
                      locked={locked}
                      onUnlock={() => {
                        if (!isAuthenticated) {
                          router.push(
                            `${ROUTES.auth.login}?next=${encodeURIComponent(
                              `${ROUTES.subjectQuestionbank(programSlug)}?unlock=1`
                            )}`
                          );
                          return;
                        }
                        openUnlock(sub.title, sub.badge);
                      }}
                      onOpenStudy={() => {
                        if (!isAuthenticated) {
                          router.push(loginThenStudy);
                          return;
                        }
                        router.push(studyHref);
                      }}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
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

      <GoldUnlockModal
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
        programId={data.id}
        programName={data.name}
        programSlug={programSlug}
        subtopicTitle={unlockTarget.subtopicTitle}
        requiredTier={unlockTarget.requiredTier}
        onUnlocked={() => {
          void refetch();
        }}
      />
    </div>
  );
}
