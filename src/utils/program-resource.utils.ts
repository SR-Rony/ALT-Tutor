import { ROUTES } from "@/constants";
import type { McqExam } from "@/types/mcq.types";
import type { QbProgramOverview } from "@/types/qb.types";

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
