"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUp, Database } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared";
import {
  GoldUnlockModal,
  type UnlockStudySet,
} from "@/components/public/questionbank/gold-unlock-modal";
import {
  StudySetCard,
  topicDisplayTitle,
} from "@/components/public/questionbank/study-set-card";
import { ROUTES, queryKeys } from "@/constants";
import {
  ResourceHero,
  SubjectBreadcrumbNav,
  useSubjectBreadcrumbs,
} from "@/components/public/subjects";
import { useQbProgram } from "@/hooks/use-questionbank";
import { canAccessWithTier } from "@/lib/access-tier";
import { richTextToPlain } from "@/lib/rich-text";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import type { QbSubtopic } from "@/types/qb.types";
import { cn } from "@/utils";

type Props = { programSlug: string };

type UnlockTarget = {
  subtopicTitle?: string | null;
  requiredTier?: string;
  studySet?: UnlockStudySet | null;
};

function isSubLocked(sub: QbSubtopic, userTier: string): boolean {
  if (typeof sub.locked === "boolean") return sub.locked;
  return !canAccessWithTier(userTier, sub.badge);
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

  const openUnlock = useCallback((sub: QbSubtopic) => {
    setUnlockTarget({
      subtopicTitle: richTextToPlain(sub.title) || sub.title,
      requiredTier: sub.badge,
      studySet: sub,
    });
    setUnlockOpen(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const unlockParam = searchParams.get("unlock");
    const justUnlocked = searchParams.get("unlocked") === "1";
    if (!unlockParam && !justUnlocked) return;
    // `?unlock=<study-set-slug>` needs the program loaded to find the set.
    if (unlockParam && unlockParam !== "1" && !data) return;

    if (unlockParam && unlockParam !== "1" && isAuthenticated) {
      const target = data?.qbTopics
        .flatMap((t) => t.subtopics)
        .find((s) => s.slug === unlockParam);
      if (target && isSubLocked(target, data?.access?.userTier ?? "FREE")) {
        openUnlock(target);
      }
    }

    if (justUnlocked) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.questionbank.all });
      void refetch();
    }

    router.replace(ROUTES.subjectQuestionbank(programSlug), { scroll: false });
  }, [searchParams, isAuthenticated, programSlug, queryClient, refetch, router, data, openUnlock]);

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

  const userTier = data.access?.userTier ?? "FREE";
  const lockedGoldCount = data.qbTopics.reduce(
    (count, topic) => count + topic.subtopics.filter((s) => isSubLocked(s, userTier)).length,
    0
  );

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
            {topic.number}. {displayTitle}
          </a>
        );
      })}
    </div>
  );

  return (
    <div className="bg-background">
      <ResourceHero
        programSlug={programSlug}
        title={`${data.name} Questionbank`}
        description="Practice by topic. Free study sets are open to everyone. Each Gold study set is unlocked separately."
        icon={<Database className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
        footer={themeTabs}
      />

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 md:px-6 md:py-16">
        {isFetching ? (
          <p className="text-sm text-muted-foreground" role="status">
            Refreshing topics…
          </p>
        ) : null}
        {data.access && !data.access.canStudyGold && lockedGoldCount > 0 ? (
          <div className="rounded-xl border border-[#f5d0a8] bg-[#fff8ef] px-4 py-3 text-sm text-[#9a3412]">
            <span className="font-semibold">
              {lockedGoldCount} Gold {lockedGoldCount === 1 ? "set is" : "sets are"} locked.
            </span>{" "}
            Each Gold study set has its own price — buying one unlocks only that set.
          </div>
        ) : data.access?.canStudyGold ? (
          <div className="rounded-xl border border-[#abeec5] bg-[#ecfdf3] px-4 py-3 text-sm text-[#067647]">
            <span className="font-semibold">Gold access unlocked.</span> You can open Free and Gold
            study sets in this questionbank.
          </div>
        ) : null}
        {data.qbTopics.length === 0 ? (
          <p className="text-center text-muted-foreground">No topics yet for this questionbank.</p>
        ) : null}
        {(() =>
          data.qbTopics.map((topic) => {
            const displayTitle = topicDisplayTitle(topic.title);
            return (
            <section key={topic.id} id={`topic-${topic.number}`} className="scroll-mt-28">
              <p className="text-sm font-medium text-muted-foreground">{topic.number}. {displayTitle}</p>
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
                {topic.subtopics.map((sub, subIndex) => {
                  const serial = `${topic.number}.${subIndex + 1}`;
                  const locked = isSubLocked(sub, userTier);
                  const studyHref = ROUTES.subjectQuestionbankStudy(programSlug, sub.slug);
                  const loginThenStudy = `${ROUTES.auth.login}?next=${encodeURIComponent(studyHref)}`;

                  return (
                    <StudySetCard
                      key={sub.id}
                      sub={sub}
                      serial={serial}
                      locked={locked}
                      onUnlock={() => {
                        if (!isAuthenticated) {
                          router.push(
                            `${ROUTES.auth.login}?next=${encodeURIComponent(
                              `${ROUTES.subjectQuestionbank(programSlug)}?unlock=${encodeURIComponent(sub.slug)}`
                            )}`
                          );
                          return;
                        }
                        openUnlock(sub);
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
          })
        )()}
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
        studySet={unlockTarget.studySet}
        onUnlocked={() => {
          void refetch();
        }}
      />
    </div>
  );
}
