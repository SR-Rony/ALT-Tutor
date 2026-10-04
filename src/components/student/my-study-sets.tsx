"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  Database,
  FileQuestion,
  KeyRound,
  Layers,
  RefreshCw,
  Search,
} from "lucide-react";
import { AdminStatCard } from "@/components/admin/dashboard/admin-stat-card";
import {
  StudySetCard,
  topicDisplayTitle,
} from "@/components/public/questionbank/study-set-card";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useMyAccess, useQbPrograms } from "@/hooks";
import { canAccessWithTier } from "@/lib/access-tier";
import { formatAccessRemaining, formatShortDate } from "@/lib/format";
import { richTextToPlain } from "@/lib/rich-text";
import type { ApiError } from "@/types";
import type { QbProgramOverview, QbSubtopic } from "@/types/qb.types";
import type {
  PaymentProgram,
  StudentAccessGrant,
  StudentStudySetRef,
} from "@/types/student-dashboard.types";
import { cn } from "@/utils";

type StudySetGrant = StudentAccessGrant & { subtopic: StudentStudySetRef };

type LibrarySet = { sub: QbSubtopic; serial: string; chapter: string };

type LibraryChapter = { id: string; number: number; title: string; sets: LibrarySet[] };

type LibrarySubject = {
  slug: string;
  label: string;
  /** FULL = every set in the subject is open; SETS = only individually bought sets. */
  mode: "FULL" | "SETS";
  accessNote: string;
  chapters: LibraryChapter[];
  setCount: number;
  questionCount: number;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
};

function subjectLabel(program?: Pick<PaymentProgram, "name" | "subject"> | null) {
  if (!program) return "Subject";
  const subject = program.subject?.name;
  return subject && !program.name.toLowerCase().includes(subject.toLowerCase())
    ? `${subject} · ${program.name}`
    : program.name;
}

function plain(value?: string | null) {
  if (!value) return "";
  return richTextToPlain(value) || value;
}

function isSubLocked(sub: QbSubtopic, userTier: string) {
  if (typeof sub.locked === "boolean") return sub.locked;
  return !canAccessWithTier(userTier, sub.badge);
}

function isGrantUsable(grant: StudentAccessGrant) {
  return grant.isActive && !formatAccessRemaining(grant.expiresAt).expired;
}

function wholeAccessNote(grant: StudentAccessGrant) {
  const until = grant.expiresAt ? ` · until ${formatShortDate(grant.expiresAt)}` : " · lifetime";
  if (grant.source === "COURSE") {
    return `Full access with course “${grant.course?.title ?? "linked course"}”${until}`;
  }
  if (grant.source === "ADMIN_GRANT") return `Full access granted by admin${until}`;
  return `Full subject access${until}`;
}

function buildChapters(
  program: QbProgramOverview,
  include: (sub: QbSubtopic) => boolean
): LibraryChapter[] {
  const userTier = program.access?.userTier ?? "FREE";
  return program.qbTopics
    .map((topic) => {
      const title = topicDisplayTitle(topic.title);
      const sets = topic.subtopics
        .map((sub, index) => ({ sub, serial: `${topic.number}.${index + 1}`, chapter: title }))
        .filter(({ sub }) => !isSubLocked(sub, userTier) && include(sub));
      return { id: topic.id, number: topic.number, title, sets };
    })
    .filter((chapter) => chapter.sets.length > 0);
}

