"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock3, Columns, Download, ExternalLink, FileText, ImageIcon, Lock, PlayCircle } from "lucide-react";
import { GoldUnlockModal } from "@/components/public/questionbank/gold-unlock-modal";
import { PageLoader, SecureVideoPlayer } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { looksLikeHtml } from "@/lib/rich-text";
import { ROUTES } from "@/constants";
import { useKeyConceptLesson } from "@/hooks";
import { useAppSelector } from "@/store";
import { normalizeAccessBadge, tierBadgeClass, tierLabel } from "@/lib/access-tier";
import type { ApiError } from "@/types";
import { cn } from "@/utils";
import { getInlinePdfUrl } from "@/utils/pdf-viewer";
import { ResourceHero, SubjectBreadcrumbNav, useSubjectBreadcrumbs } from "./";
import { useProgramContext } from "./use-program-context";

type Props = {
  programSlug: string;
  lessonSlug: string;
};

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
  const user = useAppSelector((state) => state.auth.user);
  const watermarkText = user ? `${user.name} · ${user.phone}` : null;
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [splitRatio, setSplitRatio] = useState<"50-50" | "65-35" | "35-65" | "100-0" | "0-100">("50-50");
  const [activeNoteTab, setActiveNoteTab] = useState<"text" | "pdf" | "image">("text");

  const lesson = data?.lesson;
  const locked = Boolean(lesson?.locked);
  const badge = normalizeAccessBadge(lesson?.accessTier);

  const hasVideo = Boolean(lesson?.videoUrl);
  const hasPdf = Boolean(lesson?.pdfUrl);
  const hasText = Boolean(lesson?.bodyMarkdown?.trim());
  const hasImage = Boolean(lesson?.thumbnailUrl?.trim());
  const hasNotes = hasPdf || hasText || hasImage;

  useEffect(() => {
    if (lesson) {
      if (hasText) setActiveNoteTab("text");
      else if (hasPdf) setActiveNoteTab("pdf");
      else if (hasImage) setActiveNoteTab("image");
    }
  }, [lesson, hasText, hasPdf, hasImage]);

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
        programSlug={programSlug}
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

      <div className={cn("mx-auto space-y-6 px-4 py-8 md:px-6", hasVideo && hasNotes ? "max-w-[90rem] md:px-8" : "max-w-4xl")}>
        {locked ? (
          <section className="rounded-2xl border border-[#f5d0a8] bg-[#fff8ef] p-6 text-center">
            <Lock className="mx-auto h-8 w-8 text-[#9a3412]" aria-hidden />
            <h2 className="mt-3 text-lg font-bold text-foreground">
              Unlock {tierLabel(badge)} to read this lesson
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Summary is visible; full article, video, and PDF stay locked until you have access.
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
            {/* When both Video & Notes exist: Sizing Toolbar & Side-by-Side Layout */}
            {hasVideo && hasNotes ? (
              <div className="space-y-4">
                {/* Size Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Columns className="h-4 w-4 text-primary" />
                    <span className="text-xs sm:text-sm font-bold text-foreground">Layout Sizing</span>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      (Video & Notes Side-by-Side)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        ["50-50", "Balanced 50:50"],
                        ["65-35", "Large Video"],
                        ["35-65", "Large Notes"],
                        ["100-0", "Video Only"],
                        ["0-100", "Notes Only"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSplitRatio(id)}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                          splitRatio === id
                            ? "bg-primary text-white shadow-sm"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Side by side layout grid */}
                <div
                  className={cn(
                    "grid gap-6 transition-all",
                    splitRatio === "50-50" && "grid-cols-1 lg:grid-cols-2",
                    splitRatio === "65-35" && "grid-cols-1 lg:grid-cols-[1.8fr_1fr]",
                    splitRatio === "35-65" && "grid-cols-1 lg:grid-cols-[1fr_1.8fr]",
                    splitRatio === "100-0" && "grid-cols-1",
                    splitRatio === "0-100" && "grid-cols-1"
                  )}
                >
                  {/* Left Column: Video */}
                  {splitRatio !== "0-100" && (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4 text-primary" />
                        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                          Video Lesson
                        </h2>
                      </div>
                      <SecureVideoPlayer
                        title={lesson.title}
                        directUrl={lesson.videoUrl!}
                        watermarkText={watermarkText}
                        rounded
                        className="overflow-hidden border border-border shadow-sm"
                      />
                    </div>
                  )}

                  {/* Right Column: Notes */}
                  {splitRatio !== "100-0" && (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            Notes (Text / PDF / Image)
                          </h2>
                        </div>
                      </div>

                      {/* Format Tabs if multiple note formats exist */}
                      {Number(hasText) + Number(hasPdf) + Number(hasImage) > 1 ? (
                        <div className="inline-flex w-full rounded-xl border border-border bg-muted/40 p-1">
                          {hasText ? (
                            <button
                              type="button"
                              onClick={() => setActiveNoteTab("text")}
                              className={cn(
                                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                                activeNoteTab === "text"
                                  ? "bg-card text-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>Text Notes</span>
                            </button>
                          ) : null}

                          {hasPdf ? (
                            <button
                              type="button"
                              onClick={() => setActiveNoteTab("pdf")}
                              className={cn(
                                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                                activeNoteTab === "pdf"
                                  ? "bg-card text-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>PDF Document</span>
                            </button>
                          ) : null}

                          {hasImage ? (
                            <button
                              type="button"
                              onClick={() => setActiveNoteTab("image")}
                              className={cn(
                                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                                activeNoteTab === "image"
                                  ? "bg-card text-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <ImageIcon className="h-3.5 w-3.5" />
                              <span>Image Note</span>
                            </button>
                          ) : null}
                        </div>
                      ) : null}

                      {/* Notes Content Display */}
                      <div className="min-h-[440px] rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
                        {activeNoteTab === "text" && hasText && (
                          <div className="prose max-w-none text-foreground">
                            {looksLikeHtml(lesson.bodyMarkdown!) ? (
                              <RichTextContent
                                html={lesson.bodyMarkdown!}
                                className="text-base leading-relaxed text-foreground"
                              />
                            ) : (
                              <MarkdownBody text={lesson.bodyMarkdown!} />
                            )}
                          </div>
                        )}

                        {activeNoteTab === "pdf" && hasPdf && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-muted-foreground">Attached Document</span>
                              <Button asChild size="sm" variant="outline">
                                <a href={lesson.pdfUrl!} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                  Open PDF in new tab
                                </a>
                              </Button>
                            </div>
                            <iframe
                              key={lesson.pdfUrl!}
                              src={getInlinePdfUrl(lesson.pdfUrl!)}
                              title={lesson.title}
                              className="h-[55vh] w-full rounded-xl border border-border bg-white"
                            />
                          </div>
                        )}

                        {activeNoteTab === "image" && hasImage && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-muted-foreground">Diagram / Infographic Note</span>
                              <Button asChild size="sm" variant="outline">
                                <a href={lesson.thumbnailUrl!} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                  View full resolution
                                </a>
                              </Button>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-border bg-muted/10 p-2 text-center">
                              <img
                                src={lesson.thumbnailUrl!}
                                alt={lesson.title}
                                className="mx-auto max-h-[55vh] rounded-lg object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : hasVideo ? (
              /* Video Only */
              <div className="space-y-3">
                <SecureVideoPlayer
                  title={lesson.title}
                  directUrl={lesson.videoUrl!}
                  watermarkText={watermarkText}
                  rounded
                  className="overflow-hidden border border-border shadow-sm"
                />
              </div>
            ) : hasNotes ? (
              /* Notes Only */
              <div className="space-y-3">
                {Number(hasText) + Number(hasPdf) + Number(hasImage) > 1 ? (
                  <div className="inline-flex w-full rounded-xl border border-border bg-muted/40 p-1">
                    {hasText ? (
                      <button
                        type="button"
                        onClick={() => setActiveNoteTab("text")}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                          activeNoteTab === "text"
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Text Notes</span>
                      </button>
                    ) : null}

                    {hasPdf ? (
                      <button
                        type="button"
                        onClick={() => setActiveNoteTab("pdf")}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                          activeNoteTab === "pdf"
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>PDF Document</span>
                      </button>
                    ) : null}

                    {hasImage ? (
                      <button
                        type="button"
                        onClick={() => setActiveNoteTab("image")}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                          activeNoteTab === "image"
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>Image Note</span>
                      </button>
                    ) : null}
                  </div>
                ) : null}

                <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                  {activeNoteTab === "text" && hasText && (
                    <div>
                      {looksLikeHtml(lesson.bodyMarkdown!) ? (
                        <RichTextContent
                          html={lesson.bodyMarkdown!}
                          className="text-base leading-relaxed text-foreground"
                        />
                      ) : (
                        <MarkdownBody text={lesson.bodyMarkdown!} />
                      )}
                    </div>
                  )}

                  {activeNoteTab === "pdf" && hasPdf && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">PDF Document</span>
                        <Button asChild size="sm" variant="outline">
                          <a href={lesson.pdfUrl!} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            Open PDF in new tab
                          </a>
                        </Button>
                      </div>
                      <iframe
                        key={lesson.pdfUrl!}
                        src={getInlinePdfUrl(lesson.pdfUrl!)}
                        title={lesson.title}
                        className="h-[70vh] w-full rounded-xl border border-border bg-white"
                      />
                    </div>
                  )}

                  {activeNoteTab === "image" && hasImage && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Infographic / Diagram Note</span>
                        <Button asChild size="sm" variant="outline">
                          <a href={lesson.thumbnailUrl!} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            View full resolution
                          </a>
                        </Button>
                      </div>
                      <div className="overflow-hidden rounded-xl border border-border bg-muted/10 p-2 text-center">
                        <img
                          src={lesson.thumbnailUrl!}
                          alt={lesson.title}
                          className="mx-auto max-h-[70vh] rounded-lg object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No lesson content yet.</p>
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
