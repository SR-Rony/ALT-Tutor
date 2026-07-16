import { ROUTES } from "@/constants";
import type { McqExam } from "@/types/mcq.types";
import type { QbProgramOverview } from "@/types/qb.types";

const VIDEO_THUMBNAILS = [
  "/images/video-lessons/video-lesson-1.png",
  "/images/video-lessons/video-lesson-2.png",
  "/images/video-lessons/video-lesson-3.png",
  "/images/video-lessons/video-lesson-4.png",
] as const;

export type PastPaperItem = {
  id: string;
  label: string;
  kind: "MCQ" | "SQ";
  href: string;
};

export type PastPaperSession = {
  year: number;
  session: string;
  papers: PastPaperItem[];
};

export type MockExamSet = {
  id: string;
  title: string;
  paper: string;
  questionCount: number;
  durationMins: number;
  totalMarks: number;
  href: string;
};

export type KeyConceptVideo = {
  id: string;
  title: string;
  duration: string;
  thumbnail: (typeof VIDEO_THUMBNAILS)[number];
  href: string;
};

export type KeyConceptSection = {
  id: string;
  chapterTitle: string;
  topicTitle: string;
  videos: KeyConceptVideo[];
};

export type RevisionTypeCard = {
  id: string;
  title: string;
  subtitle: string;
  iconBg: string;
  href?: string;
  disabled?: boolean;
};

function studySubtopics(program?: QbProgramOverview) {
  return (program?.qbTopics ?? []).flatMap((topic) =>
    topic.subtopics.filter((s) => !s.slug.endsWith("-all") && (s._count?.questions ?? 0) > 0)
  );
}

function firstStudySubtopic(program?: QbProgramOverview) {
  return studySubtopics(program)[0] ?? program?.qbTopics[0]?.subtopics[0] ?? null;
}

export function buildPastPaperSessions(
  programSlug: string,
  program?: QbProgramOverview,
  mcqExams: McqExam[] = [],
  isAuthenticated = false
): PastPaperSession[] {
  const year = new Date().getFullYear();
  const subtopics = studySubtopics(program);

  const mcqPapers: PastPaperItem[] = mcqExams.map((exam, index) => ({
    id: exam.id,
    label: exam.title.includes("MCQ") ? exam.title : `Paper ${11 + index} (MCQ)`,
    kind: "MCQ",
    href: isAuthenticated
      ? ROUTES.student.mcqExam(exam.id)
      : `${ROUTES.auth.login}?next=${encodeURIComponent(ROUTES.student.assignments)}`,
  }));

  const sqPapers: PastPaperItem[] = subtopics.map((sub, index) => ({
    id: sub.id,
    label: `Paper ${21 + index} (SQ)`,
    kind: "SQ",
    href: ROUTES.subjectQuestionbankStudyExam(programSlug, sub.slug, { paper: "PAPER_2" }),
  }));

  const papers = [...mcqPapers, ...sqPapers];
  if (papers.length === 0) return [];

  return [
    {
      year,
      session: "May TZ1",
      papers,
    },
    {
      year: year - 1,
      session: "November TZ2",
      papers: sqPapers.slice(0, Math.max(1, Math.min(3, sqPapers.length))),
    },
  ].filter((session) => session.papers.length > 0);
}

export function buildMockExamSets(programSlug: string, program?: QbProgramOverview): MockExamSet[] {
  return studySubtopics(program).map((sub) => {
    const count = sub._count?.questions ?? 0;
    return {
      id: sub.id,
      title: sub.title,
      paper: count > 0 ? "Paper 2" : "Paper 1 (MCQ)",
      questionCount: count,
      durationMins: Math.max(30, count * 12),
      totalMarks: Math.max(count * 6, count),
      href: ROUTES.subjectQuestionbankStudyExam(programSlug, sub.slug, { paper: "PAPER_2" }),
    };
  });
}

export function buildKeyConceptSections(
  programSlug: string,
  program?: QbProgramOverview
): KeyConceptSection[] {
  return (program?.qbTopics ?? [])
    .map((topic, topicIndex) => ({
      id: topic.id,
      chapterTitle: `Chapter ${topic.number}: ${topic.title}`,
      topicTitle: topic.description ?? topic.title,
      videos: topic.subtopics
        .filter((s) => !s.slug.endsWith("-all"))
        .map((sub, subIndex) => ({
          id: sub.id,
          title: sub.title,
          duration: `${8 + ((topicIndex + subIndex) % 7)} mins`,
          thumbnail: VIDEO_THUMBNAILS[(topicIndex + subIndex) % VIDEO_THUMBNAILS.length],
          href: ROUTES.subjectQuestionbankStudy(programSlug, sub.slug),
        })),
    }))
    .filter((section) => section.videos.length > 0);
}

export function buildPracticeExamCards(
  programSlug: string,
  program?: QbProgramOverview
): RevisionTypeCard[] {
  const first = firstStudySubtopic(program);

  return [
    {
      id: "topic-quizzes",
      title: "Topic Quizzes",
      subtitle: "Test Yourself",
      iconBg: "bg-accent/15 text-accent",
      href: first
        ? ROUTES.subjectQuestionbankStudy(programSlug, first.slug)
        : ROUTES.subjectQuestionbank(programSlug),
    },
    {
      id: "revision-ladder",
      title: "Revision Ladder",
      subtitle: "Exams by Difficulty",
      iconBg: "bg-violet-100 text-violet-700",
      href: ROUTES.subjectQuestionbank(programSlug),
    },
    {
      id: "mock-exams",
      title: "Mock Exam Papers",
      subtitle: "Trial examinations by topic",
      iconBg: "bg-[var(--accent-green)]/15 text-[var(--accent-green)]",
      href: ROUTES.subjectPracticeMockExams(programSlug),
    },
    {
      id: "prediction",
      title: "Prediction Exam",
      subtitle: "Coming in next release",
      iconBg: "bg-muted text-muted-foreground",
      disabled: true,
    },
  ];
}

export function mockExamSummary(program?: QbProgramOverview) {
  const sets = buildMockExamSets("", program);
  const totalQuestions = sets.reduce((sum, s) => sum + s.questionCount, 0);
  const totalMins = sets.reduce((sum, s) => sum + s.durationMins, 0);
  const totalMarks = sets.reduce((sum, s) => sum + s.totalMarks, 0);
  return {
    questionCount: totalQuestions || 6,
    durationMins: totalMins || 90,
    totalMarks: totalMarks || 51,
  };
}