/** Everything the student can open in the questionbank, grouped subject → chapter → set. */
function useStudyLibrary() {
  const access = useMyAccess();
  const grants = useMemo(() => access.data ?? [], [access.data]);

  const plan = useMemo(() => {
    const whole = new Map<string, StudentAccessGrant>();
    let allSubjects = false;
    for (const grant of grants) {
      if (grant.source === "STUDY_SET" || !isGrantUsable(grant)) continue;
      if (!grant.program) {
        allSubjects = true;
        continue;
      }
      const current = whole.get(grant.program.slug);
      const end = (g: StudentAccessGrant) =>
        g.expiresAt ? new Date(g.expiresAt).getTime() : Number.POSITIVE_INFINITY;
      if (!current || end(grant) > end(current)) whole.set(grant.program.slug, grant);
    }

    const studySets = grants.filter(
      (g): g is StudySetGrant => g.source === "STUDY_SET" && Boolean(g.subtopic)
    );
    const bought = new Map<string, { program: PaymentProgram | null; count: number }>();
    for (const grant of studySets) {
      if (!isGrantUsable(grant) || grant.subtopic.available === false) continue;
      const slug = grant.subtopic.programSlug;
      if (whole.has(slug)) continue;
      const entry = bought.get(slug) ?? { program: grant.program, count: 0 };
      entry.count += 1;
      bought.set(slug, entry);
    }

    const inactive = studySets.filter(
      (g) => !isGrantUsable(g) || g.subtopic.available === false
    );

    return {
      whole,
      bought,
      allSubjects,
      inactive,
      slugs: [...whole.keys(), ...bought.keys()],
    };
  }, [grants]);

  const programQueries = useQbPrograms(plan.slugs);

  const subjects = useMemo<LibrarySubject[]>(() => {
    return plan.slugs
      .map((slug, index) => {
        const query = programQueries[index];
        const program = query?.data;
        const wholeGrant = plan.whole.get(slug);
        const boughtEntry = plan.bought.get(slug);
        const mode: LibrarySubject["mode"] = wholeGrant ? "FULL" : "SETS";
        const chapters = program
          ? buildChapters(program, (sub) => mode === "FULL" || Boolean(sub.purchased))
          : [];
        const sets = chapters.flatMap((c) => c.sets);
        const label = subjectLabel(
          wholeGrant?.program ??
            boughtEntry?.program ??
            (program ? { name: program.name, subject: program.subject } : null)
        );
        return {
          slug,
          label,
          mode,
          accessNote: wholeGrant
            ? wholeAccessNote(wholeGrant)
            : `${sets.length || boughtEntry?.count || 0} study set${(sets.length || boughtEntry?.count) === 1 ? "" : "s"} bought`,
          chapters,
          setCount: sets.length,
          questionCount: sets.reduce((sum, s) => sum + (s.sub._count?.questions ?? 0), 0),
          isLoading: Boolean(query?.isLoading),
          error: query?.error ?? null,
          refetch: () => void query?.refetch(),
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [plan, programQueries]);

  return {
    subjects,
    inactive: plan.inactive,
    allSubjects: plan.allSubjects,
    isLoading: access.isLoading,
    isFetching: access.isFetching || programQueries.some((q) => q.isFetching),
    error: access.error,
    refetch: () => {
      void access.refetch();
      programQueries.forEach((q) => void q.refetch());
    },
  };
}

function SetGrid({ subject, sets }: { subject: LibrarySubject; sets: LibrarySet[] }) {
  const router = useRouter();
  return (
    <div className="grid gap-x-4 gap-y-6 pt-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sets.map(({ sub, serial }) => {
        const studyHref = ROUTES.subjectQuestionbankStudy(subject.slug, sub.slug);
        return (
          <StudySetCard
            key={sub.id}
            sub={sub}
            serial={serial}
            locked={false}
            onUnlock={() => router.push(studyHref)}
            onOpenStudy={() => router.push(studyHref)}
            examHref={ROUTES.subjectQuestionbankStudyExam(subject.slug, sub.slug)}
          />
        );
      })}
    </div>
  );
}

function SubjectHeader({ subject, compact = false }: { subject: LibrarySubject; compact?: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className={cn("font-bold text-foreground", compact ? "text-base" : "text-xl")}>
          {subject.label}
        </h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold",
              subject.mode === "FULL"
                ? "bg-[#ecfdf3] text-[#067647]"
                : "bg-[#fff8ef] text-[#9a3412]"
            )}
          >
            <KeyRound className="h-3 w-3" aria-hidden />
            {subject.accessNote}
          </span>
          {!subject.isLoading && !subject.error ? (
            <>
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" aria-hidden />
                {subject.setCount} study set{subject.setCount === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1">
                <FileQuestion className="h-3.5 w-3.5" aria-hidden />
                {subject.questionCount} question{subject.questionCount === 1 ? "" : "s"}
              </span>
            </>
          ) : null}
        </p>
      </div>
      <Button asChild size="sm" variant="outline" className="shrink-0">
        <Link href={ROUTES.subjectQuestionbank(subject.slug)}>
          <Database className="h-4 w-4" aria-hidden />
          Open questionbank
        </Link>
      </Button>
    </div>
  );
}

