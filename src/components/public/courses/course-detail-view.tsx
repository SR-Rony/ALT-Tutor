"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Award,
  BookOpen,
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
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config";
import { roleHomeRoutes, ROUTES } from "@/constants";
import { useCourseDetail, useCheckout, useEnrollCourse, useStudentCourses } from "@/hooks";
import {
  averageReviewRating,
  formatCoursePrice,
  formatLessonDuration,
} from "@/lib/course-format";
import { richTextExcerpt, richTextToPlain } from "@/lib/rich-text";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { SecureVideoPlayer } from "@/components/shared/secure-video-player";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import type { CourseDetail, CourseLesson } from "@/types/course.types";
import { cn } from "@/utils";
import { getInlinePdfUrl, isPlayableVideoLesson, resolveLessonPdfUrl } from "@/utils/pdf-viewer";

type CourseDetailViewProps = {
  slug: string;
};

type SectionId = "curriculum" | "features" | "about" | "reviews" | "faq";

const SECTION_NAV: { id: SectionId; label: string }[] = [
  { id: "curriculum", label: "Curriculum" },
  { id: "features", label: "Course features" },
  { id: "about", label: "About course" },
  { id: "reviews", label: "Reviews" },
  { id: "faq", label: "FAQ" },
];

const SECTION_IDS: SectionId[] = ["curriculum", "features", "about", "reviews", "faq"];

const STICKY_HEADER_GAP_PX = 16;

function getSiteHeaderHeight(): number {
  return window.matchMedia("(min-width: 1024px)").matches ? 72 : 64;
}

function getSectionNavBarHeight(): number {
  const nav = document.getElementById("course-section-nav");
  return nav?.getBoundingClientRect().height ?? 48;
}

function getSectionScrollOffset(): number {
  return getSiteHeaderHeight() + STICKY_HEADER_GAP_PX + getSectionNavBarHeight();
}

