"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import {
  useAdminFlashcards,
  useAdminQuestionbank,
  useAdminSubjectsTree,
  useBulkCreateFlashcards,
  useCreateFlashcardCard,
  useCreateFlashcardDeck,
  useDeleteFlashcardCard,
  useDeleteFlashcardDeck,
  useUpdateFlashcardCard,
  useUpdateFlashcardDeck,
} from "@/hooks";
import { normalizeAccessBadge, tierLabel } from "@/lib/access-tier";
import { slugify } from "@/lib/slugify";
import type { ApiError } from "@/types";
import type {
  BulkFlashcardItem,
  FlashcardCard,
  FlashcardDeck,
} from "@/types/flashcard.types";
import type { QbAccessBadge } from "@/types/qb.types";
import { cn } from "@/utils";

const TIERS: QbAccessBadge[] = ["FREE", "SILVER", "GOLD", "DIAMOND"];

/** Parse bulk lines: `front | back` or `front || back` (optional hint after second `|`). */
export function parseBulkFlashcardLines(text: string): BulkFlashcardItem[] {
  const cards: BulkFlashcardItem[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.includes("||")
      ? line.split("||").map((p) => p.trim())
      : line.split("|").map((p) => p.trim());
    const front = parts[0] ?? "";
    const back = parts[1] ?? "";
    const hint = parts[2] || undefined;
    if (!front || !back) continue;
    cards.push({ front, back, hint });
  }
  return cards;
}