function SubjectState({ subject }: { subject: LibrarySubject }) {
  if (subject.isLoading) {
    return (
      <div className="grid gap-4 pt-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-xl border border-border/60 bg-muted/40" />
        ))}
      </div>
    );
  }
  if (subject.error) {
    return (
      <p className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
        {(subject.error as ApiError)?.message || "Could not load this subject's study sets."}
        <button type="button" className="ml-2 underline" onClick={subject.refetch}>
          Retry
        </button>
      </p>
    );
  }
  return (
    <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      No study sets are published in this subject yet.
    </p>
  );
}

function InactiveSetRow({ grant }: { grant: StudySetGrant }) {
  const set = grant.subtopic;
  const unavailable = set.available === false;
  const studyHref = ROUTES.subjectQuestionbankStudy(set.programSlug, set.slug);
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{plain(set.title)}</p>
        <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          <span>{subjectLabel(grant.program)}</span>
          {set.topicTitle ? <span>{plain(set.topicTitle)}</span> : null}
          <span className="inline-flex items-center gap-1 font-semibold text-accent">
            <Clock3 className="h-3 w-3" aria-hidden />
            {unavailable
              ? "No longer available"
              : `Expired ${grant.expiresAt ? formatShortDate(grant.expiresAt) : ""}`}
          </span>
        </p>
      </div>
      {unavailable ? (
        <span className="text-xs text-muted-foreground">Contact support if you need help.</span>
      ) : (
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link href={studyHref}>
            <KeyRound className="h-4 w-4" aria-hidden />
            Renew access
          </Link>
        </Button>
      )}
    </li>
  );
}

function EmptyLibrary() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <BookOpenCheck className="mx-auto h-9 w-9 text-muted-foreground" aria-hidden />
      <p className="mt-3 font-semibold text-foreground">No study sets yet</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Buy a Gold study set from a subject’s questionbank, or enroll in a course that includes
        one. Everything you unlock appears here, chapter by chapter.
      </p>
      <Button asChild size="sm" className="mt-4">
        <Link href={ROUTES.courses}>Browse courses</Link>
      </Button>
    </div>
  );
}

function AllSubjectsNote() {
  return (
    <div className="rounded-2xl border border-[#abeec5] bg-[#ecfdf3] px-4 py-3 text-sm text-[#067647]">
      <span className="font-semibold">Every subject is unlocked for you.</span> Open any subject’s
      questionbank from the Subjects menu to start practising.
    </div>
  );
}

const DASHBOARD_SETS_PER_SUBJECT = 4;

