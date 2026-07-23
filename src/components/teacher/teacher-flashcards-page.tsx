"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, RefreshCw } from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { PageHeader, PageLoader } from "@/components/shared";
import { ROUTES } from "@/constants";
import { useTeacherFlashcards, useTeacherSubjectsTree } from "@/hooks";
import { normalizeAccessBadge, tierLabel } from "@/lib/access-tier";
import type { ApiError } from "@/types";
import { cn } from "@/utils";

export function TeacherFlashcardsPage() {
  const { data: tree = [], isLoading: treeLoading } = useTeacherSubjectsTree();
  const programs = useMemo(() => {
    return tree.flatMap((category) =>
      (category.subjects ?? []).flatMap((subject) =>
        (subject.programs ?? []).map((program) => ({
          ...program,
          subjectName: subject.name,
          categoryName: category.name,
        }))
      )
    );
  }, [tree]);

  const [programId, setProgramId] = useState("");
  const effectiveProgramId = programId || programs[0]?.id || "";
  const selected = programs.find((p) => p.id === effectiveProgramId);

  const { data, isLoading, error, refetch, isFetching } = useTeacherFlashcards(
    effectiveProgramId || undefined
  );
  const decks = data?.decks ?? [];

  if (treeLoading && programs.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Flashcards"
          description="Read-only view of decks for your assigned programs."
          className="mb-0"
        />
        <PageLoader label="Loading subjects..." />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="border-b border-border px-5 py-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <PageHeader
            title="Flashcards"
            description="Decks for programs you’re assigned to (or linked via your courses). Create and publish stay with Admin."
            className="mb-0"
          />
          <AdminIconAction
            label="Refresh"
            icon={RefreshCw}
            tone="primary"
            disabled={isFetching || !effectiveProgramId}
            onClick={() => void refetch()}
            className={isFetching ? "animate-spin" : undefined}
          />
        </div>

        {programs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No assigned subjects yet. Ask an admin to assign you under My Subjects, or link a
            program from one of your courses.
          </p>
        ) : (
          <label className="block max-w-md space-y-1.5">
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
                  {p.categoryName} · {p.subjectName} · {p.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {selected ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Student hub:{" "}
            <Link
              href={ROUTES.subjectResource(selected.slug, "flashcards")}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              target="_blank"
            >
              /subjects/{selected.slug}/flashcards
              <ExternalLink className="h-3 w-3" aria-hidden />
            </Link>
          </p>
        ) : null}

        {error ? (
          <p className="mt-2 text-sm text-accent">
            {(error as unknown as ApiError)?.message || "Failed to load decks"}
          </p>
        ) : null}
      </div>

      <div className="space-y-3 p-5">
        {!effectiveProgramId ? null : isLoading ? (
          <PageLoader label="Loading decks..." className="min-h-[160px]" />
        ) : decks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No flashcard decks for this program yet.
          </p>
        ) : (
          decks.map((item) => (
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
                    {tierLabel(normalizeAccessBadge(item.accessTier))}
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
                  {item.topic
                    ? `Ch ${item.topic.number}: ${item.topic.title}`
                    : "Topic"}
                  {item.subtopic ? ` · ${item.subtopic.title}` : ""} · {item.slug}
                </p>
              </div>
              {selected && item.isPublished ? (
                <Link
                  href={ROUTES.subjectFlashcardDeck(selected.slug, item.slug)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  target="_blank"
                >
                  Open student view
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Draft — not on student hub
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
