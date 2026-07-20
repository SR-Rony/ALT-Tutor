"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  ClipboardList,
  Download,
  FileText,
  HelpCircle,
  Layers,
  Lock,
  Paperclip,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { PageLoader } from "@/components/shared";
import { SecureVideoPlayer } from "@/components/shared/secure-video-player";
import { Button } from "@/components/ui/button";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { ROUTES } from "@/constants";
import {
  useCourseAssignments,
  useCourseDetail,
  useMyMcqExams,
  useQbProgram,
  useStudentCourses,
} from "@/hooks";
import { formatLessonDuration } from "@/lib/course-format";
import { formatShortDate } from "@/lib/format";
import { richTextToPlain } from "@/lib/rich-text";
import { apiClient } from "@/services/api-client";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import type { CourseDetail, CourseLesson } from "@/types/course.types";
import type { McqExam, McqPhase } from "@/types/mcq.types";
import type { StudentAssignment } from "@/types/student-dashboard.types";
import { cn } from "@/utils";
import { isPlayableVideoLesson, resolveLessonPdfUrl } from "@/utils/pdf-viewer";

type Props = { slug: string };
type CourseTab = "lessons" | "questionbank" | "exams";

const TABS: { id: CourseTab; label: string; icon: typeof BookOpen }[] = [
  { id: "lessons", label: "Lessons", icon: PlayCircle },
  { id: "questionbank", label: "Questionbank", icon: HelpCircle },
  { id: "exams", label: "Exams", icon: ClipboardList },
];

