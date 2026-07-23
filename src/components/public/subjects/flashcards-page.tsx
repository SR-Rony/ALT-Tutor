"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Layers, Lock } from "lucide-react";
import { GoldUnlockModal } from "@/components/public/questionbank/gold-unlock-modal";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useFlashcardDecks } from "@/hooks";
import { normalizeAccessBadge, tierBadgeClass, tierLabel } from "@/lib/access-tier";
import type { ApiError } from "@/types";
import type { FlashcardDeck } from "@/types/flashcard.types";
import { cn } from "@/utils";
import { ResourceGridSkeleton } from "./resource-grid-skeleton";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = { programSlug: string };

export function FlashcardsPage({ programSlug }: Props) {
  const { programName, isLoading: menuLoading } = useProgramContext(programSlug);
  const { data, isLoading, isFetching, error, refetch } = useFlashcardDecks(programSlug);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<{
    title: string;
    requiredTier: string;
  }>({ title: "", requiredTier: "GOLD" });

  const decks = data?.decks ?? [];

  const sections = useMemo(() => {
    const map = new Map<
      string,
      { id: string; chapterTitle: string; topicTitle: string; decks: FlashcardDeck[] }
    >();
    for (const deck of decks) {
      const topic = deck.topic;
      const key = topic?.id ?? "other";
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          chapterTitle: topic
            ? `Chapter ${topic.number}: ${topic.title}`
            : "Decks",
          topicTitle: topic?.title ?? "Flashcards",
          decks: [],
        });
      }
      map.get(key)!.decks.push(deck);
    }
    return Array.from(map.values());
  }, [decks]);

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "flashcards",
    resourceLabel: "Flashcards",
    resourceHref: ROUTES.subjectResource(programSlug, "flashcards"),
  });

  const openUnlock = (deck: FlashcardDeck) => {
    setUnlockTarget({
      title: deck.title,
      requiredTier: String(deck.accessTier ?? "GOLD"),
    });
    setUnlockOpen(true);
  };

  if (menuLoading && isLoading) {
    return <PageLoader label="Loading flashcards..." />;
  }

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title={`${programName} Flashcards`}
        description="Flip cards to recall formulas and facts — know / don’t know, no exam timer."
        icon={<Layers className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      />

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 md:px-6 md:py-14">
        {isFetching ? (
          <p className="text-sm text-muted-foreground" role="status">
            Refreshing decks…
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-accent">
            {(error as unknown as ApiError)?.message || "Failed to load decks"}
          </p>
        ) : null}

        {isLoading ? (
          <ResourceGridSkeleton count={4} columns="4" />
        ) : sections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No flashcard decks published yet for this program.
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

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {section.decks.map((deck) => {
                  const locked = Boolean(deck.locked);
                  const badge = normalizeAccessBadge(deck.accessTier);
                  const href = ROUTES.subjectFlashcardDeck(programSlug, deck.slug);
                  const known = deck.progress?.known ?? 0;
                  const reviewed = deck.progress?.reviewed ?? 0;

                  return (
                    <article
                      key={deck.id}
                      className={cn(
                        "flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_8px_24px_-16px_rgba(24,119,242,0.16)] transition",
                        !locked &&
                          "hover:border-primary/30 hover:shadow-[0_12px_30px_-14px_rgba(24,119,242,0.24)]"
                      )}
                    >
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                          {deck.cardCount} cards
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase text-white",
                            tierBadgeClass(badge)
                          )}
                        >
                          {badge !== "FREE" ? (
                            <Lock className="h-3 w-3" aria-hidden />
                          ) : null}
                          {tierLabel(badge)}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-foreground">{deck.title}</h3>
                      {deck.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {deck.description}
                        </p>
                      ) : null}
                      {reviewed > 0 ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Progress: {known}/{deck.cardCount} known
                        </p>
                      ) : null}
                      <div className="mt-auto pt-5">
                        {locked ? (
                          <Button
                            type="button"
                            size="pill"
                            variant="outline"
                            className="w-full border-[#d4a017]/50 text-[#9a3412]"
                            onClick={() => openUnlock(deck)}
                          >
                            <Lock className="h-3.5 w-3.5" aria-hidden />
                            Unlock {tierLabel(badge)}
                          </Button>
                        ) : (
                          <Button asChild size="pill" className="w-full">
                            <Link href={href}>Start flip</Link>
                          </Button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {data?.program ? (
        <GoldUnlockModal
          open={unlockOpen}
          onClose={() => setUnlockOpen(false)}
          programId={data.program.id}
          programName={data.program.name}
          programSlug={programSlug}
          subtopicTitle={unlockTarget.title}
          requiredTier={unlockTarget.requiredTier}
          onUnlocked={() => {
            void refetch();
          }}
          returnPath={`${ROUTES.subjectResource(programSlug, "flashcards")}?unlocked=1`}
        />
      ) : null}
    </div>
  );
}
