"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  FileText,
  PlayCircle,
} from "lucide-react";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useCourseDetail, useStudentCourses } from "@/hooks";
import type { CourseLesson } from "@/types/course.types";
import { cn } from "@/utils";

type Props = { slug: string };

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
      if (parts[0] === "shorts" && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
    }
    return null;
  } catch {
    return null;
  }
}

function LessonPlayer({ lesson }: { lesson: CourseLesson }) {
  const url = lesson.contentUrl ?? null;
  const yt = url ? youtubeEmbedUrl(url) : null;

  if (yt) {
    return (
      <iframe
        key={yt}
        src={yt}
        title={lesson.title}
        className="aspect-video w-full rounded-xl"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  if (url && String(lesson.type).toUpperCase() === "VIDEO") {
    return (
      <video key={url} src={url} controls className="aspect-video w-full rounded-xl bg-black" />
    );
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl bg-muted">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        {String(lesson.type).toUpperCase() === "VIDEO" ? (
          <PlayCircle className="h-7 w-7" aria-hidden />
        ) : (
          <FileText className="h-7 w-7" aria-hidden />
        )}
      </span>
      <p className="text-sm font-medium text-foreground">{lesson.title}</p>
      {url ? (
        <Button asChild size="sm" variant="outline">
          <a href={url} target="_blank" rel="noreferrer">
            Open lesson content
          </a>
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">No content uploaded for this lesson yet.</p>
      )}
    </div>
  );
}

export function StudentCourseLearnPage({ slug }: Props) {
  const { data: course, isLoading } = useCourseDetail(slug);
  const { data: enrollments = [] } = useStudentCourses();
  const [lessonIndex, setLessonIndex] = useState(0);

  const lessons = useMemo(() => {
    if (!course) return [];
    return course.chapters.flatMap((chapter) =>
      chapter.lessons.map((lesson) => ({ lesson, chapterTitle: chapter.title }))
    );
  }, [course]);

  const enrollment = useMemo(
    () => enrollments.find((item) => item.course.slug === slug) ?? null,
    [enrollments, slug]
  );

  if (isLoading && !course) {
    return <PageLoader label="Loading course..." />;
  }

  if (!course) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
        <p className="text-sm text-muted-foreground">Course not found.</p>
        <Button asChild size="sm" className="mt-4">
          <Link href={ROUTES.student.courses}>Back to My Courses</Link>
        </Button>
      </div>
    );
  }

  const current = lessons[lessonIndex] ?? null;
  const totalMinutes = lessons.reduce(
    (sum, { lesson }) => sum + (Number(lesson.duration) || 0),
    0
  );
  const progress = enrollment?.progress ?? 0;
  const isCompleted = String(enrollment?.status ?? "").toUpperCase() === "COMPLETED";

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <Link href={ROUTES.student.courses}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to My Courses
        </Link>
      </Button>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Left: course header + player */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PlayCircle className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Course{course.category?.name ? ` · ${course.category.name}` : ""}
              </p>
              <h1 className="mt-0.5 text-xl font-bold text-foreground md:text-2xl">
                {course.title}
              </h1>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            {current ? (
              <>
                <LessonPlayer lesson={current.lesson} />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{current.chapterTitle}</p>
                    <p className="font-semibold text-foreground">{current.lesson.title}</p>
                  </div>
                  {current.lesson.duration ? (
                    <span className="text-xs text-muted-foreground">
                      {current.lesson.duration} min
                    </span>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-xl bg-muted">
                <p className="text-sm text-muted-foreground">No lessons published yet.</p>
              </div>
            )}
          </div>

          {lessons.length > 0 ? (
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={lessonIndex === 0}
                onClick={() => setLessonIndex((i) => Math.max(0, i - 1))}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Previous lesson
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                {lessonIndex + 1} / {lessons.length}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={lessonIndex >= lessons.length - 1}
                onClick={() => setLessonIndex((i) => Math.min(lessons.length - 1, i + 1))}
              >
                Next lesson
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ) : null}
        </div>

        {/* Right: progress + chapters */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <h2 className="text-base font-bold text-foreground">Course Progress</h2>
            <div className="mt-4 rounded-xl bg-[#ecfdf3] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">Overall Progress</span>
                <span className="font-bold text-accent-green">{progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-accent-green transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {Math.round((progress / 100) * lessons.length)}/{lessons.length} lessons
                </span>
                <span>{totalMinutes} min total</span>
              </div>
              <p className="mt-3 flex items-center gap-1.5 border-t border-accent-green/20 pt-3 text-xs text-muted-foreground">
                <Award className="h-3.5 w-3.5" aria-hidden />
                {isCompleted ? "Certificate available" : "Certificate not available"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <h2 className="text-base font-bold text-foreground">Chapters</h2>
            <div className="mt-4 space-y-3">
              {course.chapters.length === 0 ? (
                <p className="text-sm text-muted-foreground">No chapters yet.</p>
              ) : (
                course.chapters.map((chapter) => {
                  const chapterMinutes = chapter.lessons.reduce(
                    (sum, lesson) => sum + (Number(lesson.duration) || 0),
                    0
                  );
                  return (
                    <div key={chapter.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-foreground">{chapter.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {chapter.lessons.length} lessons · {chapterMinutes} min
                        </span>
                      </div>
                      {chapter.lessons.length > 0 ? (
                        <ul className="mt-3 space-y-1">
                          {chapter.lessons.map((lesson) => {
                            const flatIndex = lessons.findIndex(
                              (entry) => entry.lesson.id === lesson.id
                            );
                            const isCurrent = flatIndex === lessonIndex;
                            return (
                              <li key={lesson.id}>
                                <button
                                  type="button"
                                  onClick={() => setLessonIndex(Math.max(0, flatIndex))}
                                  className={cn(
                                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                                    isCurrent
                                      ? "bg-primary/10 font-semibold text-primary"
                                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                  )}
                                >
                                  {String(lesson.type).toUpperCase() === "VIDEO" ? (
                                    <PlayCircle className="h-4 w-4 shrink-0" aria-hidden />
                                  ) : (
                                    <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                                  )}
                                  <span className="flex-1 truncate">{lesson.title}</span>
                                  {lesson.duration ? (
                                    <span className="text-xs">{lesson.duration}m</span>
                                  ) : null}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