function scrollToSectionElement(sectionId: string, behavior: ScrollBehavior = "smooth") {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - getSectionScrollOffset();
  window.scrollTo({ top: Math.max(0, top), behavior });
}

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
  const searchParams = useSearchParams();
  const { data: course, isLoading, isError } = useCourseDetail(slug);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const user = useAppSelector((s) => s.auth.user);
  const isStudent = isAuthenticated && user?.role === "student";

  const { data: myCourses = [] } = useStudentCourses(isStudent);
  const enrollCourse = useEnrollCourse();
  const checkout = useCheckout();
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("curriculum");
  const [modalLessonId, setModalLessonId] = useState<string | null>(
    () => searchParams.get("lesson")
  );
  const [promoModalOpen, setPromoModalOpen] = useState(false);

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

  const allLessons = useMemo(
    () => course?.chapters.flatMap((chapter) => chapter.lessons) ?? [],
    [course]
  );

  const modalLesson = useMemo(
    () => allLessons.find((lesson) => lesson.id === modalLessonId) ?? null,
    [allLessons, modalLessonId]
  );

  const previewLessons = useMemo(
    () => allLessons.filter((lesson) => lesson.isPreview),
    [allLessons]
  );

  const sidebarVideoPreviewLesson = useMemo(
    () => previewLessons.find((lesson) => isPlayableVideoLesson(lesson)) ?? null,
    [previewLessons]
  );

  const showSidebarVideoPreview = Boolean(course?.promoVideoUrl || sidebarVideoPreviewLesson);

  const canOpenLessonInline = useCallback(
    (lesson: CourseLesson) =>
      Boolean(
        isStudent &&
          isAuthenticated &&
          lesson.isPreview &&
          !isEnrolled &&
          Number(course?.price ?? 0) > 0
      ),
    [course?.price, isAuthenticated, isEnrolled, isStudent]
  );

  const closeVideoModal = useCallback(() => {
    setModalLessonId(null);
    setPromoModalOpen(false);
    router.replace(ROUTES.courseDetail(slug), { scroll: false });
  }, [router, slug]);

  const openLessonModal = useCallback(
    (lessonId: string) => {
      setPromoModalOpen(false);
      setModalLessonId(lessonId);
      router.replace(`${ROUTES.courseDetail(slug)}?lesson=${encodeURIComponent(lessonId)}`, {
        scroll: false,
      });
    },
    [router, slug]
  );

  useEffect(() => {
    const requestedId = searchParams.get("lesson");
    if (!requestedId || !course) return;
    const lesson = allLessons.find((item) => item.id === requestedId);
    if (lesson && canOpenLessonInline(lesson)) {
      setModalLessonId(requestedId);
      setPromoModalOpen(false);
    }
  }, [allLessons, canOpenLessonInline, course, searchParams]);

  const lessonCountPre = course?.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0) ?? 0;
  const totalSecondsPre =
    course?.chapters.reduce(
      (sum, ch) => sum + ch.lessons.reduce((s, l) => s + (l.duration ?? 0), 0),
      0
    ) ?? 0;

  const featureHighlights = useMemo(() => {
    if ((course?.outcomes?.length ?? 0) >= 2) {
      return course!.outcomes!.slice(0, 4).map((text, index) => ({
        title: text.length > 48 ? `${text.slice(0, 48)}…` : text,
        description: text,
        icon: [GraduationCap, Sparkles, BookOpen, Award][index % 4]!,
      }));
    }
    return [
      {
        title: "Structured curriculum",
        description: `${course?.chapters.length ?? 0} chapters and ${allLessons.length} lessons designed step by step.`,
        icon: Layers,
      },
      {
        title: "Learn by doing",
        description: "Video lessons, PDFs, and practice materials you can revisit anytime.",
        icon: PlayCircle,
      },
      {
        title: "Expert instructor",
        description: `Guided by ${course?.teacher.name ?? "experienced instructors"}.`,
        icon: GraduationCap,
      },
      {
        title: "Certificate & progress",
        description:
          course?.hasCertificate === false
            ? "Track your learning progress across all lessons."
            : "Earn a certificate when you complete the full course.",
        icon: Award,
      },
    ];
  }, [allLessons.length, course]);

  const sidebarIncludes = useMemo(
    () =>
      [
        `${course?.chapters.length ?? 0} chapters · ${allLessons.length} lessons`,
        totalSecondsPre > 0 ? `${formatLessonDuration(totalSecondsPre)} of content` : null,
        previewLessons.length > 0
          ? `${previewLessons.length} free preview lesson${previewLessons.length === 1 ? "" : "s"}`
          : null,
        (course?.programLinks?.length ?? 0) > 0 ? "Linked questionbank access" : null,
        course?.hasCertificate === false ? null : "Certificate on completion",
        course?.lifetimeAccess === false ? "Access while enrolled" : "Lifetime access after enroll",
        `Instructor: ${course?.teacher.name ?? "ALT Tutor"}`,
      ].filter(Boolean) as string[],
    [allLessons.length, course, previewLessons.length, totalSecondsPre]
  );

  const scrollToSection = useCallback((sectionId: SectionId) => {
    setActiveSection(sectionId);
    scrollToSectionElement(sectionId);
  }, []);

  useEffect(() => {
    if (!course) return;

    const syncActiveSection = () => {
      const offset = getSectionScrollOffset();
      let current: SectionId = "curriculum";

      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - offset <= 8) {
          current = id;
        }
      }

      setActiveSection(current);
    };

    syncActiveSection();
    window.addEventListener("scroll", syncActiveSection, { passive: true });
    window.addEventListener("resize", syncActiveSection);

    return () => {
      window.removeEventListener("scroll", syncActiveSection);
      window.removeEventListener("resize", syncActiveSection);
    };
  }, [course]);

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

  const lessonCountResolved = course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
  const totalSecondsResolved = course.chapters.reduce(
    (sum, ch) => sum + ch.lessons.reduce((s, l) => s + (l.duration ?? 0), 0),
    0
  );
  const avgRating = averageReviewRating(course.reviews.map((r) => r.rating));
  const lessonCount = lessonCountResolved;
  const totalSeconds = totalSecondsResolved;
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

  const onOpenLesson = (lessonId: string, isPreview?: boolean) => {
    const lesson = allLessons.find((item) => item.id === lessonId);
    const canOpenPreview = Boolean(isStudent && isAuthenticated && isPreview);

    if (isEnrolled || (isStudent && isFree)) {
      router.push(lessonHref(lessonId));
      return;
    }

    if (canOpenPreview && lesson && canOpenLessonInline(lesson)) {
      openLessonModal(lessonId);
      return;
    }

    if (!isAuthenticated && isPreview) {
      router.push(
        `${ROUTES.auth.login}?next=${encodeURIComponent(`${ROUTES.courseDetail(slug)}?lesson=${encodeURIComponent(lessonId)}`)}`
      );
      return;
    }

    if (!isAuthenticated) {
      router.push(`${ROUTES.auth.login}?next=${encodeURIComponent(ROUTES.courseDetail(slug))}`);
      return;
    }

    scrollToSectionElement("enroll");
  };

  const onSidebarPreview = () => {
    if (course.promoVideoUrl) {
      setModalLessonId(null);
      setPromoModalOpen(true);
      return;
    }

    const videoPreview = sidebarVideoPreviewLesson;
    if (videoPreview && isStudent && isAuthenticated && canOpenLessonInline(videoPreview)) {
      openLessonModal(videoPreview.id);
      return;
    }

    if (videoPreview && !isAuthenticated) {
      router.push(
        `${ROUTES.auth.login}?next=${encodeURIComponent(`${ROUTES.courseDetail(slug)}?lesson=${encodeURIComponent(videoPreview.id)}`)}`
      );
      return;
    }

    scrollToSectionElement("curriculum");
  };

  return (
    <div className="relative bg-[#f9fafb]">
      <CourseVideoModal
        open={Boolean(modalLesson || promoModalOpen)}
        title={modalLesson?.title ?? (promoModalOpen ? `${course.title} — Preview` : "")}
        onClose={closeVideoModal}
      >
        {modalLesson ? (
          <LessonMediaPlayer lesson={modalLesson} />
        ) : promoModalOpen && course.promoVideoUrl ? (
          <PromoMediaPlayer url={course.promoVideoUrl} title={course.title} />
        ) : null}
      </CourseVideoModal>

      {/* Dark hero — 10 Minute School style */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1220] via-[#162033] to-[#1e1b4b] text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#12b76a]/30 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-[#6366f1]/25 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
          <nav className="mb-5 text-sm text-white/60">
            <Link href={ROUTES.home} className="hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href={ROUTES.courses} className="hover:text-white">
              Courses
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white/90">{course.title}</span>
          </nav>
          <div className="max-w-4xl">
            {course.category ? (
              <span className="inline-flex rounded-md bg-white/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[#6ee7b7]">
                {course.category.name}
              </span>
            ) : null}
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
              {course.title}
            </h1>
            {(course.summary?.trim() || course.description?.trim()) ? (
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/80 sm:text-lg">
                {course.summary?.trim() || richTextExcerpt(course.description, 260)}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <RatingStars rating={avgRating} />
                {course.reviews.length > 0 ? `${avgRating.toFixed(1)} (${course.reviews.length})` : "No reviews yet"}
              </span>
              <span>{course.teacher.name}</span>
              <span>{lessonCount} lessons</span>
              <span>{course.studentsCount} enrolled</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section tabs — sticky below site header for full page scroll */}
      <SectionNav items={SECTION_NAV} activeId={activeSection} onSelect={scrollToSection} />

      <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="order-2 space-y-10 lg:order-1">
            {/* Curriculum */}
            <section id="curriculum" className="scroll-mt-[8.25rem] lg:scroll-mt-[8.75rem]">
              <SectionHeading
                title="Course curriculum"
                subtitle={`${course.chapters.length} chapters · ${lessonCount} lessons${previewLessons.length > 0 ? ` · ${previewLessons.length} free preview` : ""}`}
              />
              {course.chapters.length === 0 ? (
                <p className="mt-4 text-sm text-[#64748b]">Curriculum will be available soon.</p>
              ) : (
                <div className="mt-5 space-y-3 rounded-2xl border border-[#e5e7eb] bg-white p-3 sm:p-4">
                  {course.chapters.map((chapter, index) => (
                    <ChapterAccordion
                      key={chapter.id}
                      index={index}
                      title={chapter.title}
                      description={chapter.description}
                      lessons={chapter.lessons}
                      defaultOpen={index === 0}
                      isEnrolled={isEnrolled}
                      isFree={isFree}
                      isAuthenticated={isAuthenticated}
                      isStudent={isStudent}
                      isPending={enrollCourse.isPending}
                      activeLessonId={modalLessonId}
                      onOpenLesson={onOpenLesson}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Features grid */}
            <section id="features" className="scroll-mt-[8.25rem] lg:scroll-mt-[8.75rem]">
              <SectionHeading
                title="How this course is organized"
                subtitle="Everything included to help you learn step by step"
              />
              <div className="mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-4 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  {featureHighlights.map(({ title, description, icon: Icon }) => (
                    <div
                      key={title}
                      className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                    >
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#12b76a]/20 text-[#6ee7b7]">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <h3 className="mt-3 text-base font-bold text-white">{title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/70">{description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {(course.outcomes?.length ?? 0) > 0 ? (
                <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-white p-6">
                  <h3 className="text-lg font-bold text-[#111827]">Exclusive features</h3>
                  <ul className="mt-4 space-y-3">
                    {course.outcomes!.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-[#374151]">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#12b76a]" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            {/* About */}
            <section id="about" className="scroll-mt-[8.25rem] lg:scroll-mt-[8.75rem]">
              <SectionHeading title="About this course" subtitle="Details, requirements, and who should join" />
              <div className="mt-5 space-y-3">
                {(course.summary?.trim() || course.description?.trim()) ? (
                  <AboutAccordion title="Course overview" defaultOpen>
                    <CollapsibleDescription html={course.description} summary={course.summary} />
                  </AboutAccordion>
                ) : null}
                {course.targetAudience ? (
                  <AboutAccordion title="Who is this course for?">
                    <p className="text-sm leading-relaxed text-[#64748b]">{course.targetAudience}</p>
                  </AboutAccordion>
                ) : null}
                {(course.requirements?.length ?? 0) > 0 ? (
                  <AboutAccordion title="Requirements">
                    <ul className="list-disc space-y-1 pl-5 text-sm text-[#64748b]">
                      {course.requirements!.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </AboutAccordion>
                ) : null}
                <AboutAccordion title="Meet your instructor">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#12b76a] text-lg font-bold text-white">
                      {course.teacher.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={course.teacher.avatar} alt={course.teacher.name} className="h-full w-full object-cover" />
                      ) : (
                        course.teacher.name.charAt(0).toUpperCase()
                      )}
                    </span>
                    <div>
                      <p className="font-bold text-[#111827]">{course.teacher.name}</p>
                      <p className="text-sm text-[#64748b]">{course.category?.name ?? "Course"} Instructor</p>
                      <p className="mt-2 text-sm text-[#64748b]">
                        {course.studentsCount} students · {lessonCount} lessons
                      </p>
                    </div>
                  </div>
                </AboutAccordion>
              </div>
            </section>

            {/* Reviews */}
            <section id="reviews" className="scroll-mt-[8.25rem] lg:scroll-mt-[8.75rem]">
              <SectionHeading
                title="What students are saying"
                subtitle={course.reviews.length > 0 ? `${avgRating.toFixed(1)} average rating` : "Reviews from enrolled learners"}
              />
              {course.reviews.length === 0 ? (
                <p className="mt-4 rounded-2xl border border-dashed border-[#e5e7eb] bg-white px-6 py-10 text-center text-sm text-[#64748b]">
                  No reviews yet. Be the first to enroll and share feedback.
                </p>
              ) : (
                <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                  {course.reviews.map((review) => (
                    <li key={review.id} className="rounded-2xl border border-[#e5e7eb] bg-white p-5">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ecfdf3] text-sm font-bold text-[#12b76a]">
                          {review.student.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-semibold text-[#111827]">{review.student.name}</p>
                          <RatingStars rating={review.rating} />
                        </div>
                      </div>
                      {review.comment ? (
                        <p className="mt-3 text-sm leading-relaxed text-[#64748b]">{review.comment}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* FAQ */}
            <section id="faq" className="scroll-mt-[8.25rem] lg:scroll-mt-[8.75rem]">
              <SectionHeading title="Frequently asked questions" />
              <div className="mt-5 divide-y divide-[#e5e7eb] overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
                {FAQS.map((faq) => (
                  <FaqAccordion key={faq.id} question={faq.question} answer={faq.answer} />
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-[#d1fae5] bg-[#ecfdf5] p-6 text-center">
                <p className="font-semibold text-[#065f46]">Have more questions?</p>
                <p className="mt-1 text-sm text-[#047857]">Our team is ready to help you choose the right course.</p>
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-[#12b76a] px-5 py-2.5 text-sm font-bold text-[#12b76a] transition hover:bg-[#12b76a] hover:text-white"
                >
                  <Phone className="h-4 w-4" aria-hidden />
                  Call {siteConfig.phone}
                </a>
              </div>
            </section>
          </div>

          <aside id="enroll" className="order-1 lg:order-2 lg:sticky lg:top-[8.25rem] lg:self-start xl:top-[8.75rem]">
            <CourseSidebarCard
              course={course}
              includes={sidebarIncludes}
              previewCount={previewLessons.length}
              showVideoPreview={showSidebarVideoPreview}
              hasPromoVideo={Boolean(course.promoVideoUrl)}
              isEnrolled={isEnrolled}
              isFree={isFree}
              isStudent={isStudent}
              isAuthenticated={isAuthenticated}
              enrollError={enrollError}
              enrollPending={enrollCourse.isPending}
              checkoutPending={checkout.isPending}
              learnHref={learnHref}
              loginNextHref={loginNextHref}
              userRole={user?.role}
              onPreview={onSidebarPreview}
              onEnroll={() => void onEnroll()}
              onCheckout={() => void onCheckout()}
            />
          </aside>
        </div>
      </section>
    </div>
  );
}

function SectionNav({
  items,
  activeId,
  onSelect,
}: {
  items: { id: SectionId; label: string }[];
  activeId: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  return (
    <div className="sticky top-20 z-30 lg:top-[5.5rem]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
          <nav
            aria-label="Course sections"
            className="min-w-0 rounded-xl border border-border bg-card shadow-sm backdrop-blur-md"
          >
            <div
              id="course-section-nav"
              role="tablist"
              className="flex w-full max-w-full justify-start gap-0.5 overflow-x-auto px-2 py-1.5 sm:px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {items.map((item) => {
                const active = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={item.id}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onSelect(item.id);
                    }}
                    className="group shrink-0 px-2 py-1 touch-manipulation sm:px-2.5"
                  >
                    <span
                      className={cn(
                        "relative inline-flex items-center whitespace-nowrap text-sm font-medium transition-colors duration-300",
                        active ? "text-[#ef3239]" : "text-[#1a2b5e]/75 group-hover:text-[#ef3239]"
                      )}
                    >
                      {item.label}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute inset-x-0 -bottom-1 h-0.5 origin-left rounded-full bg-gradient-to-r from-[#3b8dee] via-[#ff6b35] to-[#ef3239] transition-transform duration-300 ease-out",
                          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                        )}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight text-[#111827]">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-[#64748b]">{subtitle}</p> : null}
    </div>
  );
}

function AboutAccordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="font-semibold text-[#111827]">{title}</span>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 text-[#64748b] transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? <div className="border-t border-[#e5e7eb] px-5 py-4">{children}</div> : null}
    </div>
  );
}

function FaqAccordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-[#111827]"
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
        <p className="border-t border-[#f3f4f6] px-5 pb-4 pt-3 text-sm leading-relaxed text-[#64748b]">
          {answer}
        </p>
      ) : null}
    </div>
  );
}

function CollapsibleDescription({
  html,
  summary,
  className,
}: {
  html: string;
  summary?: string | null;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const plain = richTextToPlain(html);
  const isLong = plain.length > 480;

  return (
    <div className={className}>
      {summary?.trim() ? (
        <p className="text-base font-medium leading-relaxed text-[#334155]">{summary.trim()}</p>
      ) : null}
      <div className={cn("relative", summary?.trim() ? "mt-3" : "")}>
        <div
          className={cn(
            !expanded && isLong && "max-h-[320px] overflow-hidden"
          )}
        >
          <RichTextContent
            html={html}
            className="w-full max-w-none text-sm leading-[1.75] text-[#64748b] sm:text-base [&_p]:mb-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5"
          />
        </div>
        {!expanded && isLong ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent"
          />
        ) : null}
      </div>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#1877f2] hover:text-[#ef3239]"
        >
          {expanded ? "Read less" : "Read more"}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
            aria-hidden
          />
        </button>
      ) : null}
    </div>
  );
}

function CourseVideoModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-video-modal-title"
        className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#dce4f0] bg-white shadow-[0_24px_80px_-20px_rgba(15,23,42,0.45)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#eef2f8] px-4 py-3 sm:px-5 sm:py-4">
          <h2
            id="course-video-modal-title"
            className="line-clamp-2 pr-2 text-base font-bold text-[#1a2b5e] sm:text-lg"
          >
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-2 text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#1a2b5e]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="bg-black">{children}</div>
      </div>
    </div>
  );
}

function CourseSidebarCard({
  course,
  includes,
  previewCount,
  showVideoPreview,
  hasPromoVideo,
  isEnrolled,
  isFree,
  isStudent,
  isAuthenticated,
  enrollError,
  enrollPending,
  checkoutPending,
  learnHref,
  loginNextHref,
  userRole,
  onPreview,
  onEnroll,
  onCheckout,
}: {
  course: CourseDetail;
  includes: string[];
  previewCount: number;
  showVideoPreview: boolean;
  hasPromoVideo: boolean;
  isEnrolled: boolean;
  isFree: boolean;
  isStudent: boolean;
  isAuthenticated: boolean;
  enrollError: string | null;
  enrollPending: boolean;
  checkoutPending: boolean;
  learnHref: string;
  loginNextHref: string;
  userRole?: string;
  onPreview: () => void;
  onEnroll: () => void;
  onCheckout: () => void;
}) {
  const hasQuestionbank = (course.programLinks?.length ?? 0) > 0;
  const linkedProgramName = course.programLinks?.[0]?.program?.name;
  const questionbankLearnHref = `${learnHref}?tab=questionbank`;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
      <div className="relative aspect-video bg-[#e8edf5]">
        {course.thumbnail ? (
          <Image src={course.thumbnail} alt={course.title} fill sizes="380px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
            <BookOpen className="h-14 w-14 text-white/70" aria-hidden />
          </div>
        )}
        <div className="absolute inset-0 bg-black/25" />
        {showVideoPreview ? (
          <button
            type="button"
            onClick={onPreview}
            className="absolute inset-0 flex items-center justify-center"
            aria-label="Watch preview"
          >
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-primary shadow-lg transition hover:scale-105">
              <Play className="ml-1 h-6 w-6 fill-current" aria-hidden />
            </span>
          </button>
        ) : null}
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-lg font-bold text-[#111827]">
            {course.summary?.trim() ? richTextExcerpt(course.summary, 60) : "Start learning today"}
          </p>
          <p className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#111827]">
              {formatCoursePrice(course.price)}
            </span>
            {course.regularPrice && course.regularPrice > course.price ? (
              <span className="text-sm text-[#94a3b8] line-through">
                {formatCoursePrice(course.regularPrice)}
              </span>
            ) : null}
          </p>
        </div>

        {isEnrolled ? (
          <>
            <div className="rounded-lg bg-primary-muted px-3 py-2 text-center text-sm font-semibold text-primary">
              Already enrolled
            </div>
            <Button asChild variant="default" size="lg" className="h-12 w-full">
              <Link href={learnHref}>Continue learning</Link>
            </Button>
          </>
        ) : (
          <div className="space-y-2.5">
            {showVideoPreview ? (
              <Button type="button" variant="default" size="lg" className="h-12 w-full" onClick={onPreview}>
                {hasPromoVideo ? "Watch intro video" : "Watch free preview"}
              </Button>
            ) : null}
            {isStudent ? (
              isFree ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="h-12 w-full"
                  disabled={enrollPending}
                  onClick={onEnroll}
                >
                  {enrollPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enroll"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="h-12 w-full"
                  disabled={checkoutPending}
                  onClick={onCheckout}
                >
                  {checkoutPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enroll"}
                </Button>
              )
            ) : isAuthenticated ? (
              <Button asChild variant="secondary" size="lg" className="h-12 w-full">
                <Link
                  href={
                    userRole && userRole in roleHomeRoutes
                      ? roleHomeRoutes[userRole as keyof typeof roleHomeRoutes]
                      : ROUTES.home
                  }
                >
                  Go to dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild variant="secondary" size="lg" className="h-12 w-full">
                <Link href={loginNextHref}>{isFree ? "Enroll — Free" : "Log in to enroll"}</Link>
              </Button>
            )}
          </div>
        )}

        {enrollError ? <p className="text-center text-sm text-accent">{enrollError}</p> : null}

        {hasQuestionbank ? (
          <div className="space-y-1.5">
            {isEnrolled ? (
              <Button asChild variant="outline" size="lg" className="h-11 w-full">
                <Link href={questionbankLearnHref}>Open questionbank</Link>
              </Button>
            ) : isStudent ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 w-full"
                disabled={isFree ? enrollPending : checkoutPending}
                onClick={isFree ? onEnroll : onCheckout}
              >
                {isFree ? (
                  enrollPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Enroll to unlock questionbank"
                  )
                ) : checkoutPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Enroll to unlock questionbank"
                )}
              </Button>
            ) : isAuthenticated ? (
              <Button asChild variant="outline" size="lg" className="h-11 w-full">
                <Link
                  href={
                    userRole && userRole in roleHomeRoutes
                      ? roleHomeRoutes[userRole as keyof typeof roleHomeRoutes]
                      : ROUTES.home
                  }
                >
                  Go to dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="lg" className="h-11 w-full">
                <Link href={loginNextHref}>Log in to access questionbank</Link>
              </Button>
            )}
            <p className="text-center text-xs text-muted-foreground">
              {isEnrolled
                ? linkedProgramName
                  ? `Practice ${linkedProgramName} questions included with your enrollment.`
                  : "Course-linked practice questions are ready in your dashboard."
                : "Full questionbank access is included when you enroll in this course."}
            </p>
          </div>
        ) : null}

        <div className="border-t border-[#e5e7eb] pt-4">
          <p className="text-sm font-bold text-[#111827]">What&apos;s in this course</p>
          <ul className="mt-3 space-y-2.5">
            {includes.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-[#475569]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#94a3b8]" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <a
          href={`tel:${siteConfig.phone}`}
          className="flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <Phone className="h-4 w-4" aria-hidden />
          Call {siteConfig.phone} for details
        </a>
      </div>
    </div>
  );
}

function useVideoWatermarkLabel() {
  const user = useAppSelector((state) => state.auth.user);
  return user ? `${user.name} · ${user.phone}` : "ALT Tutor Preview";
}

function PdfEmbedViewer({ url, title }: { url: string; title: string }) {
  const inlineUrl = useMemo(() => getInlinePdfUrl(url), [url]);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    setViewerSrc(null);
    setFailed(false);

    async function loadPdf() {
      try {
        const response = await fetch(inlineUrl);
        if (!response.ok) throw new Error("Failed to fetch PDF");
        const blob = await response.blob();
        const pdfBlob =
          blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(pdfBlob);
        if (!cancelled) setViewerSrc(objectUrl);
      } catch {
        if (!cancelled) {
          setViewerSrc(inlineUrl);
          setFailed(true);
        }
      }
    }

    void loadPdf();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [inlineUrl]);

  if (!viewerSrc) {
    return (
      <div className="flex h-[min(70vh,720px)] items-center justify-center bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        <span className="sr-only">Loading PDF preview</span>
      </div>
    );
  }

  if (failed) {
    return (
      <object
        data={viewerSrc}
        type="application/pdf"
        title={title}
        className="h-[min(70vh,720px)] w-full bg-white"
      >
        <embed src={viewerSrc} type="application/pdf" className="h-[min(70vh,720px)] w-full" />
      </object>
    );
  }

  return (
    <iframe
      src={`${viewerSrc}#view=FitH`}
      title={title}
      className="h-[min(70vh,720px)] w-full border-0 bg-white"
    />
  );
}

function LessonMediaPlayer({ lesson }: { lesson: CourseLesson }) {
  const watermarkText = useVideoWatermarkLabel();
  const pdfUrl = resolveLessonPdfUrl(lesson);
  const type = String(lesson.type).toUpperCase();

  if (pdfUrl) {
    return <PdfEmbedViewer url={pdfUrl} title={lesson.title} />;
  }

  if (type === "VIDEO" || isPlayableVideoLesson(lesson)) {
    return (
      <SecureVideoPlayer
        lessonId={lesson.id}
        title={lesson.title}
        watermarkText={watermarkText}
      />
    );
  }

  if (type === "TEXT" && lesson.body) {
    return (
      <div className="max-h-[min(70vh,720px)] overflow-y-auto bg-white p-6">
        <RichTextContent html={lesson.body} className="text-sm leading-relaxed text-[#64748b]" />
      </div>
    );
  }

  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-[#0f172a] px-6 text-center text-white">
      <FileText className="h-10 w-10 text-white/70" aria-hidden />
      <p className="text-sm font-medium">{lesson.title}</p>
      <p className="text-xs text-white/60">Preview content is not available yet.</p>
    </div>
  );
}

function PromoMediaPlayer({ url, title }: { url: string; title: string }) {
  const watermarkText = useVideoWatermarkLabel();
  return <SecureVideoPlayer title={title} directUrl={url} watermarkText={watermarkText} />;
}

function ChapterAccordion({
  index,
  title,
  description,
  lessons,
  defaultOpen,
  isEnrolled,
  isFree,
  isAuthenticated,
  isStudent,
  isPending,
  activeLessonId,
  onOpenLesson,
}: {
  index: number;
  title: string;
  description?: string | null;
  lessons: {
    id: string;
    title: string;
    type: string;
    duration?: number | null;
    isPreview?: boolean;
  }[];
  defaultOpen?: boolean;
  isEnrolled: boolean;
  isFree: boolean;
  isAuthenticated: boolean;
  isStudent: boolean;
  isPending: boolean;
  activeLessonId?: string | null;
  onOpenLesson: (lessonId: string, isPreview?: boolean) => void;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const chapterDuration = lessons.reduce(
    (sum, lesson) => sum + (Number(lesson.duration) || 0),
    0
  );

  return (
    <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
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
              <p className="mt-0.5 line-clamp-1 text-xs text-[#7b7192]">{richTextToPlain(description)}</p>
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
        <ul className="divide-y divide-[#eee7f8] border-t border-[#eee7f8] bg-[#fdfcff]">
          {lessons.map((lesson) => {
            const duration = formatLessonDuration(lesson.duration);
            const canOpen =
              isEnrolled ||
              isFree ||
              Boolean(isStudent && isAuthenticated && lesson.isPreview);
            const isActive = activeLessonId === lesson.id;
            const isPreviewLesson = Boolean(lesson.isPreview && !isFree);

            return (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => onOpenLesson(lesson.id, lesson.isPreview)}
                  disabled={isPending}
                  className={cn(
                    "group flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm transition-colors disabled:cursor-wait disabled:opacity-60 sm:px-5",
                    isActive ? "bg-[#eef5ff]" : "hover:bg-[#f8fafc]"
                  )}
                  aria-label={`${canOpen ? "Preview" : "Unlock"} lesson ${lesson.title}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      canOpen ? "bg-[#ecfdf5] text-[#0d9488]" : "bg-[#f1f5f9] text-[#94a3b8]"
                    )}
                  >
                    {canOpen ? (
                      <Play className="ml-0.5 h-3.5 w-3.5 fill-current" aria-hidden />
                    ) : (
                      <Lock className="h-3.5 w-3.5" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-[#1a2b5e]">{lesson.title}</span>
                      {isPreviewLesson && canOpen ? (
                        <span className="rounded bg-[#1a2b5e] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Preview
                        </span>
                      ) : null}
                    </span>
                    {duration ? (
                      <span className="mt-0.5 block text-xs text-[#94a3b8]">{duration}</span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-semibold",
                      canOpen && isPreviewLesson
                        ? "text-[#0d9488] group-hover:underline"
                        : canOpen
                          ? "text-[#1877f2]"
                          : "text-[#94a3b8]"
                    )}
                  >
                    {canOpen
                      ? isPreviewLesson
                        ? "Preview"
                        : isFree
                          ? "Open"
                          : "Open"
                      : lesson.isPreview && !isAuthenticated
                        ? "Log in"
                        : "Locked"}
                  </span>
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
