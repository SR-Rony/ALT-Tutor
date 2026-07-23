"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock3, Lock, PlayCircle } from "lucide-react";
import { GoldUnlockModal } from "@/components/public/questionbank/gold-unlock-modal";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useKeyConceptLesson } from "@/hooks";
import { normalizeAccessBadge, tierBadgeClass, tierLabel } from "@/lib/access-tier";
import type { ApiError } from "@/types";
import { cn } from "@/utils";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = {
  programSlug: string;
  lessonSlug: string;
};

function youtubeEmbedUrl(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
  } catch {
    return null;
  }
  return null;
}

function MarkdownBody({ text }: { text: string }) {
  const blocks = useMemo(() => {
    return text
      .trim()
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);
  }, [text]);

  return (
    <div className="space-y-4 text-sm leading-relaxed text-foreground md:text-base">
      {blocks.map((block, index) => {
        if (block.startsWith("### ")) {
          return (
            <h3 key={index} className="text-base font-bold text-foreground md:text-lg">
              {block.slice(4)}
            </h3>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h2 key={index} className="text-lg font-bold text-foreground md:text-xl">
              {block.slice(3)}
            </h2>
          );
        }
        if (block.startsWith("# ")) {
          return (
            <h1 key={index} className="text-xl font-bold text-foreground md:text-2xl">
              {block.slice(2)}
            </h1>
          );
        }
        if (block.split("\n").every((line) => /^[-*]\s+/.test(line) || !line.trim())) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5 text-muted-foreground">
              {block.split("\n").map((line, i) => (
                <li key={i} className="text-foreground">
                  {line.replace(/^[-*]\s+/, "")}
                </li>
              ))}
            </ul>
          );
        }
        if (block.split("\n").every((line) => /^\d+\.\s+/.test(line) || !line.trim())) {
          return (
            <ol key={index} className="list-decimal space-y-1 pl-5">
              {block.split("\n").map((line, i) => (
                <li key={i}>{line.replace(/^\d+\.\s+/, "")}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={index} className="whitespace-pre-wrap text-foreground">
            {block}
          </p>
        );
      })}
    </div>
  );
}

export function KeyConceptLessonPage({ programSlug, lessonSlug }: Props) {
  const { programName, isLoading: menuLoading } = useProgramContext(programSlug);
  const { data, isLoading, error, refetch } = useKeyConceptLesson(programSlug, lessonSlug);
  const [unlockOpen, setUnlockOpen] = useState(false);

  const lesson = data?.lesson;
  const locked = Boolean(lesson?.locked);
  const badge = normalizeAccessBadge(lesson?.accessTier);
  const embed = youtubeEmbedUrl(lesson?.videoUrl);

  const breadcrumbs = useSubjectBreadcrumbs({
    programSlug,
    resourceSlug: "key-concepts",
    resourceLabel: "Key Concepts",
    resourceHref: ROUTES.subjectResource(programSlug, "key-concepts"),
    topicLabel: lesson?.title ?? "Lesson",
  });

  if ((menuLoading && isLoading) || (isLoading && !lesson)) {
    return <PageLoader label="Loading lesson..." />;
  }

  if (error || !lesson) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Lesson not found"}
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href={ROUTES.subjectResource(programSlug, "key-concepts")}>
            Back to Key Concepts
          </Link>
        </Button>
      </div>
    );
  }

  const duration =
    lesson.durationSec != null && lesson.durationSec > 0
      ? `${Math.max(1, Math.round(lesson.durationSec / 60))} min`
      : null;

  return (
    <div className="bg-background pb-16">
      <ResourceHero
        title={lesson.title}
        subtitle={`${programName}${lesson.topic ? ` · ${lesson.topic.title}` : ""}`}
        description={
          lesson.summary ||
          "Focused key concept lesson. Practice in the Questionbank when you’re ready."
        }
        icon={<PlayCircle className="h-7 w-7 text-primary" aria-hidden />}
        breadcrumbs={<SubjectBreadcrumbNav items={breadcrumbs} />}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase text-white",
              tierBadgeClass(badge)
            )}
          >
            {badge !== "FREE" ? <Lock className="h-3 w-3" aria-hidden /> : null}
            {tierLabel(badge)}
          </span>
          {duration ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card px-3 py-1 text-xs font-semibold">
              <Clock3 className="h-3.5 w-3.5" aria-hidden />
              {duration}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-card px-3 py-1 text-xs font-semibold">
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              {lesson.contentType}
            </span>
          )}
        </div>
      </ResourceHero>

      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
        {locked ? (
          <section className="rounded-2xl border border-[#f5d0a8] bg-[#fff8ef] p-6 text-center">
            <Lock className="mx-auto h-8 w-8 text-[#9a3412]" aria-hidden />
            <h2 className="mt-3 text-lg font-bold text-foreground">
              Unlock {tierLabel(badge)} to read this lesson
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Summary is visible; full article and video stay locked until you have access.
            </p>
            {lesson.summary ? (
              <p className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-foreground">
                {lesson.summary}
              </p>
            ) : null}
            <Button
              type="button"
              size="pill"
              className="mt-5 border-[#d4a017]/50 bg-[#fff8ef] text-[#9a3412] hover:bg-[#fff1df]"
              onClick={() => setUnlockOpen(true)}
            >
              Unlock {tierLabel(badge)}
            </Button>
          </section>
        ) : (
          <>
            {embed ? (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="aspect-video w-full">
                  <iframe
                    title={lesson.title}
                    src={embed}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : lesson.videoUrl ? (
              <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
                Video:{" "}
                <a
                  href={lesson.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  Open link
                </a>
              </p>
            ) : null}

            {lesson.bodyMarkdown ? (
              <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <MarkdownBody text={lesson.bodyMarkdown} />
              </section>
            ) : (
              <p className="text-sm text-muted-foreground">No lesson body yet.</p>
            )}
          </>
        )}

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="pill">
            <Link href={ROUTES.subjectResource(programSlug, "key-concepts")}>
              All key concepts
            </Link>
          </Button>
          {!locked && lesson.practiceSubtopicSlug ? (
            <Button asChild size="pill" variant="outline" className="border-primary/30">
              <Link
                href={ROUTES.subjectQuestionbankStudy(
                  programSlug,
                  lesson.practiceSubtopicSlug
                )}
              >
                Practice this topic
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {data?.program ? (
        <GoldUnlockModal
          open={unlockOpen}
          onClose={() => setUnlockOpen(false)}
          programId={data.program.id}
          programName={data.program.name}
          programSlug={programSlug}
          subtopicTitle={lesson.title}
          requiredTier={String(lesson.accessTier)}
          onUnlocked={() => {
            void refetch();
          }}
          returnPath={ROUTES.subjectKeyConceptLesson(programSlug, lessonSlug)}
        />
      ) : null}
    </div>
  );
}
