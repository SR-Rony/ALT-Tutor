"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  GraduationCap,
  Layers,
  Loader2,
  Lock,
  Phone,
  Play,
  PlayCircle,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config";
import { roleHomeRoutes, ROUTES } from "@/constants";
import { useCourseDetail, useCheckout, useEnrollCourse, useStudentCourses } from "@/hooks";
import {
  averageReviewRating,
  formatCourseLevel,
  formatCoursePrice,
  formatLessonDuration,
} from "@/lib/course-format";
import { formatShortDate } from "@/lib/format";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import { cn } from "@/utils";

type CourseDetailViewProps = {
  slug: string;
};

type DetailTab = "description" | "instructor" | "reviews";

const FAQS = [
  {
    id: "faq-1",
    question: "How do I access the course after enrolling?",
    answer:
      "Once enrolled, open your student dashboard and go to My Courses. Click Continue on the course to start learning right away.",
  },
  {
    id: "faq-2",
    question: "Do I get lifetime access?",
    answer:
      "Yes. After enrollment you keep access to all course lessons, so you can learn at your own pace and revisit anytime.",
  },
  {
    id: "faq-3",
    question: "Is there a certificate?",
    answer:
      "A certificate becomes available on your dashboard once you complete 100% of the course lessons.",
  },
];

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < Math.round(rating) ? "fill-[#f59e0b] text-[#f59e0b]" : "text-[#e2e8f0]"
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function CourseDetailView({ slug }: CourseDetailViewProps) {
  const router = useRouter();
  const { data: course, isLoading, isError } = useCourseDetail(slug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const user = useAppSelector((s) => s.auth.user);
  const isStudent = isAuthenticated && user?.role === "student";

  const { data: myCourses = [] } = useStudentCourses(isStudent);
  const enrollCourse = useEnrollCourse();
  const checkout = useCheckout();
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("description");

  const enrollment = useMemo(
    () =>
      myCourses.find(
        (item) =>
          item.course.slug === slug &&
          String(item.status).toUpperCase() !== "CANCELLED"
      ) ?? null,
    [myCourses, slug]
  );
  const isEnrolled = Boolean(enrollment);

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
  const learnHref = ROUTES.student.courseLearn(slug);
  const loginNextHref = `${ROUTES.auth.login}?next=${encodeURIComponent(ROUTES.courseDetail(slug))}`;
  const isFree = Number(course.price) <= 0;

  const lessonHref = (lessonId: string) =>
    `${learnHref}?lesson=${encodeURIComponent(lessonId)}`;

  const onEnroll = async (lessonId?: string) => {
    setEnrollError(null);
    try {
      await enrollCourse.mutateAsync(course.id);
      router.push(lessonId ? lessonHref(lessonId) : learnHref);
    } catch (err) {
      setEnrollError((err as ApiError)?.message || "Enrollment failed. Please try again.");
    }
  };

  const onCheckout = async () => {
    setEnrollError(null);
    try {
      const result = await checkout.mutateAsync({ courseId: course.id });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      setEnrollError("Checkout URL was not returned. Please try again.");
    } catch (err) {
      setEnrollError((err as ApiError)?.message || "Checkout failed. Please try again.");
    }
  };

  const onOpenLesson = (lessonId: string) => {
    if (isEnrolled || (isStudent && isFree)) {
      // Free courses are watchable without purchase; optional enroll still available from sidebar.
      router.push(lessonHref(lessonId));
      return;
    }
    if (!isAuthenticated) {
      router.push(
        `${ROUTES.auth.login}?next=${encodeURIComponent(lessonHref(lessonId))}`
      );
      return;
    }
    document.getElementById("enroll")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const tabs: { id: DetailTab; label: string }[] = [
    { id: "description", label: "Description" },
    { id: "instructor", label: "Instructor" },
    { id: "reviews", label: `Reviews (${course.reviews.length})` },
  ];

  return (
    <div className="relative overflow-x-clip bg-[#f7f9fc]">
      {/* Hero band */}
      <section className="relative border-b border-[#e8edf5]/80 bg-[linear-gradient(180deg,#eef4fb_0%,#f7f9fc_100%)]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-8 h-64 w-64 rounded-full bg-[#fef3c7]/45 blur-3xl" />
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[linear-gradient(135deg,rgba(24,119,242,0.07)_0%,transparent_55%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
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

          {course.category ? (
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1877f2]">
              {course.category.name}
            </p>
          ) : null}
          <h1 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-[#1a2b5e] sm:text-4xl lg:text-[2.65rem]">
            {course.title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#64748b] sm:text-base">
            {course.summary?.trim() || course.description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#475569]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#1a2b5e]">
              <RatingStars rating={avgRating} />
              {course.reviews.length > 0 ? (
                <>
                  {avgRating.toFixed(1)}{" "}
                  <span className="font-medium text-[#64748b]">
                    ({course.reviews.length} review{course.reviews.length === 1 ? "" : "s"})
                  </span>
                </>
              ) : (
                <span className="font-medium text-[#64748b]">No reviews yet</span>
              )}
            </span>

            <span className="inline-flex items-center gap-2 font-medium">
              <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#1877f2] text-xs font-bold text-white">
                {course.teacher.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.teacher.avatar}
                    alt={course.teacher.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  course.teacher.name.charAt(0).toUpperCase()
                )}
              </span>
              <span className="font-bold text-[#1a2b5e]">{course.teacher.name}</span>
            </span>

            {course.updatedAt || course.createdAt ? (
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Calendar className="h-4 w-4 text-[#f97316]" aria-hidden />
                Last updated {formatShortDate(course.updatedAt || course.createdAt!)}
              </span>
            ) : null}

            <span className="rounded-md bg-[#eff6ff] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[#1877f2]">
              {formatCourseLevel(course.level)}
            </span>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem] xl:grid-cols-[1fr_22rem]">
          <div className="space-y-6">
            {/* Preview / promo player */}
            <div className="overflow-hidden rounded-2xl border border-[#e8edf5]/80 bg-white shadow-[0_16px_40px_-18px_rgba(26,43,94,0.18)]">
              <div className="relative aspect-video bg-[#e8edf5]">
                {course.promoVideoUrl ? (
                  <PromoPlayer url={course.promoVideoUrl} title={course.title} />
                ) : course.thumbnail ? (
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#93c5fd] to-[#2563eb]">
                    <BookOpen className="h-16 w-16 text-white/80" aria-hidden />
                  </div>
                )}
                {!course.promoVideoUrl ? (
                  <>
                    <div className="absolute inset-0 bg-black/10" />
                    <Link
                      href={isEnrolled ? learnHref : isAuthenticated ? "#enroll" : loginNextHref}
                      aria-label={isEnrolled ? "Start course" : "Enroll to start"}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#ef3239] text-white shadow-[0_12px_30px_-8px_rgba(239,50,57,0.6)] transition-transform hover:scale-105">
                        <Play className="ml-1 h-7 w-7 fill-current" aria-hidden />
                      </span>
                    </Link>
                  </>
                ) : null}
              </div>
            </div>

            {/* Tabs */}
            <div className="rounded-2xl border border-[#e8edf5]/80 bg-white shadow-[0_12px_36px_-20px_rgba(26,43,94,0.14)]">
              <div className="flex gap-1 border-b border-[#eef2f8] px-4 pt-3 sm:px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                      activeTab === tab.id
                        ? "border-b-2 border-[#ef3239] text-[#ef3239]"
                        : "text-[#64748b] hover:text-[#1a2b5e]"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6 sm:p-8">
                {activeTab === "description" ? (
                  <div>
                    <h2 className="text-xl font-extrabold text-[#1a2b5e]">About this course</h2>
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#64748b] sm:text-base">
                      {course.description}
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {[
                        { icon: Layers, label: `${course.chapters.length} chapters` },
                        { icon: BookOpen, label: `${lessonCount} lessons` },
                        ...(totalSeconds > 0
                          ? [{ icon: Clock, label: formatLessonDuration(totalSeconds) }]
                          : []),
                        { icon: Users, label: `${course.studentsCount} students enrolled` },
                      ].map(({ icon: Icon, label }) => (
                        <div
                          key={label}
                          className="flex items-center gap-3 rounded-xl bg-[#f8fafc] px-4 py-3 text-sm font-medium text-[#1a2b5e]"
                        >
                          <Icon className="h-4 w-4 text-[#1877f2]" aria-hidden />
                          {label}
                        </div>
                      ))}
                    </div>

                    {(course.outcomes?.length ?? 0) > 0 ? (
                      <div className="mt-8">
                        <h3 className="text-base font-bold text-[#1a2b5e]">What you will learn</h3>
                        <ul className="mt-3 space-y-2">
                          {course.outcomes!.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-[#475569]">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16a34a]" aria-hidden />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {(course.requirements?.length ?? 0) > 0 ? (
                      <div className="mt-8">
                        <h3 className="text-base font-bold text-[#1a2b5e]">Requirements</h3>
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#475569]">
                          {course.requirements!.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {course.targetAudience ? (
                      <div className="mt-8">
                        <h3 className="text-base font-bold text-[#1a2b5e]">Who this course is for</h3>
                        <p className="mt-2 text-sm text-[#64748b]">{course.targetAudience}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {activeTab === "instructor" ? (
                  <div>
                    <h2 className="text-xl font-extrabold text-[#1a2b5e]">Meet your instructor</h2>
                    <div className="mt-5 flex items-start gap-4">
                      <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1877f2] text-xl font-bold text-white">
                        {course.teacher.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={course.teacher.avatar}
                            alt={course.teacher.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          course.teacher.name.charAt(0).toUpperCase()
                        )}
                      </span>
                      <div>
                        <p className="text-lg font-bold text-[#1a2b5e]">{course.teacher.name}</p>
                        <p className="mt-0.5 text-sm text-[#64748b]">
                          {course.category?.name ?? "Course"} Instructor
                        </p>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#475569]">
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-[#1877f2]" aria-hidden />
                            {course.studentsCount} students
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <GraduationCap className="h-4 w-4 text-[#ef3239]" aria-hidden />
                            {lessonCount} lessons in this course
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeTab === "reviews" ? (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-xl font-extrabold text-[#1a2b5e]">Student reviews</h2>
                      {course.reviews.length > 0 ? (
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#1a2b5e]">
                          <RatingStars rating={avgRating} />
                          {avgRating.toFixed(1)} / 5
                        </span>
                      ) : null}
                    </div>
                    {course.reviews.length === 0 ? (
                      <p className="mt-4 text-sm text-[#64748b]">No reviews yet for this course.</p>
                    ) : (
                      <ul className="mt-6 space-y-4">
                        {course.reviews.map((review) => (
                          <li
                            key={review.id}
                            className="rounded-xl border border-[#eef2f8] bg-[#f8fafc] px-4 py-4"
                          >
                            <p className="font-semibold text-[#1a2b5e]">{review.student.name}</p>
                            <div className="mt-1">
                              <RatingStars rating={review.rating} />
                            </div>
                            {review.comment ? (
                              <p className="mt-3 text-sm leading-relaxed text-[#64748b]">
                                {review.comment}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Curriculum */}
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
                      canAccess={isEnrolled || isFree}
                      isFree={isFree}
                      isPending={enrollCourse.isPending}
                      onOpenLesson={onOpenLesson}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* FAQ */}
            <div className="rounded-2xl border border-[#e8edf5]/80 bg-white p-6 shadow-[0_12px_36px_-20px_rgba(26,43,94,0.14)] sm:p-8">
              <h2 className="text-xl font-extrabold text-[#1a2b5e]">
                Frequently asked questions
              </h2>
              <div className="mt-5 space-y-3">
                {FAQS.map((faq) => (
                  <FaqAccordion key={faq.id} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          </div>

          {/* Sticky enroll panel */}
          <aside id="enroll" className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-[#e8edf5]/80 bg-white shadow-[0_16px_40px_-18px_rgba(26,43,94,0.18)]">
              <div className="bg-[linear-gradient(135deg,#1a2b5e_0%,#1877f2_55%,#ef3239_100%)] px-6 py-5 text-white">
                <p className="text-sm font-medium text-white/80">Course price</p>
                <p className="mt-1 flex items-baseline gap-2.5">
                  <span className="text-3xl font-extrabold tracking-tight">
                    {formatCoursePrice(course.price)}
                  </span>
                  {course.regularPrice && course.regularPrice > course.price ? (
                    <>
                      <span className="text-lg font-semibold text-white/60 line-through">
                        {formatCoursePrice(course.regularPrice)}
                      </span>
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
                        {Math.round(
                          ((course.regularPrice - course.price) / course.regularPrice) * 100
                        )}
                        % off
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="space-y-4 p-6">
                {isEnrolled ? (
                  <>
                    <div className="flex items-center justify-center gap-2 rounded-full bg-[#ecfdf3] px-4 py-3 text-sm font-bold text-[#16a34a]">
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                      Already Enrolled
                    </div>
                    <Button asChild variant="default" size="pillLg" className="w-full">
                      <Link href={learnHref}>
                        <Play className="h-4 w-4" aria-hidden />
                        Start Course
                      </Link>
                    </Button>
                  </>
                ) : isStudent ? (
                  isFree ? (
                    <Button
                      type="button"
                      variant="default"
                      size="pillLg"
                      className="w-full"
                      disabled={enrollCourse.isPending}
                      onClick={() => void onEnroll()}
                    >
                      {enrollCourse.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Play className="h-4 w-4" aria-hidden />
                      )}
                      Start Course — Free
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        variant="default"
                        size="pillLg"
                        className="w-full"
                        disabled={checkout.isPending}
                        onClick={() => void onCheckout()}
                      >
                        {checkout.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : null}
                        Buy course — {formatCoursePrice(course.price)}
                      </Button>
                      <p className="text-center text-xs leading-relaxed text-[#64748b]">
                        Secure checkout. Access unlocks after payment confirmation.
                      </p>
                    </div>
                  )
                ) : isAuthenticated ? (
                  <Button asChild variant="default" size="pillLg" className="w-full">
                    <Link
                      href={
                        user?.role && user.role in roleHomeRoutes
                          ? roleHomeRoutes[user.role as keyof typeof roleHomeRoutes]
                          : ROUTES.home
                      }
                    >
                      Go to dashboard
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="default" size="pillLg" className="w-full">
                    <Link href={loginNextHref}>
                      {isFree ? "Start Course — Free" : "Log in to enroll"}
                    </Link>
                  </Button>
                )}
                {enrollError ? (
                  <p className="text-center text-sm text-[#ef3239]">{enrollError}</p>
                ) : null}

                <Button asChild variant="outline" size="pillLg" className="w-full">
                  <Link href={ROUTES.questionbank(slug)}>Questionbank</Link>
                </Button>
                <Button asChild variant="secondary" size="pillLg" className="w-full">
                  <Link href={ROUTES.courses}>Browse more courses</Link>
                </Button>

                <a
                  href={`tel:${siteConfig.phone}`}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#f5f0fe] px-4 py-3 text-sm font-semibold text-[#7c3aed] transition-colors hover:bg-[#ede4fd]"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  Need help? Call {siteConfig.phone}
                </a>

                <ul className="space-y-3 border-t border-[#eef2f8] pt-4 text-sm text-[#475569]">
                  <li className="flex items-center gap-2.5">
                    <GraduationCap className="h-4 w-4 shrink-0 text-[#1877f2]" aria-hidden />
                    <span>
                      Instructor:{" "}
                      <span className="font-semibold text-[#1a2b5e]">{course.teacher.name}</span>
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Layers className="h-4 w-4 shrink-0 text-[#ef3239]" aria-hidden />
                    {course.chapters.length} chapter{course.chapters.length === 1 ? "" : "s"}
                  </li>
                  <li className="flex items-center gap-2.5">
                    <BookOpen className="h-4 w-4 shrink-0 text-[#f97316]" aria-hidden />
                    {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
                    {totalSeconds > 0 ? ` · ${formatLessonDuration(totalSeconds)}` : ""}
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 shrink-0 text-[#16a34a]" aria-hidden />
                    {course.studentsCount} students enrolled
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16a34a]" aria-hidden />
                    {course.lifetimeAccess === false
                      ? "Access while enrolled"
                      : "Lifetime access after enrollment"}
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Award className="h-4 w-4 shrink-0 text-[#f59e0b]" aria-hidden />
                    {course.hasCertificate === false
                      ? "No certificate for this course"
                      : "Certificate on completion"}
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function FaqAccordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-[#eef2f8] bg-[#fafbfd]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-semibold text-[#1a2b5e] sm:px-5"
        aria-expanded={open}
      >
        {question}
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-[#64748b] transition-transform duration-300",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <p className="border-t border-[#eef2f8] px-4 py-4 text-sm leading-relaxed text-[#64748b] sm:px-5">
          {answer}
        </p>
      ) : null}
    </div>
  );
}

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

function PromoPlayer({ url, title }: { url: string; title: string }) {
  const yt = youtubeEmbedUrl(url);
  if (yt) {
    return (
      <iframe
        src={yt}
        title={`${title} promo`}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return <video src={url} controls className="absolute inset-0 h-full w-full bg-black object-contain" />;
}

function ChapterAccordion({
  index,
  title,
  description,
  lessons,
  defaultOpen,
  canAccess,
  isFree,
  isPending,
  onOpenLesson,
}: {
  index: number;
  title: string;
  description?: string | null;
  lessons: { id: string; title: string; type: string; duration?: number | null }[];
  defaultOpen?: boolean;
  canAccess: boolean;
  isFree: boolean;
  isPending: boolean;
  onOpenLesson: (lessonId: string) => void;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const chapterDuration = lessons.reduce(
    (sum, lesson) => sum + (Number(lesson.duration) || 0),
    0
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[#d8c8f1] bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[#fbf9ff] sm:px-5"
        aria-expanded={open}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#9b51e0] text-xs font-bold text-white">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#4b3a78] sm:text-base">{title}</p>
            {description ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-[#7b7192]">{description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs font-medium text-[#7b7192] sm:inline">
            {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
            {chapterDuration > 0 ? ` · ${formatLessonDuration(chapterDuration)}` : ""}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[#7b7192] transition-transform duration-300",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </div>
      </button>

      {open ? (
        <ul className="space-y-2 border-t border-[#eee7f8] bg-[#fdfcff] p-2.5 sm:p-3">
          {lessons.map((lesson, lessonIndex) => {
            const duration = formatLessonDuration(lesson.duration);
            const isVideo = lesson.type === "VIDEO";
            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => onOpenLesson(lesson.id)}
                  disabled={isPending}
                  className="group flex w-full items-center gap-3 rounded-lg border border-[#ddd3ea] bg-white px-3 py-3 text-left text-sm transition-all hover:border-[#9b51e0] hover:shadow-sm disabled:cursor-wait disabled:opacity-60"
                  aria-label={`${canAccess ? "Open" : "Unlock"} lesson ${lesson.title}`}
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef5ff] text-[#1877f2] transition-colors group-hover:bg-[#e5efff]">
                    {isVideo ? (
                      <Play className="ml-0.5 h-3.5 w-3.5 fill-current" aria-hidden />
                    ) : (
                      <FileText className="h-3.5 w-3.5" aria-hidden />
                    )}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-[#6b6480]">
                    {index + 1}.{lessonIndex + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-[#3f3654]">
                    {lesson.title}
                  </span>
                  {duration ? (
                    <span className="hidden shrink-0 text-xs text-[#8a829b] sm:inline">
                      {duration}
                    </span>
                  ) : null}
                  {canAccess ? (
                    isFree ? (
                      <span className="shrink-0 rounded-full bg-[#e9fbf2] px-2 py-0.5 text-[10px] font-bold text-[#16a36a]">
                        Free
                      </span>
                    ) : (
                      <PlayCircle className="h-4 w-4 shrink-0 text-[#9b51e0]" aria-hidden />
                    )
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-[#8a829b]">
                      <Lock className="h-3.5 w-3.5" aria-hidden />
                      Enroll
                    </span>
                  )}
                </button>
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
      <div className="mt-6 space-y-4">
        <div className="h-4 w-28 animate-pulse rounded bg-[#e8edf5]" />
        <div className="h-10 w-2/3 animate-pulse rounded bg-[#e8edf5]" />
        <div className="h-20 w-full animate-pulse rounded bg-[#e8edf5]" />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="aspect-video animate-pulse rounded-2xl bg-[#e8edf5]" />
        <div className="h-80 animate-pulse rounded-2xl bg-[#e8edf5]" />
      </div>
    </div>
  );
}
