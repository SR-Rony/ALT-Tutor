"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  ClipboardList,
  Clock,
  Download,
  FileText,
  HelpCircle,
  Layers,
  Lock,
  Paperclip,
  PlayCircle,
  Sparkles,
  Timer,
} from "lucide-react";
import { PageLoader } from "@/components/shared";
import { SecureVideoPlayer } from "@/components/shared/secure-video-player";
import { Button } from "@/components/ui/button";
import { RichTextContent } from "@/components/ui/rich-text-content";
import { ROUTES } from "@/constants";
import {
  useCourseDetail,
  useKeyConceptLessons,
  usePastPaperArchive,
  usePracticeExamTemplates,
  useQbProgram,
  useStudentCourses,
} from "@/hooks";
import { formatLessonDuration } from "@/lib/course-format";
import { formatAccessRemaining } from "@/lib/format";
import { apiClient } from "@/services/api-client";
import { useAppSelector } from "@/store";
import type { CourseDetail, CourseLesson } from "@/types/course.types";
import { cn } from "@/utils";
import { isPlayableVideoLesson, resolveLessonPdfUrl } from "@/utils/pdf-viewer";

type Props = { slug: string };
type CourseTab =
  | "lessons"
  | "questionbank"
  | "key-concepts"
  | "practice-exams"
  | "past-papers";

const TABS: { id: CourseTab; label: string; icon: typeof BookOpen }[] = [
  { id: "lessons", label: "Lessons", icon: PlayCircle },
  { id: "questionbank", label: "Questionbank", icon: HelpCircle },
  { id: "key-concepts", label: "Key Concepts", icon: BookOpen },
  { id: "practice-exams", label: "Practice Exams", icon: ClipboardList },
  { id: "past-papers", label: "Past Papers", icon: FileText },
];

type ProgramLink = NonNullable<CourseDetail["programLinks"]>[number];

const RESOURCE_GRID =
  "grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4";

function ResourceCard({
  href,
  title,
  meta,
  icon,
  actionLabel,
  locked,
  unlockHref,
}: {
  href: string;
  title: string;
  meta: string;
  icon: ReactNode;
  actionLabel: string;
  locked?: boolean;
  unlockHref?: string;
}) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors",
        !locked && "hover:border-primary/40 hover:bg-primary-muted/20"
      )}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {locked ? <Lock className="h-4 w-4" aria-hidden /> : icon}
      </span>
      <h5 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
        {title}
      </h5>
      <p className="mt-1 mb-4 flex-1 line-clamp-2 text-xs text-muted-foreground">{meta}</p>
      {locked ? (
        <Link
          href={unlockHref ?? href}
          className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:border-primary/30 hover:bg-muted"
        >
          Unlock
        </Link>
      ) : (
        <Link
          href={href}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </article>
  );
}

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

