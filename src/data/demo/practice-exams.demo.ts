import { ROUTES } from "@/constants";

export type RevisionTypeCard = {
  id: string;
  title: string;
  subtitle: string;
  iconBg: string;
  href?: string;
  disabled?: boolean;
};

export function getPracticeExamCards(programSlug: string): RevisionTypeCard[] {
  return [
    {
      id: "topic-quizzes",
      title: "Topic Quizzes",
      subtitle: "Test Yourself",
      iconBg: "bg-accent/15 text-accent",
      href: ROUTES.subjectQuestionbank(programSlug),
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
      subtitle: "Official 2026 Trial Exams",
      iconBg: "bg-[var(--accent-green)]/15 text-[var(--accent-green)]",
      href: ROUTES.subjectPracticeMockExams(programSlug),
    },
    {
      id: "prediction",
      title: "Prediction Exam",
      subtitle: "October 2026 Prediction Exam",
      iconBg: "bg-muted text-muted-foreground",
      disabled: true,
    },
  ];
}

export type MockExamSet = {
  id: string;
  title: string;
  paper: string;
  questionCount: number;
  durationMins: number;
  totalMarks: number;
};

export function getMockExamSets(_programSlug: string): MockExamSet[] {
  return [
    {
      id: "mock-set-1",
      title: "Mock Exam Set 1",
      paper: "Paper 2",
      questionCount: 6,
      durationMins: 90,
      totalMarks: 51,
    },
    {
      id: "mock-set-2",
      title: "Mock Exam Set 2",
      paper: "Paper 1 (MCQ)",
      questionCount: 30,
      durationMins: 60,
      totalMarks: 30,
    },
  ];
}
