"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  FileQuestion,
  KeyRound,
  Search,
  Timer,
} from "lucide-react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useMyAccess } from "@/hooks";
import { formatAccessRemaining } from "@/lib/format";
import { richTextToPlain } from "@/lib/rich-text";
import type { ApiError } from "@/types";
import type {
  PaymentProgram,
  StudentAccessGrant,
  StudentStudySetRef,
} from "@/types/student-dashboard.types";
import { cn } from "@/utils";

type StudySetGrant = StudentAccessGrant & { subtopic: StudentStudySetRef };

function subjectLabel(program?: PaymentProgram | null) {
  if (!program) return "Subject";
  const subject = program.subject?.name;
  return subject && subject !== program.name ? `${subject} · ${program.name}` : program.name;
}

function plain(value?: string | null) {
  if (!value) return "";
  return richTextToPlain(value) || value;
}

function isUsable(grant: StudySetGrant) {
  return (
    grant.isActive &&
    !formatAccessRemaining(grant.expiresAt).expired &&
    grant.subtopic.available !== false
  );
}

/** Splits the student's unlocks into bought study sets and whole-subject access. */
function useMyStudySets() {
  const query = useMyAccess();
  const { studySets, subjects } = useMemo(() => {
    const grants = query.data ?? [];
    const sets = grants
      .filter((g): g is StudySetGrant => g.source === "STUDY_SET" && Boolean(g.subtopic))
      .sort((a, b) => Number(isUsable(b)) - Number(isUsable(a)));
    const seen = new Set<string>();
    const whole = grants.filter((g) => {
      if (g.source === "STUDY_SET" || !g.isActive) return false;
      const key = g.program?.id ?? "all";
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return { studySets: sets, subjects: whole };
  }, [query.data]);
  return { ...query, studySets, subjects };
}

function StudySetCard({ grant }: { grant: StudySetGrant }) {
  const set = grant.subtopic;
  const remaining = formatAccessRemaining(grant.expiresAt);
  const expired = !grant.isActive || remaining.expired;
  const unavailable = set.available === false;
  const usable = !expired && !unavailable;
  const studyHref = ROUTES.subjectQuestionbankStudy(set.programSlug, set.slug);
  const title = plain(set.title);
  const topic = plain(set.topicTitle);
  const count = set.questionCount ?? null;

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-card p-4 transition-all",
        usable
          ? "border-border hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_28px_rgba(24,119,242,0.1)]"
          : "border-dashed border-border bg-muted/20"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wide text-primary">
          {subjectLabel(grant.program)}
        </p>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            usable
              ? "bg-[#ecfdf3] text-accent-green"
              : unavailable
                ? "bg-muted text-muted-foreground"
                : "bg-accent/10 text-accent"
          )}
        >
          {usable ? "Unlocked" : unavailable ? "Unavailable" : "Expired"}
        </span>
      </div>

      {topic ? <p className="mt-2 truncate text-xs text-muted-foreground">{topic}</p> : null}
      {usable ? (
        <Link
          href={studyHref}
          className="mt-0.5 line-clamp-2 text-base font-bold leading-snug text-foreground hover:text-primary"
        >
          {title}
        </Link>
      ) : (
        <p className="mt-0.5 line-clamp-2 text-base font-bold leading-snug text-foreground">
          {title}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {count != null ? (
          <span className="inline-flex items-center gap-1">
            <FileQuestion className="h-3.5 w-3.5" aria-hidden />
            {count} question{count === 1 ? "" : "s"}
          </span>
        ) : null}
        <span
          className={cn(
            "inline-flex items-center gap-1",
            expired && !unavailable && "font-semibold text-accent"
          )}
        >
          <Clock3 className="h-3.5 w-3.5" aria-hidden />
          {remaining.label}
        </span>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {usable ? (
          <>
            <Button asChild size="sm" className="flex-1">
              <Link href={studyHref}>
                <BookOpenCheck className="h-4 w-4" aria-hidden />
                Practise
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="flex-1">
              <Link href={ROUTES.subjectQuestionbankStudyExam(set.programSlug, set.slug)}>
                <Timer className="h-4 w-4" aria-hidden />
                Exam mode
              </Link>
            </Button>
          </>
        ) : unavailable ? (
          <p className="text-xs text-muted-foreground">
            This study set has been taken down. Contact support if you need help.
          </p>
        ) : (
          <Button asChild size="sm" variant="outline" className="w-full">
            <Link href={studyHref}>
              <KeyRound className="h-4 w-4" aria-hidden />
              Renew access
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}

function EmptyStudySets() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <BookOpenCheck className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
      <p className="mt-3 font-semibold text-foreground">No study sets yet</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        When you buy a Gold study set from a subject’s questionbank, it shows up here so you can
        jump straight into its questions.
      </p>
      <Button asChild size="sm" variant="outline" className="mt-4">
        <Link href={ROUTES.home}>Explore subjects</Link>
      </Button>
    </div>
  );
}

const DASHBOARD_LIMIT = 6;

/** Compact list of bought study sets for the student overview. */
export function MyStudySetsSection() {
  const { studySets, isLoading, error } = useMyStudySets();
  const visible = studySets.slice(0, DASHBOARD_LIMIT);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">My study sets</h2>
          <p className="text-sm text-muted-foreground">
            Questions you’ve unlocked — open one to start practising.
          </p>
        </div>
        {studySets.length > 0 ? (
          <Link
            href={ROUTES.student.studySets}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all{studySets.length > DASHBOARD_LIMIT ? ` (${studySets.length})` : ""}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>

      {isLoading ? (
        <PageLoader label="Loading your study sets..." />
      ) : error ? (
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Could not load your study sets"}
        </p>
      ) : visible.length === 0 ? (
        <EmptyStudySets />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((grant) => (
            <StudySetCard key={grant.id} grant={grant} />
          ))}
        </div>
      )}
    </section>
  );
}

/** Full page: every bought study set grouped by subject, plus whole-subject access. */
export function StudentStudySetsPage() {
  const { studySets, subjects, isLoading, error, refetch } = useMyStudySets();
  const [search, setSearch] = useState("");

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? studySets.filter((g) =>
          [plain(g.subtopic.title), plain(g.subtopic.topicTitle), subjectLabel(g.program)]
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : studySets;
    const map = new Map<string, { label: string; items: StudySetGrant[] }>();
    for (const grant of filtered) {
      const key = grant.program?.id ?? grant.subtopic.programSlug;
      const group = map.get(key) ?? { label: subjectLabel(grant.program), items: [] };
      group.items.push(grant);
      map.set(key, group);
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [studySets, search]);

  if (isLoading) {
    return <PageLoader label="Loading your study sets..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Study Sets"
        description="Every Gold study set you’ve unlocked. Practise with mark schemes and videos, or take a timed exam."
        className="mb-0"
      />

      {error ? (
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Could not load your study sets"}
          <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
            Retry
          </button>
        </p>
      ) : null}

      {subjects.length > 0 ? (
        <section className="rounded-2xl border border-[#f5d0a8] bg-[#fff8ef] p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#9a3412]">
            <KeyRound className="h-4 w-4" aria-hidden />
            Whole subjects unlocked
          </h2>
          <p className="mt-0.5 text-xs text-[#9a3412]/80">
            Every Gold study set in these subjects is open to you.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {subjects.map((grant) =>
              grant.program ? (
                <Link
                  key={grant.id}
                  href={ROUTES.subjectQuestionbank(grant.program.slug)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#f5d0a8] bg-white px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {subjectLabel(grant.program)}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              ) : (
                <span
                  key={grant.id}
                  className="rounded-full border border-[#f5d0a8] bg-white px-3 py-1.5 text-sm font-semibold text-foreground"
                >
                  All subjects
                </span>
              )
            )}
          </div>
        </section>
      ) : null}

      {studySets.length === 0 ? (
        <EmptyStudySets />
      ) : (
        <>
          {studySets.length > 6 ? (
            <div className="relative max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search study sets or topics"
                aria-label="Search study sets"
                className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
          ) : null}

          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">No study sets match “{search}”.</p>
          ) : (
            groups.map((group) => (
              <section key={group.label} className="space-y-3">
                <h2 className="text-base font-bold text-foreground">
                  {group.label}
                  <span className="ml-2 text-sm font-medium text-muted-foreground">
                    {group.items.length}
                  </span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((grant) => (
                    <StudySetCard key={grant.id} grant={grant} />
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      )}
    </div>
  );
}