/** Overview card grid of unlocked study sets for the student dashboard. */
export function MyStudySetsSection() {
  const { subjects, inactive, allSubjects, isLoading, error } = useStudyLibrary();
  const totalSets = subjects.reduce((sum, s) => sum + s.setCount, 0);

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">My study sets</h2>
          <p className="text-sm text-muted-foreground">
            Chapters you’ve unlocked — open a set to practise with mark schemes and videos.
          </p>
        </div>
        {subjects.length > 0 || inactive.length > 0 ? (
          <Link
            href={ROUTES.student.studySets}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all{totalSets ? ` (${totalSets})` : ""}
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
      ) : subjects.length === 0 ? (
        allSubjects ? <AllSubjectsNote /> : <EmptyLibrary />
      ) : (
        <div className="space-y-8">
          {subjects.map((subject) => {
            const sets = subject.chapters.flatMap((c) => c.sets);
            const shown = sets.slice(0, DASHBOARD_SETS_PER_SUBJECT);
            const more = sets.length - shown.length;
            return (
              <div key={subject.slug} className="space-y-2">
                <SubjectHeader subject={subject} compact />
                {shown.length ? <SetGrid subject={subject} sets={shown} /> : <SubjectState subject={subject} />}
                {more > 0 ? (
                  <Link
                    href={ROUTES.student.studySets}
                    className="inline-flex items-center gap-1 pt-1 text-sm font-semibold text-primary hover:underline"
                  >
                    +{more} more study set{more === 1 ? "" : "s"} in {subject.label}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                ) : null}
              </div>
            );
          })}
          {inactive.length ? (
            <p className="text-sm text-muted-foreground">
              {inactive.length} study set{inactive.length === 1 ? " has" : "s have"} expired.{" "}
              <Link href={ROUTES.student.studySets} className="font-semibold text-primary hover:underline">
                Renew
              </Link>
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

/** Full library: subject → chapter → study set cards, with search and expired sets. */
export function StudentStudySetsPage() {
  const { subjects, inactive, allSubjects, isLoading, isFetching, error, refetch } =
    useStudyLibrary();
  const [search, setSearch] = useState("");
  const [activeSlug, setActiveSlug] = useState<string>("ALL");

  const totals = useMemo(
    () => ({
      subjects: subjects.length,
      sets: subjects.reduce((sum, s) => sum + s.setCount, 0),
      questions: subjects.reduce((sum, s) => sum + s.questionCount, 0),
    }),
    [subjects]
  );

  const query = search.trim().toLowerCase();
  const visibleSubjects = useMemo(() => {
    const scoped = activeSlug === "ALL" ? subjects : subjects.filter((s) => s.slug === activeSlug);
    if (!query) return scoped;
    return scoped
      .map((subject) => ({
        ...subject,
        chapters: subject.chapters
          .map((chapter) => ({
            ...chapter,
            sets: chapter.title.toLowerCase().includes(query)
              ? chapter.sets
              : chapter.sets.filter(({ sub, serial }) =>
                  `${serial} ${plain(sub.title)} ${plain(sub.description)}`
                    .toLowerCase()
                    .includes(query)
                ),
          }))
          .filter((chapter) => chapter.sets.length > 0),
      }))
      .filter((subject) => subject.chapters.length > 0);
  }, [subjects, activeSlug, query]);

  if (isLoading) {
    return <PageLoader label="Loading your study sets..." />;
  }

  const hasAnything = subjects.length > 0 || inactive.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="My Study Sets"
          description="Every chapter and study set you can open. Practise with mark schemes and video solutions, or take a timed exam."
          className="mb-0"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={isFetching}
          className="shrink-0"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4 text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Could not load your study sets"}
          <button type="button" className="ml-2 underline" onClick={refetch}>
            Retry
          </button>
        </div>
      ) : null}

      {allSubjects ? <AllSubjectsNote /> : null}

      {subjects.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-3">
          <AdminStatCard label="Subjects" value={totals.subjects} icon={Database} tone="primary" />
          <AdminStatCard label="Study sets open" value={totals.sets} icon={Layers} tone="green" />
          <AdminStatCard
            label="Questions to practise"
            value={totals.questions}
            icon={FileQuestion}
            tone="neutral"
          />
        </section>
      ) : null}

      {!hasAnything && !allSubjects ? <EmptyLibrary /> : null}

      {subjects.length > 0 ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {subjects.length > 1 ? (
            <div role="tablist" aria-label="Filter by subject" className="flex flex-wrap gap-2">
              {[{ slug: "ALL", label: "All subjects", setCount: totals.sets }, ...subjects].map(
                (s) => (
                  <button
                    key={s.slug}
                    type="button"
                    role="tab"
                    aria-selected={activeSlug === s.slug}
                    onClick={() => setActiveSlug(s.slug)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                      activeSlug === s.slug
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-card text-foreground hover:border-primary/40 hover:text-primary"
                    )}
                  >
                    {s.label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 text-[11px]",
                        activeSlug === s.slug ? "bg-white/20" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {s.setCount}
                    </span>
                  </button>
                )
              )}
            </div>
          ) : (
            <span />
          )}
          <div className="relative w-full lg:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chapters or study sets"
              aria-label="Search chapters or study sets"
              className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>
      ) : null}

      {query && visibleSubjects.length === 0 && subjects.length > 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
          No chapters or study sets match “{search}”.
        </p>
      ) : null}

      {visibleSubjects.map((subject) => (
        <section
          key={subject.slug}
          className="space-y-6 rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6"
        >
          <SubjectHeader subject={subject} />
          {subject.chapters.length === 0 ? (
            <SubjectState subject={subject} />
          ) : (
            subject.chapters.map((chapter) => (
              <div key={chapter.id} className="border-t border-border/70 pt-5">
                <p className="text-xs font-medium text-muted-foreground">
                  {chapter.number}. {chapter.title}
                </p>
                <h3 className="mt-0.5 text-lg font-bold text-foreground">{chapter.title}</h3>
                <SetGrid subject={subject} sets={chapter.sets} />
              </div>
            ))
          )}
        </section>
      ))}

      {inactive.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-bold text-foreground">Expired study sets</h2>
            <p className="text-sm text-muted-foreground">
              Renew a set to open its questions, mark schemes and videos again.
            </p>
          </div>
          <ul className="space-y-2">
            {inactive.map((grant) => (
              <InactiveSetRow key={grant.id} grant={grant} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
