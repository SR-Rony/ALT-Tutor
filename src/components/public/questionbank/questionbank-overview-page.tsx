"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUp, CheckCircle2, Database, Lock, Sparkles, Unlock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared";
import {
  GoldUnlockModal,
  type UnlockStudySet,
} from "@/components/public/questionbank/gold-unlock-modal";
import { ROUTES, queryKeys } from "@/constants";
import {
  ResourceHero,
  SubjectBreadcrumbNav,
  useSubjectBreadcrumbs,
} from "@/components/public/subjects";
import { useAccessProducts } from "@/hooks";
import { useQbProgram } from "@/hooks/use-questionbank";
import { normalizeAccessBadge, tierBadgeClass, tierLabel, canAccessWithTier } from "@/lib/access-tier";
import { formatMoney, formatShortDate } from "@/lib/format";
import { richTextToPlain } from "@/lib/rich-text";
import { studySetPrice, studySetRegularPrice } from "@/lib/study-set-pricing";
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

/** "1. Algebra" / "Topic 1: Algebra" → "Algebra" for display. */
function topicDisplayTitle(title: string): string {
  const plain = richTextToPlain(title) || title;
  return (
    plain
      .replace(/^\s*topic\s*\d+\s*[.:)\-–—]\s*/i, "")
      .replace(/^\s*\d+(?:\.\d+)?\s*[.:)\-–—]\s*/, "")
      .trim() || plain
  );
}

/** Strip leading "1.1 " / "A.1 - " so we can re-apply the serial consistently. */
function studySetBaseTitle(title: string): string {
  const plain = richTextToPlain(title) || title;
  return (
    plain
      .replace(/^\s*\d+(\.\d+)?\s*[.:)\-–—]?\s*/, "")
      .replace(/^\s*[A-Za-z]\.\d+\s*[-–—]\s*/, "")
      .trim() || plain
  );
}

function StudySetCard({
  sub,
  serial,
  locked,
  onUnlock,
  onOpenStudy,
}: {
  sub: QbSubtopic;
  serial: string;
  locked: boolean;
  onUnlock: () => void;
  onOpenStudy: () => void;
}) {
  const badge = normalizeAccessBadge(sub.badge);
  const isPaid = badge !== "FREE";
  const price = isPaid ? studySetPrice(sub) : null;
  const regularPrice = isPaid ? studySetRegularPrice(sub) : null;
  const preview =
    richTextToPlain(sub.description ?? "") ||
    `${sub._count?.questions ?? 0} practice questions in this study set.`;
  const displayTitle = `${serial} ${studySetBaseTitle(sub.title)}`;

  return (
    <article className="relative flex h-full flex-col rounded-xl border border-border/80 bg-white px-5 pb-5 pt-7 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition hover:border-primary/25 hover:shadow-[0_8px_24px_-16px_rgba(24,119,242,0.25)]">
      {isPaid ? (
        <span
          className={cn(
            "absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm",
            tierBadgeClass(badge)
          )}
        >
          {locked ? <Lock className="h-3 w-3" aria-hidden /> : <Unlock className="h-3 w-3" aria-hidden />}
          {tierLabel(badge)}
        </span>
      ) : null}

      <h3 className="text-base font-bold leading-snug text-foreground">{displayTitle}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{preview}</p>

      {isPaid && sub.purchased && !locked ? (
        <p className="mt-4 inline-flex items-center justify-center gap-1.5 self-center rounded-full bg-[#ecfdf3] px-2.5 py-1 text-xs font-semibold text-[#067647]">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          Unlocked
          {sub.accessExpiresAt ? ` · until ${formatShortDate(sub.accessExpiresAt)}` : ""}
        </p>
      ) : null}

      {isPaid && locked && price != null ? (
        <p className="mt-4 flex items-baseline justify-center gap-2">
          <span className="text-lg font-extrabold text-foreground">{formatMoney(price)}</span>
          {regularPrice != null ? (
            <span className="text-xs text-muted-foreground line-through">
              {formatMoney(regularPrice)}
            </span>
          ) : null}
        </p>
      ) : null}

      <div className={cn("flex justify-center", isPaid && (sub.purchased || (locked && price != null)) ? "mt-3" : "mt-5")}>
        <Button
          type="button"
          variant="outline"
          size="pill"
          className={cn(
            "min-w-[8.5rem] font-semibold",
            locked && price != null
              ? "border-[#d4a017]/60 text-[#92400e] hover:border-[#d4a017] hover:bg-[#fffbeb]"
              : "border-foreground/25 text-foreground hover:border-primary/40 hover:bg-primary-muted"
          )}
          onClick={() => {
            if (locked) {
              onUnlock();
              return;
            }
            onOpenStudy();
          }}
        >
          {locked ? (
            <>
              <Lock className="h-3.5 w-3.5" aria-hidden />
              {price != null ? "Unlock this set" : "Unlock"}
            </>
          ) : (
            "Open Study"
          )}
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

  const { data: accessProducts = [] } = useAccessProducts();

  const openUnlock = useCallback((sub?: QbSubtopic | null) => {
    setUnlockTarget(
      sub
        ? {
            subtopicTitle: richTextToPlain(sub.title) || sub.title,
            requiredTier: sub.badge,
            studySet: sub,
          }
        : {}
    );
    setUnlockOpen(true);
  }, []);

  const hasGoldPass = useMemo(
    () =>
      Boolean(data) &&
      accessProducts.some(
        (p) =>
          (!p.programId || p.programId === data?.id) && canAccessWithTier(p.tier, "GOLD")
      ),
    [accessProducts, data]
  );

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

    if (unlockParam && isAuthenticated) {
      const target =
        unlockParam === "1"
          ? null
          : data?.qbTopics.flatMap((t) => t.subtopics).find((s) => s.slug === unlockParam);
      if (!target || isSubLocked(target, data?.access?.userTier ?? "FREE")) {
        openUnlock(target ?? null);
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
      >
        {data.access?.canStudyGold || !hasGoldPass ? null : (
          <Button type="button" size="pill" onClick={() => openUnlock()}>
            <Sparkles className="h-4 w-4" />
            Get Gold Pass
          </Button>
        )}
      </ResourceHero>

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
            Each Gold study set is a separate purchase — buying one unlocks only that set.
            {hasGoldPass ? (
              <>
                {" "}Or unlock every Gold set in this subject with a{" "}
                <button
                  type="button"
                  className="font-semibold underline underline-offset-2"
                  onClick={() => openUnlock()}
                >
                  Gold Pass
                </button>
                .
              </>
            ) : null}
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
