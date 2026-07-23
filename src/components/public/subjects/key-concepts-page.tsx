"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Clock3, Lock, PlayCircle } from "lucide-react";
import { GoldUnlockModal } from "@/components/public/questionbank/gold-unlock-modal";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useKeyConceptLessons } from "@/hooks";
import { normalizeAccessBadge, tierBadgeClass, tierLabel } from "@/lib/access-tier";
import type { ApiError } from "@/types";
import type { KeyConceptLesson } from "@/types/key-concept.types";
import { cn } from "@/utils";
import { ResourceGridSkeleton } from "./resource-grid-skeleton";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = { programSlug: string };

const FALLBACK_THUMB = "/images/video-lessons/video-lesson-1.png";

function formatDuration(sec?: number | null) {
  if (sec == null || sec <= 0) return null;
  const m = Math.max(1, Math.round(sec / 60));
  return `${m} min`;
}

function contentLabel(type: string) {
  if (type === "VIDEO") return "Video";
  if (type === "MIXED") return "Mixed";
  return "Article";
}

export function KeyConceptsPage({ programSlug }: Props) {
  const { programName, isLoading: menuLoading } = useProgramContext(programSlug);
  const { data, isLoading, isFetching, error, refetch } = useKeyConceptLessons(programSlug);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<{
    title: string;
    requiredTier: string;
  }>({ title: "", requiredTier: "GOLD" });

  const lessons = data?.lessons ?? [];

  const sections = useMemo(() => {
    const map = new Map<
      string,
      { id: string; chapterTitle: string; topicTitle: string; lessons: KeyConceptLesson[] }
    >();
    for (const lesson of lessons) {
      const topic = lesson.topic;
      const key = topic?.id ?? "other";
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          chapterTitle: topic
            ? `Chapter ${topic.number}: ${topic.title}`
            : "Lessons",
          topicTitle: topic?.title ?? "Key Concepts",
          lessons: [],
        });
      }
      map.get(key)!.lessons.push(lesson);
    }
    return Array.from(map.values());
  }, [lessons]);

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "key-concepts",
    resourceLabel: "Key Concepts",
    resourceHref: ROUTES.subjectResource(programSlug, "key-concepts"),
  });

  const openUnlock = (lesson: KeyConceptLesson) => {
    setUnlockTarget({
      title: lesson.title,
      requiredTier: String(lesson.accessTier ?? "GOLD"),
    });
    setUnlockOpen(true);
  };

  if (menuLoading && isLoading) {
    return <PageLoader label="Loading key concepts..." />;
  }

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title={`${programName} Key Concepts`}
        description="Short lessons for each chapter — read or watch, then practice in the Questionbank."
        icon={<PlayCircle className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      />

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 md:px-6 md:py-14">
        {isFetching ? (
          <p className="text-sm text-muted-foreground" role="status">
            Refreshing lessons…
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-accent">
            {(error as unknown as ApiError)?.message || "Failed to load lessons"}
          </p>
        ) : null}

        {isLoading ? (
          <ResourceGridSkeleton count={4} columns="4" />
        ) : sections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No key concept lessons published yet for this program.
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

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {section.lessons.map((lesson) => {
                  const locked = Boolean(lesson.locked);
                  const badge = normalizeAccessBadge(lesson.accessTier);
                  const href = ROUTES.subjectKeyConceptLesson(programSlug, lesson.slug);
                  const duration = formatDuration(lesson.durationSec);
                  const thumb = lesson.thumbnailUrl || FALLBACK_THUMB;

                  return (
                    <article
                      key={lesson.id}
                      className={cn(
                        "flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_24px_-16px_rgba(24,119,242,0.16)] transition",
                        !locked &&
                          "hover:border-primary/30 hover:shadow-[0_12px_30px_-14px_rgba(24,119,242,0.24)]"
                      )}
                    >
                      <div className="relative h-28 w-full bg-primary-muted sm:h-32">
                        <Image
                          src={thumb}
                          alt={lesson.title}
                          fill
                          className="object-cover"
                          unoptimized={thumb.startsWith("http")}
                        />
                        {locked ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a]/45">
                            <Lock className="h-6 w-6 text-white" aria-hidden />
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                            {contentLabel(lesson.contentType)}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase text-white",
                              tierBadgeClass(badge)
                            )}
                          >
                            {badge !== "FREE" ? <Lock className="h-3 w-3" aria-hidden /> : null}
                            {tierLabel(badge)}
                          </span>
                        </div>
                        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold text-foreground">
                          {lesson.title}
                        </h3>
                        {lesson.summary ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {lesson.summary}
                          </p>
                        ) : null}
                        {duration ? (
                          <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock3 className="h-3.5 w-3.5" aria-hidden />
                            {duration}
                          </p>
                        ) : (
                          <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <BookOpen className="h-3.5 w-3.5" aria-hidden />
                            Lesson
                          </p>
                        )}
                        <div className="mt-auto pt-4">
                          {locked ? (
                            <Button
                              type="button"
                              size="pill"
                              variant="outline"
                              className="w-full border-[#d4a017]/50 text-[#9a3412]"
                              onClick={() => openUnlock(lesson)}
                            >
                              <Lock className="h-3.5 w-3.5" aria-hidden />
                              Unlock {tierLabel(badge)}
                            </Button>
                          ) : (
                            <Button asChild size="pill" className="w-full">
                              <Link href={href}>Open lesson</Link>
                            </Button>
                          )}
                        </div>
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
          returnPath={`${ROUTES.subjectResource(programSlug, "key-concepts")}?unlocked=1`}
        />
      ) : null}
    </div>
  );
}
