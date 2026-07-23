import { apiClient } from "./api-client";
import type {
  AdminFlashcardList,
  BulkFlashcardItem,
  CreateFlashcardCardInput,
  CreateFlashcardDeckInput,
  FlashcardCard,
  FlashcardDeck,
  FlashcardDeckDetail,
  FlashcardProgramList,
  FlashcardReviewResult,
  ReviewFlashcardInput,
  UpdateFlashcardCardInput,
  UpdateFlashcardDeckInput,
} from "@/types/flashcard.types";

export const flashcardsService = {
  async listDecks(programSlug: string): Promise<FlashcardProgramList> {
    const response = await apiClient.get<FlashcardProgramList>(
      `/flashcards/programs/${encodeURIComponent(programSlug)}`
    );
    return response.data;
  },

  async getDeck(
    programSlug: string,
    deckSlug: string
  ): Promise<FlashcardDeckDetail> {
    const response = await apiClient.get<FlashcardDeckDetail>(
      `/flashcards/programs/${encodeURIComponent(programSlug)}/decks/${encodeURIComponent(deckSlug)}`
    );
    return response.data;
  },

  async review(payload: ReviewFlashcardInput): Promise<FlashcardReviewResult> {
    const response = await apiClient.post<FlashcardReviewResult>(
      "/flashcards/review",
      payload
    );
    return response.data;
  },

  async adminList(programId: string): Promise<AdminFlashcardList> {
    const response = await apiClient.get<AdminFlashcardList>(
      `/flashcards/admin?programId=${encodeURIComponent(programId)}`
    );
    return response.data;
  },

  async createDeck(payload: CreateFlashcardDeckInput): Promise<FlashcardDeck> {
    const response = await apiClient.post<FlashcardDeck>(
      "/flashcards/admin/decks",
      payload
    );
    return response.data;
  },

  async updateDeck(
    id: string,
    payload: UpdateFlashcardDeckInput
  ): Promise<FlashcardDeck> {
    const response = await apiClient.patch<FlashcardDeck>(
      `/flashcards/admin/decks/${id}`,
      payload
    );
    return response.data;
  },

  async deleteDeck(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/flashcards/admin/decks/${id}`
    );
    return response.data;
  },

  async createCard(
    deckId: string,
    payload: CreateFlashcardCardInput
  ): Promise<FlashcardCard> {
    const response = await apiClient.post<FlashcardCard>(
      `/flashcards/admin/decks/${deckId}/cards`,
      payload
    );
    return response.data;
  },

  async bulkCreateCards(
    deckId: string,
    cards: BulkFlashcardItem[]
  ): Promise<{ created: number; cards: FlashcardCard[] }> {
    const response = await apiClient.post<{ created: number; cards: FlashcardCard[] }>(
      `/flashcards/admin/decks/${deckId}/cards/bulk`,
      { cards }
    );
    return response.data;
  },

  async updateCard(
    id: string,
    payload: UpdateFlashcardCardInput
  ): Promise<FlashcardCard> {
    const response = await apiClient.patch<FlashcardCard>(
      `/flashcards/admin/cards/${id}`,
      payload
    );
    return response.data;
  },

  async deleteCard(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/flashcards/admin/cards/${id}`
    );
    return response.data;
  },
};