function CourseHero({
  course,
  progress,
  isCompleted,
  lessonCount,
  totalSeconds,
  programCount,
  accessLabel,
  accessUrgent,
}: {
  course: CourseDetail;
  progress: number;
  isCompleted: boolean;
  lessonCount: number;
  totalSeconds: number;
  programCount: number;
  accessLabel: string;
  accessUrgent?: boolean;
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
                <HelpCircle className="h-3.5 w-3.5 text-primary" aria-hidden />
                {programCount} subject{programCount === 1 ? "" : "s"}
              </span>
              {totalSeconds > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1">
                  <Layers className="h-3.5 w-3.5 text-primary" aria-hidden />
                  {formatLessonDuration(totalSeconds)}
                </span>
              ) : null}
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold",
                  accessUrgent
                    ? "bg-amber-100 text-amber-800"
                    : "bg-background/80 text-muted-foreground"
                )}
              >
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {accessLabel}
              </span>
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
}: {
  programSlug: string;
  programName: string;
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
        <p className="mt-3 font-semibold text-foreground">No practice sets yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{programName}</span> is linked to this course,
          but it has no questionbank topics or study sets. An admin needs to add topics under{" "}
          <span className="font-medium text-foreground">Questionbank</span> for this subject — linking
          alone is not enough.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-4">
          <Link href={ROUTES.subjectQuestionbank(programSlug)}>Open subject questionbank</Link>
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
          <div key={topic.id} className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3.5 sm:px-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                Theme {topic.number}
              </p>
              <h4 className="mt-0.5 text-base font-bold text-foreground">{topic.title}</h4>
              {topic.description ? (
                <RichTextContent
                  html={topic.description}
                  className="mt-1 line-clamp-2 text-sm text-muted-foreground"
                />
              ) : null}
            </div>
            <div className={cn(RESOURCE_GRID, "p-4 sm:p-5")}>
              {(topic.subtopics ?? []).map((sub) => {
                const questionCount = sub._count?.questions ?? 0;
                return (
                  <ResourceCard
                    key={sub.id}
                    href={ROUTES.subjectQuestionbankStudy(programSlug, sub.slug)}
                    title={sub.title}
                    meta={`${questionCount} question${questionCount === 1 ? "" : "s"}`}
                    icon={<BookOpen className="h-4 w-4" aria-hidden />}
                    actionLabel="Study"
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Course-linked practice for {programName}.
      </p>
    </div>
  );
}

function LinkedProgramsEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
      <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/50" aria-hidden />
      <h2 className="mt-4 text-lg font-bold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <Button asChild size="sm" variant="outline" className="mt-5">
        <Link href={ROUTES.student.payments}>Get Practice Pass for subjects</Link>
      </Button>
    </div>
  );
}

function CourseQuestionbankPanel({ programLinks }: { programLinks: ProgramLink[] }) {
  if (programLinks.length === 0) {
    return (
      <LinkedProgramsEmpty
        title="Questionbank not linked"
        description="This course has no subject linked yet. Your instructor or admin can connect a subject so practice questions appear here."
      />
    );
  }

  return (
    <div className="space-y-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Practice questionbank</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Study sets from subjects linked to this course. Open a set to practice questions.
        </p>
      </div>
      {programLinks.map((link) => (
        <ProgramQuestionbankSection
          key={link.program.id}
          programSlug={link.program.slug}
          programName={link.program.name}
        />
      ))}
    </div>
  );
}

function ProgramKeyConceptsSection({
  programSlug,
  programName,
}: {
  programSlug: string;
  programName: string;
}) {
  const { data, isLoading, error } = useKeyConceptLessons(programSlug);
  const lessons = data?.lessons ?? [];

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        Loading {programName} key concepts…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">Could not load key concepts for {programName}.</p>
        <Button asChild size="sm" variant="outline" className="mt-3">
          <Link href={ROUTES.subjectResource(programSlug, "key-concepts")}>Open Key Concepts</Link>
        </Button>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/60" aria-hidden />
        <p className="mt-3 font-semibold text-foreground">No key concepts yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Nothing published under <span className="font-medium text-foreground">{programName}</span>{" "}
          Key Concepts yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-foreground">{programName}</h3>
          <p className="text-sm text-muted-foreground">{lessons.length} lessons</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={ROUTES.subjectResource(programSlug, "key-concepts")}>Full Key Concepts</Link>
        </Button>
      </div>
      <div className={RESOURCE_GRID}>
        {lessons.map((lesson) => {
          const locked = Boolean(lesson.locked);
          return (
            <ResourceCard
              key={lesson.id}
              href={ROUTES.subjectKeyConceptLesson(programSlug, lesson.slug)}
              unlockHref={ROUTES.subjectResource(programSlug, "key-concepts")}
              title={lesson.title}
              meta={[
                lesson.topic ? `Theme ${lesson.topic.number}` : null,
                lesson.contentType === "VIDEO"
                  ? "Video"
                  : lesson.contentType === "MIXED"
                    ? "Mixed"
                    : "Article",
              ]
                .filter(Boolean)
                .join(" · ")}
              icon={<BookOpen className="h-4 w-4" aria-hidden />}
              actionLabel="Open"
              locked={locked}
            />
          );
        })}
      </div>
    </div>
  );
}

function CourseKeyConceptsPanel({ programLinks }: { programLinks: ProgramLink[] }) {
  if (programLinks.length === 0) {
    return (
      <LinkedProgramsEmpty
        title="Key Concepts not linked"
        description="Link a subject to this course to show Key Concept lessons here."
      />
    );
  }

  return (
    <div className="space-y-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Key Concepts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Short lessons from subjects linked to this course.
        </p>
      </div>
      {programLinks.map((link) => (
        <ProgramKeyConceptsSection
          key={link.program.id}
          programSlug={link.program.slug}
          programName={link.program.name}
        />
      ))}
    </div>
  );
}

