"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Download,
  FileText,
  Lock,
  Paperclip,
  PlayCircle,
} from "lucide-react";
import { PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useCourseDetail, useStudentCourses } from "@/hooks";
import { formatLessonDuration } from "@/lib/course-format";
import { apiClient } from "@/services/api-client";
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
  const type = String(lesson.type).toUpperCase();

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

  if (url && type === "VIDEO") {
    return (
      <video key={url} src={url} controls className="aspect-video w-full rounded-xl bg-black" />
    );
  }

  if (url && type === "PDF") {
    return (
      <iframe
        key={url}
        src={url}
        title={lesson.title}
        className="h-[70vh] w-full rounded-xl border border-border bg-white"
      />
    );
  }

  if (type === "TEXT" && lesson.body) {
    return (
      <div className="min-h-[240px] rounded-xl border border-border bg-card p-6">
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{lesson.body}</p>
      </div>
    );
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl bg-muted">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        {type === "VIDEO" ? (
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
  const searchParams = useSearchParams();
  const requestedLessonId = searchParams.get("lesson");
  const { data: course, isLoading } = useCourseDetail(slug);
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useStudentCourses();
  const [lessonIndex, setLessonIndex] = useState(0);
  const [contentLessons, setContentLessons] = useState<CourseLesson[] | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);

  const enrollment = useMemo(
    () =>
      enrollments.find(
        (item) =>
          item.course.slug === slug && String(item.status).toUpperCase() !== "CANCELLED"
      ) ?? null,
    [enrollments, slug]
  );
  const isFree = Number(course?.price ?? 0) <= 0;
  const canAccess = Boolean(enrollment) || isFree;

  useEffect(() => {
    if (!course || !canAccess) {
      setContentLessons(null);
      return;
    }

    // Free published courses already include watchable content in the public detail payload.
    if (isFree) {
      setContentError(null);
      setContentLessons(
        course.chapters.flatMap((chapter) =>
          chapter.lessons.map((lesson) => ({
            ...lesson,
            attachments: lesson.attachments ?? [],
          }))
        )
      );
      return;
    }

    let cancelled = false;
    const load = async () => {
      setContentError(null);
      try {
        const chapterLessons = await Promise.all(
          course.chapters.map(async (chapter) => {
            const response = await apiClient.get<CourseLesson[]>(
              `/lessons?chapterId=${encodeURIComponent(chapter.id)}`
            );
            return (response.data ?? []).map((lesson) => ({
              ...lesson,
              attachments: lesson.attachments ?? [],
            }));
          })
        );
        if (!cancelled) {
          setContentLessons(chapterLessons.flat().sort((a, b) => a.order - b.order));
        }
      } catch {
        if (!cancelled) {
          setContentError("Could not load lesson content. Please try again.");
          setContentLessons([]);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [canAccess, course, isFree]);

  const lessons = useMemo(() => {
    if (!course) return [];
    const byId = new Map((contentLessons ?? []).map((lesson) => [lesson.id, lesson]));
    return course.chapters.flatMap((chapter) =>
      chapter.lessons.map((lesson) => ({
        lesson: byId.get(lesson.id) ?? lesson,
        chapterTitle: chapter.title,
      }))
    );
  }, [course, contentLessons]);

  useEffect(() => {
    if (!requestedLessonId || lessons.length === 0) return;
    const requestedIndex = lessons.findIndex(({ lesson }) => lesson.id === requestedLessonId);
    if (requestedIndex >= 0) setLessonIndex(requestedIndex);
  }, [lessons, requestedLessonId]);

  if ((isLoading || enrollmentsLoading) && !course) {
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

  if (!canAccess) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
        <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="text-xl font-bold text-foreground">Enrollment required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is a paid course. Enroll to access lessons, videos, and downloadable files.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button asChild size="sm">
            <Link href={ROUTES.courseDetail(slug)}>View course details</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={ROUTES.student.courses}>Back to My Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  const current = lessons[lessonIndex] ?? null;
  const totalSeconds = lessons.reduce(
    (sum, { lesson }) => sum + (Number(lesson.duration) || 0),
    0
  );
  const progress = enrollment?.progress ?? 0;
  const isCompleted = String(enrollment?.status ?? "").toUpperCase() === "COMPLETED";
  const programSlug = course.programLinks?.[0]?.program?.slug;

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm" className="gap-1.5">
        <Link href={ROUTES.student.courses}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to My Courses
        </Link>
      </Button>

      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
          Lessons
        </span>
        {programSlug ? (
          <Link
            href={ROUTES.subjectQuestionbank(programSlug)}
            className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Questionbank
          </Link>
        ) : null}
        <Link
          href={ROUTES.student.assessments}
          className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Exams
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
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
            {contentError ? (
              <p className="mb-3 text-sm text-accent">{contentError}</p>
            ) : null}
            {current ? (
              <>
                <LessonPlayer lesson={current.lesson} />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{current.chapterTitle}</p>
                    <p className="font-semibold text-foreground">{current.lesson.title}</p>
                    {current.lesson.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{current.lesson.description}</p>
                    ) : null}
                  </div>
                  {current.lesson.duration ? (
                    <span className="text-xs text-muted-foreground">
                      {formatLessonDuration(current.lesson.duration)}
                    </span>
                  ) : null}
                </div>

                {(current.lesson.attachments?.length ?? 0) > 0 ? (
                  <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
                    <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Paperclip className="h-3.5 w-3.5" aria-hidden />
                      Lesson files
                    </p>
                    <ul className="space-y-2">
                      {current.lesson.attachments!.map((file) => (
                        <li key={file.id}>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm font-medium text-primary hover:underline"
                          >
                            <Download className="h-4 w-4" aria-hidden />
                            {file.filename}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-xl bg-muted">
                <p className="text-sm text-muted-foreground">
                  {contentLessons == null ? "Loading lessons..." : "No lessons published yet."}
                </p>
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
                <span>{formatLessonDuration(totalSeconds) || "0 min"} total</span>
              </div>
              <p className="mt-3 flex items-center gap-1.5 border-t border-accent-green/20 pt-3 text-xs text-muted-foreground">
                <Award className="h-3.5 w-3.5" aria-hidden />
                {course.hasCertificate === false
                  ? "No certificate for this course"
                  : isCompleted
                    ? "Certificate available"
                    : "Certificate not available yet"}
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
                          {chapter.lessons.length} lessons · {formatLessonDuration(chapterMinutes) || "0 min"}
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
                                    <span className="text-xs">
                                      {formatLessonDuration(lesson.duration)}
                                    </span>
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