export function AdminFlashcardsPage() {
  const { data: subjectsTree = [] } = useAdminSubjectsTree();
  const [categoryId, setCategoryId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [programId, setProgramId] = useState("");

  const effectiveCategoryId = categoryId || subjectsTree[0]?.id || "";
  const subjects = useMemo(() => {
    return subjectsTree.find((c) => c.id === effectiveCategoryId)?.subjects ?? [];
  }, [subjectsTree, effectiveCategoryId]);
  const effectiveSubjectId = subjectId || subjects[0]?.id || "";
  const programs = useMemo(() => {
    return subjects.find((s) => s.id === effectiveSubjectId)?.programs ?? [];
  }, [subjects, effectiveSubjectId]);
  const effectiveProgramId = programId || programs[0]?.id || "";
  const selectedProgram = programs.find((p) => p.id === effectiveProgramId);

  const { data, isLoading, error, refetch, isFetching } = useAdminFlashcards(
    effectiveProgramId || undefined
  );
  const { data: qbTopics = [] } = useAdminQuestionbank(effectiveProgramId || undefined);

  const createDeck = useCreateFlashcardDeck();
  const updateDeck = useUpdateFlashcardDeck();
  const deleteDeck = useDeleteFlashcardDeck();
  const createCard = useCreateFlashcardCard();
  const bulkCreate = useBulkCreateFlashcards();
  const updateCard = useUpdateFlashcardCard();
  const deleteCard = useDeleteFlashcardCard();

  const decks = data?.decks ?? [];

  const [deckModalOpen, setDeckModalOpen] = useState(false);
  const [editDeckId, setEditDeckId] = useState<string | null>(null);
  const [cardsDeckId, setCardsDeckId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState("");
  const [subtopicId, setSubtopicId] = useState("");
  const [accessTier, setAccessTier] = useState<QbAccessBadge>("FREE");
  const [isPublished, setIsPublished] = useState(false);

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [hint, setHint] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [editingCard, setEditingCard] = useState<FlashcardCard | null>(null);

  const busy =
    createDeck.isPending ||
    updateDeck.isPending ||
    deleteDeck.isPending ||
    createCard.isPending ||
    bulkCreate.isPending ||
    updateCard.isPending ||
    deleteCard.isPending;

  const selectedTopic = qbTopics.find((t) => t.id === topicId);
  const subtopics = selectedTopic?.subtopics ?? [];
  const cardsDeck = decks.find((d) => d.id === cardsDeckId) ?? null;
  const cards = cardsDeck?.cards ?? [];

  useEffect(() => {
    if (!deckModalOpen || editDeckId) return;
    if (!title.trim()) return;
    setSlug(slugify(title));
  }, [title, deckModalOpen, editDeckId]);

  const resetDeckForm = () => {
    setEditDeckId(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setTopicId(qbTopics[0]?.id ?? "");
    setSubtopicId("");
    setAccessTier("FREE");
    setIsPublished(false);
    setActionError(null);
  };

  const openCreateDeck = () => {
    resetDeckForm();
    setTopicId(qbTopics[0]?.id ?? "");
    setDeckModalOpen(true);
  };

  const openEditDeck = (item: FlashcardDeck) => {
    setEditDeckId(item.id);
    setTitle(item.title);
    setSlug(item.slug);
    setDescription(item.description ?? "");
    setTopicId(item.topicId || item.topic?.id || "");
    setSubtopicId(item.subtopicId || item.subtopic?.id || "");
    setAccessTier(normalizeAccessBadge(item.accessTier));
    setIsPublished(Boolean(item.isPublished));
    setActionError(null);
    setDeckModalOpen(true);
  };

  const openCards = (item: FlashcardDeck) => {
    setCardsDeckId(item.id);
    setFront("");
    setBack("");
    setHint("");
    setBulkText("");
    setEditingCard(null);
    setActionError(null);
  };

  const onSaveDeck = async () => {
    if (!title.trim() || !slug.trim()) {
      setActionError("Title and slug are required");
      return;
    }
    if (!topicId) {
      setActionError("Select a topic");
      return;
    }
    if (!effectiveProgramId) {
      setActionError("Select a program first");
      return;
    }
    setActionError(null);
    try {
      if (editDeckId) {
        await updateDeck.mutateAsync({
          id: editDeckId,
          payload: {
            title: title.trim(),
            slug: slug.trim(),
            topicId,
            accessTier,
            isPublished,
            subtopicId: subtopicId ? subtopicId : null,
            description: description.trim() || null,
          },
        });
      } else {
        await createDeck.mutateAsync({
          programId: effectiveProgramId,
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          topicId,
          subtopicId: subtopicId || undefined,
          accessTier,
          isPublished,
        });
      }
      setDeckModalOpen(false);
      resetDeckForm();
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save deck");
    }
  };

  const onAddCard = async () => {
    if (!cardsDeckId) return;
    if (!front.trim() || !back.trim()) {
      setActionError("Front and back are required");
      return;
    }
    setActionError(null);
    try {
      if (editingCard) {
        await updateCard.mutateAsync({
          id: editingCard.id,
          payload: {
            front: front.trim(),
            back: back.trim(),
            hint: hint.trim() || null,
          },
        });
        setEditingCard(null);
      } else {
        await createCard.mutateAsync({
          deckId: cardsDeckId,
          payload: {
            front: front.trim(),
            back: back.trim(),
            hint: hint.trim() || undefined,
          },
        });
      }
      setFront("");
      setBack("");
      setHint("");
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to save card");
    }
  };

  const onBulkAdd = async () => {
    if (!cardsDeckId) return;
    const parsed = parseBulkFlashcardLines(bulkText);
    if (!parsed.length) {
      setActionError('Paste lines like: front | back   (optional: front | back | hint)');
      return;
    }
    setActionError(null);
    try {
      await bulkCreate.mutateAsync({ deckId: cardsDeckId, cards: parsed });
      setBulkText("");
    } catch (err) {
      setActionError((err as ApiError)?.message || "Bulk add failed");
    }
  };

  if (isLoading && decks.length === 0 && programs.length > 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Flashcards"
          description="Recall decks — own front/back cards, not Questionbank copies."
          className="mb-0"
        />
        <PageLoader label="Loading flashcard decks..." />
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="border-b border-border px-5 py-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <PageHeader
              title="Flashcards"
              description="Create a deck, then add cards one-by-one or paste many lines (front | back)."
              className="mb-0"
            />
            <div className="flex flex-wrap gap-2">
              <AdminIconAction
                label="Refresh"
                icon={RefreshCw}
                tone="primary"
                disabled={isFetching}
                onClick={() => void refetch()}
                className={isFetching ? "animate-spin" : undefined}
              />
              <Button
                type="button"
                size="sm"
                disabled={!effectiveProgramId || qbTopics.length === 0}
                onClick={openCreateDeck}
              >
                <Plus className="h-4 w-4" />
                New deck
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Category
              </span>
              <select
                value={effectiveCategoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubjectId("");
                  setProgramId("");
                }}
                className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                {subjectsTree.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Subject
              </span>
              <select
                value={effectiveSubjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setProgramId("");
                }}
                className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Program
              </span>
              <select
                value={effectiveProgramId}
                onChange={(e) => setProgramId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <p className="mt-2 text-sm text-accent">
              {(error as unknown as ApiError)?.message}
            </p>
          ) : null}
          {selectedProgram ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Student hub:{" "}
              <Link
                href={ROUTES.subjectResource(selectedProgram.slug, "flashcards")}
                className="font-semibold text-primary hover:underline"
                target="_blank"
              >
                /subjects/{selectedProgram.slug}/flashcards
              </Link>
            </p>
          ) : null}
        </div>

        <div className="space-y-3 p-5">
          {decks.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No flashcard decks yet. Create one, then add cards.
            </p>
          ) : null}
          {decks.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3",
                !item.isActive && "border-dashed opacity-70"
              )}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                    {item.cardCount} cards
                  </span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                    {tierLabel(item.accessTier)}
                  </span>
                  {item.isPublished ? (
                    <span className="rounded-md bg-[#ecfdf3] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--accent-green)]">
                      Published
                    </span>
                  ) : (
                    <span className="rounded-md bg-[#fff8ef] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#9a3412]">
                      Draft
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.topic?.title ?? "Topic"}
                  {item.subtopic ? ` · ${item.subtopic.title}` : ""} · {item.slug}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-primary-muted"
                  title="Manage cards"
                  onClick={() => openCards(item)}
                >
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    Cards
                  </span>
                </button>
                {selectedProgram && item.isPublished ? (
                  <Link
                    href={ROUTES.subjectResource(selectedProgram.slug, "flashcards")}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-primary hover:underline"
                    target="_blank"
                    title="Preview student hub"
                  >
                    Preview
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="rounded-md p-2 text-muted-foreground hover:bg-primary-muted hover:text-primary"
                  title="Edit deck"
                  onClick={() => openEditDeck(item)}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                  title={item.isPublished ? "Unpublish" : "Publish"}
                  disabled={busy}
                  onClick={() =>
                    void updateDeck.mutateAsync({
                      id: item.id,
                      payload: { isPublished: !item.isPublished },
                    })
                  }
                >
                  {item.isPublished ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-accent" />
                  )}
                </button>
                <button
                  type="button"
                  className="rounded-md p-2 text-accent hover:bg-[#fff1ee]"
                  title="Delete deck"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete deck "${item.title}" and all its cards?`
                      )
                    ) {
                      void deleteDeck.mutateAsync(item.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AdminModal
        open={deckModalOpen}
        title={editDeckId ? "Edit deck" : "New deck"}
        description="Basics → topic → tier → publish. Add cards after create."
        onClose={() => !busy && setDeckModalOpen(false)}
        className="sm:max-w-xl"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setDeckModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onSaveDeck()}>
              {busy ? "Saving…" : editDeckId ? "Save deck" : "Create deck"}
            </Button>
          </div>
        }
      >
        {actionError && deckModalOpen ? (
          <p className="mb-3 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            {actionError}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold text-muted-foreground">Title</span>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold text-muted-foreground">Slug</span>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </label>
          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-semibold text-muted-foreground">
              Description
            </span>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional short blurb"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">Topic</span>
            <select
              value={topicId}
              onChange={(e) => {
                setTopicId(e.target.value);
                setSubtopicId("");
              }}
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              {qbTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Subtopic (optional)
            </span>
            <select
              value={subtopicId}
              onChange={(e) => setSubtopicId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              <option value="">— None —</option>
              {subtopics.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Access tier
            </span>
            <select
              value={accessTier}
              onChange={(e) => setAccessTier(e.target.value as QbAccessBadge)}
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {tierLabel(t)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Published
          </label>
        </div>
      </AdminModal>

      <AdminModal
        open={Boolean(cardsDeckId)}
        title={cardsDeck ? `Cards — ${cardsDeck.title}` : "Cards"}
        description="Add one card, or paste many lines: front | back"
        onClose={() => !busy && setCardsDeckId(null)}
        className="sm:max-w-2xl"
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setCardsDeckId(null)}
            >
              Done
            </Button>
          </div>
        }
      >
        {actionError && cardsDeckId ? (
          <p className="mb-3 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            {actionError}
          </p>
        ) : null}

        <div className="mb-4 space-y-2 rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {editingCard ? "Edit card" : "Add card"}
          </p>
          <Input
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="Front (prompt)"
          />
          <Input
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="Back (answer)"
          />
          <Input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Hint (optional)"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={busy} onClick={() => void onAddCard()}>
              {editingCard ? "Save card" : "Add card"}
            </Button>
            {editingCard ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setEditingCard(null);
                  setFront("");
                  setBack("");
                  setHint("");
                }}
              >
                Cancel edit
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mb-4 space-y-2 rounded-xl border border-dashed border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Bulk add
          </p>
          <p className="text-xs text-muted-foreground">
            One card per line. Format: <code>front | back</code> or{" "}
            <code>front | back | hint</code>
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
            placeholder={"sin 30° | 1/2\nArea of circle | πr² | radius r"}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || !bulkText.trim()}
            onClick={() => void onBulkAdd()}
          >
            {bulkCreate.isPending
              ? "Adding…"
              : (() => {
                  const n = parseBulkFlashcardLines(bulkText).length;
                  return n > 0 ? `Add ${n} card${n === 1 ? "" : "s"}` : "Bulk add";
                })()}
          </Button>
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {cards.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No cards yet.
            </p>
          ) : null}
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex items-start justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <div className="min-w-0 text-sm">
                <p className="font-medium text-foreground">{card.front}</p>
                <p className="text-muted-foreground">{card.back}</p>
                {card.hint ? (
                  <p className="text-xs text-muted-foreground">Hint: {card.hint}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-primary-muted hover:text-primary"
                  title="Edit"
                  onClick={() => {
                    setEditingCard(card);
                    setFront(card.front);
                    setBack(card.back);
                    setHint(card.hint ?? "");
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-accent hover:bg-[#fff1ee]"
                  title="Delete"
                  onClick={() => {
                    if (window.confirm("Delete this card?")) {
                      void deleteCard.mutateAsync(card.id);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminModal>
    </>
  );
}