function ProgramPracticeExamsSection({
  programSlug,
  programName,
}: {
  programSlug: string;
  programName: string;
}) {
  const { data, isLoading, error } = usePracticeExamTemplates(programSlug);
  const templates = data?.templates ?? [];

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        Loading {programName} practice exams…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">Could not load practice exams for {programName}.</p>
        <Button asChild size="sm" variant="outline" className="mt-3">
          <Link href={ROUTES.subjectResource(programSlug, "practice-exams")}>Open Practice Exams</Link>
        </Button>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
        <Timer className="mx-auto h-8 w-8 text-muted-foreground/60" aria-hidden />
        <p className="mt-3 font-semibold text-foreground">No practice exams yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Nothing published under <span className="font-medium text-foreground">{programName}</span>{" "}
          Practice Exams yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-foreground">{programName}</h3>
          <p className="text-sm text-muted-foreground">{templates.length} exams</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={ROUTES.subjectResource(programSlug, "practice-exams")}>Full Practice Exams</Link>
        </Button>
      </div>
      <div className={RESOURCE_GRID}>
        {templates.map((template) => {
          const locked = Boolean(template.locked);
          return (
            <ResourceCard
              key={template.id}
              href={ROUTES.subjectPracticeExam(programSlug, template.slug)}
              unlockHref={ROUTES.subjectResource(programSlug, "practice-exams")}
              title={template.title}
              meta={[
                template.modeLabel ?? template.mode ?? "MCQ",
                template.durationMin ? `${template.durationMin} min` : null,
                template.totalQuestions ? `${template.totalQuestions} Qs` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              icon={<ClipboardList className="h-4 w-4" aria-hidden />}
              actionLabel="Open"
              locked={locked}
            />
          );
        })}
      </div>
    </div>
  );
}

function CoursePracticeExamsPanel({ programLinks }: { programLinks: ProgramLink[] }) {
  if (programLinks.length === 0) {
    return (
      <LinkedProgramsEmpty
        title="Practice Exams not linked"
        description="Link a subject to this course to show Practice Exams here."
      />
    );
  }

  return (
    <div className="space-y-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Practice Exams</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Timed practice exams from subjects linked to this course.
        </p>
      </div>
      {programLinks.map((link) => (
        <ProgramPracticeExamsSection
          key={link.program.id}
          programSlug={link.program.slug}
          programName={link.program.name}
        />
      ))}
    </div>
  );
}

function ProgramPastPapersSection({
  programSlug,
  programName,
}: {
  programSlug: string;
  programName: string;
}) {
  const { data, isLoading, error } = usePastPaperArchive(programSlug);
  const papers = data?.papers ?? data?.years?.flatMap((y) => y.papers) ?? [];

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        Loading {programName} past papers…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">Could not load past papers for {programName}.</p>
        <Button asChild size="sm" variant="outline" className="mt-3">
          <Link href={ROUTES.subjectResource(programSlug, "past-papers")}>Open Past Papers</Link>
        </Button>
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
        <FileText className="mx-auto h-8 w-8 text-muted-foreground/60" aria-hidden />
        <p className="mt-3 font-semibold text-foreground">No past papers yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Nothing published under <span className="font-medium text-foreground">{programName}</span>{" "}
          Past Papers yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-foreground">{programName}</h3>
          <p className="text-sm text-muted-foreground">{papers.length} papers</p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href={ROUTES.subjectResource(programSlug, "past-papers")}>Full Past Papers</Link>
        </Button>
      </div>
      <div className={RESOURCE_GRID}>
        {papers.map((paper) => {
          const locked = Boolean(paper.locked);
          return (
            <ResourceCard
              key={paper.id}
              href={ROUTES.subjectPastPaper(programSlug, paper.slug)}
              unlockHref={ROUTES.subjectResource(programSlug, "past-papers")}
              title={paper.title}
              meta={[
                String(paper.year),
                paper.session || null,
                paper.paperCode || null,
                paper.totalQuestions ? `${paper.totalQuestions} Qs` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              icon={<FileText className="h-4 w-4" aria-hidden />}
              actionLabel="Open"
              locked={locked}
            />
          );
        })}
      </div>
    </div>
  );
}

function CoursePastPapersPanel({ programLinks }: { programLinks: ProgramLink[] }) {
  if (programLinks.length === 0) {
    return (
      <LinkedProgramsEmpty
        title="Past Papers not linked"
        description="Link a subject to this course to show Past Papers here."
      />
    );
  }

  return (
    <div className="space-y-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Past Papers</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Archive papers from subjects linked to this course.
        </p>
      </div>
      {programLinks.map((link) => (
        <ProgramPastPapersSection
          key={link.program.id}
          programSlug={link.program.slug}
          programName={link.program.name}
        />
      ))}
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
    tabParam === "questionbank" ||
    tabParam === "key-concepts" ||
    tabParam === "practice-exams" ||
    tabParam === "past-papers"
      ? tabParam
      : "lessons";

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

  useEffect(() => {
    if (!requestedLessonId || lessons.length === 0) return;
    const requestedIndex = lessons.findIndex(({ lesson }) => lesson.id === requestedLessonId);
    if (requestedIndex >= 0 && canOpenLesson(lessons[requestedIndex]!.lesson)) {
      setLessonIndex(requestedIndex);
    }
  }, [lessons, requestedLessonId, canOpenLesson]);

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
          This is a paid course. Enroll to access lessons and linked subject practice.
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
  const accessInfo = formatAccessRemaining(enrollment?.expiresAt);

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
        programCount={programLinks.length}
        accessLabel={accessInfo.label}
        accessUrgent={Boolean(accessInfo.expired || (accessInfo.daysLeft != null && accessInfo.daysLeft <= 7))}
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
                    {lessons.length > 0 ? (
                      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5 sm:px-4">
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
        <CourseQuestionbankPanel programLinks={programLinks} />
      ) : null}

      {activeTab === "key-concepts" ? (
        <CourseKeyConceptsPanel programLinks={programLinks} />
      ) : null}

      {activeTab === "practice-exams" ? (
        <CoursePracticeExamsPanel programLinks={programLinks} />
      ) : null}

      {activeTab === "past-papers" ? (
        <CoursePastPapersPanel programLinks={programLinks} />
      ) : null}
    </div>
  );
}
