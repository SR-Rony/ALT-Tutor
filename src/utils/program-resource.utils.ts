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

function studySubtopics(program?: QbProgramOverview) {
  return (program?.qbTopics ?? []).flatMap((topic) =>
    topic.subtopics.filter((s) => !s.slug.endsWith("-all") && (s._count?.questions ?? 0) > 0)
  );
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