function LessonPlayer({ lesson }: { lesson: CourseLesson }) {
  const user = useAppSelector((state) => state.auth.user);
  const watermarkText = user ? `${user.name} · ${user.phone}` : null;
  const pdfUrl = resolveLessonPdfUrl(lesson);
  const type = String(lesson.type).toUpperCase();

  if (pdfUrl) {
    return (
      <iframe
        key={pdfUrl}
        src={pdfUrl}
        title={lesson.title}
        className="h-[70vh] w-full rounded-xl border border-border bg-white"
      />
    );
  }

  if (type === "VIDEO" || isPlayableVideoLesson(lesson)) {
    return (
      <SecureVideoPlayer
        lessonId={lesson.id}
        title={lesson.title}
        watermarkText={watermarkText}
        rounded
      />
    );
  }

  if (type === "TEXT" && lesson.body) {
    return (
      <div className="min-h-[240px] rounded-xl border border-border bg-card p-6">
        <RichTextContent html={lesson.body} className="text-sm leading-relaxed text-foreground" />
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
      <p className="text-xs text-muted-foreground">No content uploaded for this lesson yet.</p>
    </div>
  );
}

function mcqPhaseMeta(phase: McqPhase) {
  switch (phase) {
    case "IN_PROGRESS":
      return { label: "In progress", className: "bg-[#fff7ed] text-[#ea580c]" };
    case "CAN_RETAKE":
      return { label: "Retake available", className: "bg-primary-muted text-primary" };
    case "COMPLETED":
      return { label: "Completed", className: "bg-muted text-muted-foreground" };
    default:
      return { label: "Not started", className: "bg-primary/10 text-primary" };
  }
}

function mcqActionLabel(phase: McqPhase) {
  if (phase === "IN_PROGRESS") return "Continue exam";
  if (phase === "CAN_RETAKE") return "Retake";
  if (phase === "COMPLETED") return "View result";
  return "Start exam";
}

function CourseHero({
  course,
  progress,
  isCompleted,
  lessonCount,
  totalSeconds,
  examCount,
  programCount,
}: {
  course: CourseDetail;
  progress: number;
  isCompleted: boolean;
  lessonCount: number;
  totalSeconds: number;
  examCount: number;
  programCount: number;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_40px_-20px_rgba(24,119,242,0.25)]">
      <div className="relative min-h-[140px] bg-gradient-to-br from-primary/15 via-card to-accent/10 p-6 sm:p-8">
        {course.thumbnail ? (
          <>
            <Image
              src={course.thumbnail}
              alt=""
              fill
              className="object-cover opacity-20"
              sizes="(max-width: 1280px) 100vw, 1200px"
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-card/80" />
          </>
        ) : null}
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {course.category?.name ?? "Course"}
              {course.level ? ` · ${String(course.level).replace(/_/g, " ")}` : ""}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {course.title}
            </h1>
            {course.teacher?.name ? (
              <p className="mt-1 text-sm text-muted-foreground">Instructor · {course.teacher.name}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1">
                <PlayCircle className="h-3.5 w-3.5 text-primary" aria-hidden />
                {lessonCount} lessons
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1">
                <ClipboardList className="h-3.5 w-3.5 text-primary" aria-hidden />
                {examCount} exams
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1">
                <HelpCircle className="h-3.5 w-3.5 text-primary" aria-hidden />
                {programCount} QB program{programCount === 1 ? "" : "s"}
              </span>
              {totalSeconds > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1">
                  <Layers className="h-3.5 w-3.5 text-primary" aria-hidden />
                  {formatLessonDuration(totalSeconds)}
                </span>
              ) : null}
            </div>
          </div>
          <div className="w-full shrink-0 rounded-xl border border-border/80 bg-background/90 p-4 sm:w-56">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">Progress</span>
              <span className="font-bold text-accent-green">{progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-accent-green transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Award className="h-3.5 w-3.5" aria-hidden />
              {course.hasCertificate === false
                ? "No certificate"
                : isCompleted
                  ? "Certificate earned"
                  : "Certificate pending"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProgramQuestionbankSection({
  programSlug,
  programName,
  courseSlug,
}: {
  programSlug: string;
  programName: string;
  courseSlug: string;
}) {
  const { data, isLoading, error } = useQbProgram(programSlug);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        Loading {programName} questionbank…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Could not load questionbank for {programName}.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-3">
          <Link href={ROUTES.subjectQuestionbank(programSlug)}>Open public questionbank</Link>
        </Button>
      </div>
    );
  }

  const topics = data.qbTopics ?? [];
  const totalSets = topics.reduce((sum, t) => sum + (t.subtopics?.length ?? 0), 0);

  if (topics.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
        <HelpCircle className="mx-auto h-8 w-8 text-muted-foreground/60" aria-hidden />
        <p className="mt-3 font-semibold text-foreground">No topics published yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {programName} is linked to this course, but admins have not published questionbank topics
          yet.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-4">
          <Link href={ROUTES.subjectQuestionbank(programSlug)}>Browse program questionbank</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-foreground">{programName}</h3>
          <p className="text-sm text-muted-foreground">
            {topics.length} themes · {totalSets} study sets
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={ROUTES.subjectQuestionbank(programSlug)}>Full questionbank</Link>
        </Button>
      </div>
      <div className="space-y-6">
        {topics.map((topic) => (
          <div key={topic.id} className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Theme {topic.number}
            </p>
            <h4 className="mt-0.5 text-base font-bold text-foreground">{topic.title}</h4>
            {topic.description ? (
              <RichTextContent
                html={topic.description}
                className="mt-1 text-sm text-muted-foreground"
              />
            ) : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(topic.subtopics ?? []).map((sub) => (
                <article
                  key={sub.id}
                  className="flex flex-col rounded-xl border border-border bg-background p-4 transition hover:border-primary/30 hover:shadow-sm"
                >
                  <h5 className="font-semibold text-foreground">{sub.title}</h5>
                  <p className="mt-1 flex-1 text-xs text-muted-foreground">
                    {sub._count?.questions ?? 0} questions
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                      <Link href={ROUTES.subjectQuestionbankStudy(programSlug, sub.slug)}>
                        Study
                      </Link>
                    </Button>
                    <Button asChild size="sm" className="h-8 text-xs">
                      <Link
                        href={ROUTES.subjectQuestionbankStudyExam(programSlug, sub.slug, {
                          paper: "PAPER_2",
                        })}
                      >
                        Exam mode
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Course-linked practice opens the subject questionbank for {programName}. You can also use{" "}
        <Link href={ROUTES.questionbank(courseSlug)} className="text-primary hover:underline">
          course questionbank view
        </Link>
        .
      </p>
    </div>
  );
}

function CourseQuestionbankPanel({
  course,
  programLinks,
}: {
  course: CourseDetail;
  programLinks: NonNullable<CourseDetail["programLinks"]>;
}) {
  if (programLinks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden />
        <h2 className="mt-4 text-lg font-bold text-foreground">Questionbank not linked</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          This course has no subject program linked yet. Your instructor or admin can connect a
          program in{" "}
          <span className="font-medium text-foreground">Admin → Course → Programs</span> so practice
          questions appear here.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-5">
          <Link href={ROUTES.student.payments}>Get Practice Pass for subjects</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Practice questionbank</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Study sets and timed exam mode from programs linked to this course.
        </p>
      </div>
      {programLinks.map((link) => (
        <ProgramQuestionbankSection
          key={link.program.id}
          programSlug={link.program.slug}
          programName={link.program.name}
          courseSlug={course.slug}
        />
      ))}
    </div>
  );
}

function CourseExamsPanel({
  courseId,
  mcqExams,
  assignments,
  loading,
  error,
}: {
  courseId: string;
  mcqExams: McqExam[];
  assignments: StudentAssignment[];
  loading: boolean;
  error: unknown;
}) {
  const written = assignments.filter((a) => {
    const type = String(a.type).toUpperCase();
    const status = String(a.status ?? "PUBLISHED").toUpperCase();
    return type !== "MCQ" && status === "PUBLISHED";
  });

  if (loading) {
    return <PageLoader label="Loading course exams..." />;
  }

  if (error) {
    return (
      <p className="text-sm text-accent">
        {(error as ApiError)?.message || "Could not load exams for this course."}
      </p>
    );
  }

  if (mcqExams.length === 0 && written.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
        <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden />
        <h2 className="mt-4 text-lg font-bold text-foreground">No exams yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Published MCQ and written assessments for this course will appear here. Ask your teacher
          to publish exams, or check the full exam center.
        </p>
        <Button asChild size="sm" className="mt-5">
          <Link href={ROUTES.student.assessments}>Open Exam Center</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {mcqExams.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-bold text-foreground">MCQ exams</h2>
          <p className="mt-1 text-sm text-muted-foreground">Timed multiple-choice assessments.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {mcqExams.map((exam) => {
              const phase = exam.mcqStatus?.phase ?? "NOT_STARTED";
              const meta = mcqPhaseMeta(phase);
              return (
                <article
                  key={exam.id}
                  className="flex flex-col rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-foreground">{exam.title}</h3>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", meta.className)}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {richTextToPlain(exam.description)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {exam.durationMinutes ? <span>{exam.durationMinutes} min</span> : null}
                    {exam._count?.questions ? (
                      <span>{exam._count.questions} questions</span>
                    ) : null}
                    {exam.dueDate ? <span>Due {formatShortDate(exam.dueDate)}</span> : null}
                  </div>
                  <Button asChild size="sm" className="mt-4 w-full">
                    <Link href={ROUTES.student.mcqExam(exam.id)}>{mcqActionLabel(phase)}</Link>
                  </Button>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {written.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-bold text-foreground">Written & file assignments</h2>
          <div className="mt-4 space-y-3">
            {written.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {String(item.type).toUpperCase() === "FILE" ? "File upload" : "Written response"}
                    {item.dueDate ? ` · Due ${formatShortDate(item.dueDate)}` : ""}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`${ROUTES.student.assessments}?course=${courseId}`}>Submit</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.student.assessments}>All exams & results</Link>
        </Button>
      </div>
    </div>
  );
}

export function StudentCourseLearnPage({ slug }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedLessonId = searchParams.get("lesson");
  const tabParam = searchParams.get("tab");
  const activeTab: CourseTab =
    tabParam === "questionbank" || tabParam === "exams" ? tabParam : "lessons";

  const { data: course, isLoading } = useCourseDetail(slug);
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useStudentCourses();
  const { data: myMcqExams = [], isLoading: mcqLoading } = useMyMcqExams();
  const {
    data: courseAssignments = [],
    isLoading: assignmentsLoading,
    error: assignmentsError,
  } = useCourseAssignments(course?.id);

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
  const isEnrolled = Boolean(enrollment);
  const hasPreviewLessons = useMemo(
    () =>
      course?.chapters.some((chapter) => chapter.lessons.some((lesson) => lesson.isPreview)) ??
      false,
    [course]
  );
  const previewOnlyAccess = !isEnrolled && !isFree && hasPreviewLessons;
  const canAccess = isEnrolled || isFree || previewOnlyAccess;

  const canOpenLesson = useCallback(
    (lesson: CourseLesson) => isEnrolled || isFree || Boolean(lesson.isPreview),
    [isEnrolled, isFree]
  );

  const setTab = useCallback(
    (tab: CourseTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "lessons") params.delete("tab");
      else params.set("tab", tab);
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    if (!course || !canAccess) {
      setContentLessons(null);
      return;
    }

    if (isFree || previewOnlyAccess) {
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
  }, [canAccess, course, isFree, previewOnlyAccess]);

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

  const programLinks = course?.programLinks ?? [];

  const courseMcqExams = useMemo(
    () =>
      myMcqExams.filter(
        (exam) => exam.courseId === course?.id || exam.course?.id === course?.id
      ),
    [myMcqExams, course?.id]
  );

  useEffect(() => {
    if (!requestedLessonId || lessons.length === 0) return;
    const requestedIndex = lessons.findIndex(({ lesson }) => lesson.id === requestedLessonId);
    if (requestedIndex >= 0 && canOpenLesson(lessons[requestedIndex]!.lesson)) {
      setLessonIndex(requestedIndex);
      setTab("lessons");
    }
  }, [lessons, requestedLessonId, setTab, canOpenLesson]);

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
          This is a paid course. Enroll to access lessons, questionbank, and exams.
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

  const currentEntry = lessons[lessonIndex] ?? null;
  const current = currentEntry
    ? {
        ...currentEntry,
        lessonAccessible: canOpenLesson(currentEntry.lesson),
      }
    : null;
  const totalSeconds = lessons.reduce(
    (sum, { lesson }) => sum + (Number(lesson.duration) || 0),
    0
  );
  const progress = enrollment?.progress ?? 0;
  const isCompleted = String(enrollment?.status ?? "").toUpperCase() === "COMPLETED";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
        <Link href={ROUTES.student.courses}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          My Courses
        </Link>
      </Button>

      <CourseHero
        course={course}
        progress={progress}
        isCompleted={isCompleted}
        lessonCount={lessons.length}
        totalSeconds={totalSeconds}
        examCount={courseMcqExams.length}
        programCount={programLinks.length}
      />

      <nav
        className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1"
        aria-label="Course sections"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none",
              activeTab === id
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </nav>

      {activeTab === "lessons" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              {contentError ? <p className="mb-3 text-sm text-accent">{contentError}</p> : null}
              {current ? (
                current.lessonAccessible ? (
                  <>
                    <LessonPlayer lesson={current.lesson} />
                    <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {current.chapterTitle}
                        </p>
                        <p className="mt-0.5 text-lg font-bold text-foreground">{current.lesson.title}</p>
                        {current.lesson.description ? (
                          <RichTextContent
                            html={current.lesson.description}
                            className="mt-2 text-sm text-muted-foreground"
                          />
                        ) : null}
                      </div>
                      {current.lesson.duration ? (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {formatLessonDuration(current.lesson.duration)}
                        </span>
                      ) : null}
                    </div>
                    {(current.lesson.attachments?.length ?? 0) > 0 ? (
                      <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
                        <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <Paperclip className="h-3.5 w-3.5" aria-hidden />
                          Downloads
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
                  <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl bg-muted px-6 text-center">
                    <Lock className="h-10 w-10 text-muted-foreground/70" aria-hidden />
                    <p className="text-base font-semibold text-foreground">This lesson is locked</p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Enroll in the course to unlock all lessons. Free preview lessons are available
                      without purchase.
                    </p>
                    <Button asChild size="sm">
                      <Link href={ROUTES.courseDetail(slug)}>View course & enroll</Link>
                    </Button>
                  </div>
                )
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-xl bg-muted">
                  <p className="text-sm text-muted-foreground">
                    {contentLessons == null ? "Loading lessons..." : "No lessons published yet."}
                  </p>
                </div>
              )}
            </div>

            {lessons.length > 0 ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={lessonIndex === 0}
                  onClick={() => setLessonIndex((i) => Math.max(0, i - 1))}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Previous
                </Button>
                <span className="text-sm font-medium text-muted-foreground">
                  Lesson {lessonIndex + 1} of {lessons.length}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={lessonIndex >= lessons.length - 1}
                  onClick={() => setLessonIndex((i) => Math.min(lessons.length - 1, i + 1))}
                >
                  Next
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            ) : null}
          </div>

          <aside className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-bold text-foreground">Curriculum</h2>
            <div className="mt-4 space-y-3">
              {course.chapters.length === 0 ? (
                <p className="text-sm text-muted-foreground">No chapters yet.</p>
              ) : (
                course.chapters.map((chapter) => (
                  <div key={chapter.id} className="rounded-xl border border-border p-3">
                    <p className="font-semibold text-foreground">{chapter.title}</p>
                    {chapter.lessons.length > 0 ? (
                      <ul className="mt-2 space-y-0.5">
                        {chapter.lessons.map((lesson) => {
                          const flatIndex = lessons.findIndex(
                            (entry) => entry.lesson.id === lesson.id
                          );
                          const isCurrent = flatIndex === lessonIndex;
                          const lessonAccessible = canOpenLesson(lesson);
                          return (
                            <li key={lesson.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!lessonAccessible) return;
                                  setLessonIndex(Math.max(0, flatIndex));
                                  setTab("lessons");
                                }}
                                disabled={!lessonAccessible}
                                className={cn(
                                  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                                  isCurrent
                                    ? "bg-primary/10 font-semibold text-primary"
                                    : lessonAccessible
                                      ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                                      : "cursor-not-allowed text-muted-foreground/60"
                                )}
                              >
                                {String(lesson.type).toUpperCase() === "VIDEO" ? (
                                  lessonAccessible ? (
                                    <PlayCircle className="h-4 w-4 shrink-0" aria-hidden />
                                  ) : (
                                    <Lock className="h-4 w-4 shrink-0" aria-hidden />
                                  )
                                ) : lessonAccessible ? (
                                  <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                                ) : (
                                  <Lock className="h-4 w-4 shrink-0" aria-hidden />
                                )}
                                <span className="flex-1 truncate">{lesson.title}</span>
                                {lesson.isPreview && !isEnrolled && !isFree ? (
                                  <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                    Preview
                                  </span>
                                ) : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {activeTab === "questionbank" ? (
        <CourseQuestionbankPanel course={course} programLinks={programLinks} />
      ) : null}

      {activeTab === "exams" ? (
        <CourseExamsPanel
          courseId={course.id}
          mcqExams={courseMcqExams}
          assignments={courseAssignments}
          loading={mcqLoading || assignmentsLoading}
          error={assignmentsError}
        />
      ) : null}
    </div>
  );
}
