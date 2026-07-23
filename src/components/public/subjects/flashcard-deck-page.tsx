"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Lock,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { GoldUnlockModal } from "@/components/public/questionbank/gold-unlock-modal";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useFlashcardDeck, useReviewFlashcard } from "@/hooks";
import { normalizeAccessBadge, tierLabel } from "@/lib/access-tier";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import type { FlashcardCard, FlashcardMastery } from "@/types/flashcard.types";
import { cn } from "@/utils";
import { SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = { programSlug: string; deckSlug: string };

export function FlashcardDeckPage({ programSlug, deckSlug }: Props) {
  const router = useRouter();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { programName, isLoading: menuLoading } = useProgramContext(programSlug);
  const { data, isLoading, error, refetch } = useFlashcardDeck(programSlug, deckSlug);
  const review = useReviewFlashcard();

  const deck = data?.deck;
  const cards = useMemo(() => deck?.cards ?? [], [deck?.cards]);
  const locked = Boolean(deck?.locked);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [localMastery, setLocalMastery] = useState<Record<string, FlashcardMastery>>(
    {}
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
    setDone(false);
    setActionError(null);
    setLocalMastery({});
  }, [deckSlug]);

  useEffect(() => {
    if (!cards.length) return;
    setLocalMastery((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const seed: Record<string, FlashcardMastery> = {};
      for (const c of cards) {
        if (c.mastery) seed[c.id] = c.mastery;
      }
      return seed;
    });
  }, [cards]);

  const card: FlashcardCard | undefined = cards[index];
  const total = cards.length;
  const knownCount = useMemo(
    () => Object.values(localMastery).filter((m) => m === "KNOW").length,
    [localMastery]
  );

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "flashcards",
    resourceLabel: "Flashcards",
    resourceHref: ROUTES.subjectResource(programSlug, "flashcards"),
    topicLabel: deck?.title ?? deckSlug,
  });

  const goNext = useCallback(() => {
    setFlipped(false);
    setIndex((i) => {
      if (i + 1 >= total) {
        setDone(true);
        return i;
      }
      return i + 1;
    });
  }, [total]);

  const rate = async (mastery: FlashcardMastery) => {
    if (!card) return;
    setActionError(null);

    if (!isAuthenticated) {
      router.push(
        `${ROUTES.auth.login}?next=${encodeURIComponent(
          ROUTES.subjectFlashcardDeck(programSlug, deckSlug)
        )}`
      );
      return;
    }

    setLocalMastery((prev) => ({ ...prev, [card.id]: mastery }));
    try {
      await review.mutateAsync({ cardId: card.id, mastery });
      goNext();
    } catch (err) {
      setActionError((err as ApiError)?.message || "Could not save review");
    }
  };

  if (menuLoading && isLoading) {
    return <PageLoader label="Loading deck..." />;
  }

  if (error && !deck) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Deck not found"}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={ROUTES.subjectResource(programSlug, "flashcards")}>
            Back to Flashcards
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading && !deck) {
    return <PageLoader label="Loading deck..." />;
  }

  if (!deck) return null;

  if (locked) {
    const badge = normalizeAccessBadge(deck.accessTier);
    return (
      <div className="bg-background pb-16">
        <div className="border-b border-border bg-card px-4 py-4 md:px-6">
          <div className="mx-auto max-w-3xl">
            <SubjectBreadcrumbNav items={breadcrumbs} />
          </div>
        </div>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <Lock className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
          <h1 className="mt-4 text-xl font-bold text-foreground">{deck.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Unlock {tierLabel(badge)} to flip these cards.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={() => setUnlockOpen(true)}>
              Unlock {tierLabel(badge)}
            </Button>
            <Button asChild variant="outline">
              <Link href={ROUTES.subjectResource(programSlug, "flashcards")}>
                All decks
              </Link>
            </Button>
          </div>
        </div>
        {data?.program ? (
          <GoldUnlockModal
            open={unlockOpen}
            onClose={() => setUnlockOpen(false)}
            programId={data.program.id}
            programName={data.program.name}
            programSlug={programSlug}
            subtopicTitle={deck.title}
            requiredTier={String(deck.accessTier)}
            onUnlocked={() => void refetch()}
            returnPath={ROUTES.subjectFlashcardDeck(programSlug, deckSlug)}
          />
        ) : null}
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-foreground">{deck.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">This deck has no cards yet.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={ROUTES.subjectResource(programSlug, "flashcards")}>
            Back to Flashcards
          </Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Check className="mx-auto h-10 w-10 text-[var(--accent-green)]" aria-hidden />
        <h1 className="mt-4 text-xl font-bold text-foreground">Deck complete</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {knownCount} of {total} marked known · {programName}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            onClick={() => {
              setDone(false);
              setIndex(0);
              setFlipped(false);
            }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Review again
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.subjectResource(programSlug, "flashcards")}>
              All decks
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-background pb-16">
      <div className="border-b border-border bg-card/80 px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <SubjectBreadcrumbNav items={breadcrumbs} />
            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {deck.title}
            </p>
          </div>
          <p className="text-sm tabular-nums text-muted-foreground">
            {index + 1} / {total}
            {knownCount > 0 ? ` · ${knownCount} known` : ""}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 py-8 md:py-12">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link href={ROUTES.subjectResource(programSlug, "flashcards")}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Decks
          </Link>
        </Button>

        {actionError ? (
          <p className="mb-3 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            {actionError}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className={cn(
            "group relative flex min-h-[240px] w-full flex-col items-center justify-center rounded-3xl border border-border bg-card px-6 py-10 text-center shadow-[0_16px_40px_-24px_rgba(15,23,42,0.35)] transition",
            "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
          aria-label={flipped ? "Show front" : "Show back"}
        >
          <span className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {flipped ? "Back" : "Front"} · tap to flip
          </span>
          <p className="text-lg font-semibold leading-snug text-foreground sm:text-xl md:text-2xl">
            {flipped ? card?.back : card?.front}
          </p>
          {!flipped && card?.hint ? (
            <p className="mt-4 text-sm text-muted-foreground">Hint: {card.hint}</p>
          ) : null}
        </button>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-accent/40 text-accent hover:bg-accent/10"
            disabled={review.isPending}
            onClick={() => void rate("DONT_KNOW")}
          >
            <ThumbsDown className="h-4 w-4" aria-hidden />
            Don’t know
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={review.isPending}
            onClick={() => void rate("KNOW")}
          >
            <ThumbsUp className="h-4 w-4" aria-hidden />
            Know
          </Button>
        </div>

        {!isAuthenticated ? (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Sign in to save know / don’t know progress.
          </p>
        ) : null}

        <button
          type="button"
          className="mt-4 w-full text-center text-xs font-semibold text-primary hover:underline"
          onClick={goNext}
        >
          Skip without rating
        </button>
      </div>
    </div>
  );
}
