"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants";
import { flashcardsService } from "@/services/flashcards.service";
import { useAppSelector } from "@/store";
import type {
  BulkFlashcardItem,
  CreateFlashcardCardInput,
  CreateFlashcardDeckInput,
  ReviewFlashcardInput,
  UpdateFlashcardCardInput,
  UpdateFlashcardDeckInput,
} from "@/types/flashcard.types";

function useFlashcardAuthKey() {
  const userId = useAppSelector((s) => s.auth.user?.id);
  return userId ?? "anon";
}

export function useFlashcardDecks(programSlug: string) {
  const authKey = useFlashcardAuthKey();
  return useQuery({
    queryKey: queryKeys.flashcards.program(programSlug, authKey),
    queryFn: () => flashcardsService.listDecks(programSlug),
    enabled: Boolean(programSlug),
  });
}

export function useFlashcardDeck(programSlug: string, deckSlug: string) {
  const authKey = useFlashcardAuthKey();
  return useQuery({
    queryKey: queryKeys.flashcards.deck(programSlug, deckSlug, authKey),
    queryFn: () => flashcardsService.getDeck(programSlug, deckSlug),
    enabled: Boolean(programSlug && deckSlug),
  });
}

export function useAdminFlashcards(programId?: string) {
  return useQuery({
    queryKey: queryKeys.flashcards.admin(programId),
    queryFn: () => flashcardsService.adminList(programId!),
    enabled: Boolean(programId),
  });
}

function useInvalidateFlashcards() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: queryKeys.flashcards.all });
}

export function useReviewFlashcard() {
  const invalidate = useInvalidateFlashcards();
  return useMutation({
    mutationFn: (payload: ReviewFlashcardInput) => flashcardsService.review(payload),
    onSuccess: invalidate,
  });
}

export function useCreateFlashcardDeck() {
  const invalidate = useInvalidateFlashcards();
  return useMutation({
    mutationFn: (payload: CreateFlashcardDeckInput) =>
      flashcardsService.createDeck(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateFlashcardDeck() {
  const invalidate = useInvalidateFlashcards();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateFlashcardDeckInput;
    }) => flashcardsService.updateDeck(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteFlashcardDeck() {
  const invalidate = useInvalidateFlashcards();
  return useMutation({
    mutationFn: (id: string) => flashcardsService.deleteDeck(id),
    onSuccess: invalidate,
  });
}

export function useCreateFlashcardCard() {
  const invalidate = useInvalidateFlashcards();
  return useMutation({
    mutationFn: ({
      deckId,
      payload,
    }: {
      deckId: string;
      payload: CreateFlashcardCardInput;
    }) => flashcardsService.createCard(deckId, payload),
    onSuccess: invalidate,
  });
}

export function useBulkCreateFlashcards() {
  const invalidate = useInvalidateFlashcards();
  return useMutation({
    mutationFn: ({
      deckId,
      cards,
    }: {
      deckId: string;
      cards: BulkFlashcardItem[];
    }) => flashcardsService.bulkCreateCards(deckId, cards),
    onSuccess: invalidate,
  });
}

export function useUpdateFlashcardCard() {
  const invalidate = useInvalidateFlashcards();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateFlashcardCardInput;
    }) => flashcardsService.updateCard(id, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteFlashcardCard() {
  const invalidate = useInvalidateFlashcards();
  return useMutation({
    mutationFn: (id: string) => flashcardsService.deleteCard(id),
    onSuccess: invalidate,
  });
}
