import type { QbAccessBadge } from "@/types/qb.types";

export type FlashcardMastery = "DONT_KNOW" | "KNOW";

export type FlashcardTopicRef = {
  id: string;
  title: string;
  slug: string;
  number: number;
};

export type FlashcardSubtopicRef = {
  id: string;
  title: string;
  slug: string;
  badge: QbAccessBadge | string;
};

export type FlashcardCard = {
  id: string;
  front: string;
  back: string;
  hint?: string | null;
  order: number;
  isActive?: boolean;
  mastery?: FlashcardMastery | null;
};

export type FlashcardDeck = {
  id: string;
  programId?: string;
  topicId?: string;
  subtopicId?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  cardCount: number;
  accessTier: QbAccessBadge | string;
  isPublished?: boolean;
  order: number;
  isActive?: boolean;
  locked?: boolean;
  topic?: FlashcardTopicRef;
  subtopic?: FlashcardSubtopicRef | null;
  progress?: { known: number; reviewed: number } | null;
  cards?: FlashcardCard[];
};

export type FlashcardProgramList = {
  program: { id: string; name: string; slug: string };
  userTier: QbAccessBadge | string;
  decks: FlashcardDeck[];
};

export type FlashcardDeckDetail = {
  program: { id: string; name: string; slug: string };
  userTier: QbAccessBadge | string;
  deck: FlashcardDeck;
};

export type AdminFlashcardList = {
  program: { id: string; name: string; slug: string };
  decks: FlashcardDeck[];
};

export type CreateFlashcardDeckInput = {
  programId: string;
  topicId: string;
  subtopicId?: string;
  title: string;
  slug: string;
  description?: string;
  accessTier?: QbAccessBadge;
  isPublished?: boolean;
  order?: number;
  isActive?: boolean;
};

export type UpdateFlashcardDeckInput = {
  topicId?: string;
  subtopicId?: string | null;
  title?: string;
  slug?: string;
  description?: string | null;
  accessTier?: QbAccessBadge;
  isPublished?: boolean;
  order?: number;
  isActive?: boolean;
};

export type CreateFlashcardCardInput = {
  front: string;
  back: string;
  hint?: string;
  order?: number;
  isActive?: boolean;
};

export type UpdateFlashcardCardInput = {
  front?: string;
  back?: string;
  hint?: string | null;
  order?: number;
  isActive?: boolean;
};

export type BulkFlashcardItem = {
  front: string;
  back: string;
  hint?: string;
};

export type ReviewFlashcardInput = {
  cardId: string;
  mastery: FlashcardMastery;
};

export type FlashcardReviewResult = {
  cardId: string;
  mastery: FlashcardMastery;
  reviewCount: number;
  lastReviewedAt: string | null;
};
