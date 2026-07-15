"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Clock,
  FileText,
  PlayCircle,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { roleHomeRoutes, ROUTES } from "@/constants";
import { useCourseDetail } from "@/hooks";
import {
  averageReviewRating,
  formatCourseLevel,
  formatCoursePrice,
  formatLessonDuration,
} from "@/lib/course-format";
import { useAppSelector } from "@/store";
import { cn } from "@/utils";

type CourseDetailViewProps = {
  slug: string;
};

export function CourseDetailView({ slug }: CourseDetailViewProps) {
  const { data: course, isLoading, isError } = useCourseDetail(slug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const user = useAppSelector((s) => s.auth.user);

  const enrollHref = useMemo(() => {
    if (!isAuthenticated) {
      return `${ROUTES.auth.login}?next=${encodeURIComponent(ROUTES.courseDetail(slug))}`;
    }
    if (user?.role === "student") return ROUTES.student.courses;
    if (user?.role && user.role in roleHomeRoutes) {
      return roleHomeRoutes[user.role as keyof typeof roleHomeRoutes];
    }
    return ROUTES.home;
  }, [isAuthenticated, slug, user?.role]);

  if (isLoading) return <CourseDetailSkeleton />;

  if (isError || !course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-extrabold text-[#1a2b5e]">Course not found</h1>
        <p className="mt-3 text-sm text-[#64748b]">
          This course may be unpublished or the link is incorrect.
        </p>
        <Button asChild variant="default" size="pillLg" className="mt-8">
          <Link href={ROUTES.courses}>Back to courses</Link>
        </Button>
      </div>
    );
  }

  const lessonCount = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
  const totalSeconds = course.chapters.reduce(
    (sum, ch) => sum + ch.lessons.reduce((s, l) => s + (l.duration ?? 0), 0),
    0
  );
  const avgRating = averageReviewRating(course.reviews.map((r) => r.rating));
  const enrollLabel = isAuthenticated ? "Go to my courses" : "Enroll now";

  return (
    <div className="relative overflow-x-clip bg-[#f7f9fc]">
      {/* Hero band */}
      <section className="relative border-b border-[#e8edf5]/80 bg-[linear-gradient(180deg,#eef4fb_0%,#f7f9fc_100%)]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-8 h-64 w-64 rounded-full bg-[#fef3c7]/45 blur-3xl" />
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[linear-gradient(135deg,rgba(24,119,242,0.07)_0%,transparent_55%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
          <nav className="mb-6 text-sm font-medium text-[#64748b]">
            <Link href={ROUTES.home} className="hover:text-[#ef3239]">
              Home
            </Link>
            <span className="mx-2 text-[#cbd5e1]">/</span>
            <Link href={ROUTES.courses} className="hover:text-[#ef3239]">
              Courses
            </Link>
            <span className="mx-2 text-[#cbd5e1]">/</span>
            <span className="text-[#1a2b5e]">{course.title}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              {course.category ? (
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1877f2]">
                  {course.category.name}
                </p>
              ) : null}
              <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight text-[#1a2b5e] sm:text-4xl lg:text-[2.65rem]">
                {course.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#64748b] sm:text-base">
                {course.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#475569]">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Users className="h-4 w-4 text-[#1877f2]" aria-hidden />
                  {course.studentsCount} students
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <BookOpen className="h-4 w-4 text-[#ef3239]" aria-hidden />
                  {lessonCount} lessons
                </span>
                {totalSeconds > 0 ? (
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Clock className="h-4 w-4 text-[#f97316]" aria-hidden />
                    {formatLessonDuration(totalSeconds)}
                  </span>
                ) : null}
                {course.reviews.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Star className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" aria-hidden />
                    {avgRating.toFixed(1)} ({course.reviews.length})
                  </span>
                ) : null}
              </div>

              <p className="mt-5 text-sm text-[#64748b]">
                Instructor{" "}
                <span className="font-bold text-[#1a2b5e]">{course.teacher.name}</span>
                <span className="mx-2 text-[#cbd5e1]">·</span>
                <span className="rounded-md bg-[#eff6ff] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[#1877f2]">
                  {formatCourseLevel(course.level)}
                </span>
              </p>
            </div>

            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#e8edf5] shadow-[0_20px_48px_-18px_rgba(26,43,94,0.28)] lg:aspect-[16/11]">
              {course.thumbnail ? (
                <Image
                  src={course.thumbnail}
                  alt={course.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#93c5fd] to-[#2563eb]">
                  <BookOpen className="h-16 w-16 text-white/80" aria-hidden />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem] xl:grid-cols-[1fr_22rem]">
          <div className="space-y-8">
            <div className="rounded-2xl border border-[#e8edf5]/80 bg-white p-6 shadow-[0_12px_36px_-20px_rgba(26,43,94,0.14)] sm:p-8">
              <h2 className="text-xl font-extrabold text-[#1a2b5e]">About this course</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#64748b] sm:text-base">
                {course.description}
              </p>
            </div>

            <div className="rounded-2xl border border-[#e8edf5]/80 bg-white p-6 shadow-[0_12px_36px_-20px_rgba(26,43,94,0.14)] sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-[#1a2b5e]">Course curriculum</h2>
                  <p className="mt-1 text-sm text-[#64748b]">
                    {course.chapters.length} chapter{course.chapters.length === 1 ? "" : "s"} ·{" "}
                    {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              {course.chapters.length === 0 ? (
                <p className="mt-6 text-sm text-[#64748b]">Curriculum will be available soon.</p>
              ) : (
                <div className="mt-6 space-y-3">
                  {course.chapters.map((chapter, index) => (
                    <ChapterAccordion
                      key={chapter.id}
                      index={index}
                      title={chapter.title}
                      description={chapter.description}
                      lessons={chapter.lessons}
                      defaultOpen={index === 0}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#e8edf5]/80 bg-white p-6 shadow-[0_12px_36px_-20px_rgba(26,43,94,0.14)] sm:p-8">
              <h2 className="text-xl font-extrabold text-[#1a2b5e]">Student reviews</h2>
              {course.reviews.length === 0 ? (
                <p className="mt-4 text-sm text-[#64748b]">No reviews yet for this course.</p>
              ) : (
                <ul className="mt-6 space-y-4">
                  {course.reviews.map((review) => (
                    <li
                      key={review.id}
                      className="rounded-xl border border-[#eef2f8] bg-[#f8fafc] px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#1a2b5e]">{review.student.name}</p>
                          <div className="mt-1 flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-3.5 w-3.5",
                                  i < review.rating
                                    ? "fill-[#f59e0b] text-[#f59e0b]"
                                    : "text-[#e2e8f0]"
                                )}
                                aria-hidden
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.comment ? (
                        <p className="mt-3 text-sm leading-relaxed text-[#64748b]">{review.comment}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Sticky enroll panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-[#e8edf5]/80 bg-white shadow-[0_16px_40px_-18px_rgba(26,43,94,0.18)]">
              <div className="bg-[linear-gradient(135deg,#1a2b5e_0%,#1877f2_55%,#ef3239_100%)] px-6 py-5 text-white">
                <p className="text-sm font-medium text-white/80">Course price</p>
                <p className="mt-1 text-3xl font-extrabold tracking-tight">
                  {formatCoursePrice(course.price)}
                </p>
              </div>
              <div className="space-y-4 p-6">
                <ul className="space-y-2.5 text-sm text-[#475569]">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                    {formatCourseLevel(course.level)} level
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1877f2]" />
                    {lessonCount} lessons included
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#f97316]" />
                    Lifetime access after enrollment
                  </li>
                </ul>

                <Button asChild variant="default" size="pillLg" className="w-full">
                  <Link href={enrollHref}>{enrollLabel}</Link>
                </Button>
                <Button asChild variant="outline" size="pillLg" className="w-full">
                  <Link href={ROUTES.questionbank(slug)}>Questionbank</Link>
                </Button>
                <Button asChild variant="secondary" size="pillLg" className="w-full">
                  <Link href={ROUTES.courses}>Browse more courses</Link>
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function ChapterAccordion({
  index,
  title,
  description,
  lessons,
  defaultOpen,
}: {
  index: number;
  title: string;
  description?: string | null;
  lessons: { id: string; title: string; type: string; duration?: number | null }[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));

  return (
    <div className="overflow-hidden rounded-xl border border-[#eef2f8] bg-[#fafbfd]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
        aria-expanded={open}
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#94a3b8]">
            Chapter {index + 1}
          </p>
          <p className="mt-0.5 text-sm font-bold text-[#1a2b5e] sm:text-base">{title}</p>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-[#64748b] sm:text-sm">{description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs font-semibold text-[#64748b] sm:inline">
            {lessons.length} lessons
          </span>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-[#64748b] transition-transform duration-300",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </div>
      </button>

      {open ? (
        <ul className="border-t border-[#eef2f8] px-2 pb-2 sm:px-3">
          {lessons.map((lesson) => {
            const duration = formatLessonDuration(lesson.duration);
            const isVideo = lesson.type === "VIDEO";
            return (
              <li
                key={lesson.id}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-[#475569]"
              >
                {isVideo ? (
                  <PlayCircle className="h-4 w-4 shrink-0 text-[#ef3239]" aria-hidden />
                ) : (
                  <FileText className="h-4 w-4 shrink-0 text-[#1877f2]" aria-hidden />
                )}
                <span className="min-w-0 flex-1 font-medium text-[#1a2b5e]">{lesson.title}</span>
                {duration ? (
                  <span className="shrink-0 text-xs font-semibold text-[#94a3b8]">{duration}</span>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="h-4 w-48 animate-pulse rounded bg-[#e8edf5]" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="h-4 w-28 animate-pulse rounded bg-[#e8edf5]" />
          <div className="h-10 w-full animate-pulse rounded bg-[#e8edf5]" />
          <div className="h-20 w-full animate-pulse rounded bg-[#e8edf5]" />
        </div>
        <div className="aspect-[16/10] animate-pulse rounded-2xl bg-[#e8edf5]" />
      </div>
    </div>
  );
}
