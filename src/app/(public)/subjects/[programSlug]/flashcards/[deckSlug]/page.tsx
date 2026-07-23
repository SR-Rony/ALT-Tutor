import { FlashcardDeckPage } from "@/components/public/subjects/flashcard-deck-page";

type PageProps = {
  params: Promise<{ programSlug: string; deckSlug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { deckSlug } = await params;
  return { title: `Flashcards · ${deckSlug}` };
}

export default async function FlashcardDeckRoute({ params }: PageProps) {
  const { programSlug, deckSlug } = await params;
  return <FlashcardDeckPage programSlug={programSlug} deckSlug={deckSlug} />;
}
