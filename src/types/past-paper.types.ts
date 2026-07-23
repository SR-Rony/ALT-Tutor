import type { QbAccessBadge } from "@/types/qb.types";

export type PastPaperSourceType = "INTERACTIVE" | "PDF" | "HYBRID";

export type PastPaperQuestionRef = {
  id: string;
  number: number;
  prompt: string;
  marks: number;
  subtopic: { id: string; title: string; slug: string };
};

export type PastPaperItem = {
  id?: string;
  questionId: string;
  order: number;
  marks?: number | null;
  question?: PastPaperQuestionRef;
};

export type PastPaperSection = {
  id?: string;
  title: string;
  code?: string | null;
  instructions?: string | null;
  order: number;
  items: PastPaperItem[];
  questionCount?: number;
};

export type PastPaper = {
  id: string;
  programId?: string;
  year: number;
  session: string;
  paperCode: string;
  title: string;
  slug: string;
  description?: string | null;
  durationMin: number;
  totalMarks: number;
  totalQuestions: number;
  sourceType: PastPaperSourceType;
  pdfUrl?: string | null;
  markSchemeUrl?: string | null;
  accessTier: QbAccessBadge | string;
  isPublished?: boolean;
  order: number;
  isActive?: boolean;
  locked?: boolean;
  attemptCount?: number;
  sections?: PastPaperSection[];
};

export type PastPaperArchiveYear = {
  year: number;
  papers: PastPaper[];
};

export type PastPaperProgramArchive = {
  program: { id: string; name: string; slug: string };
  userTier: QbAccessBadge | string;
  years: PastPaperArchiveYear[];
  papers: PastPaper[];
};

export type PastPaperDetail = {
  program: { id: string; name: string; slug: string };
  userTier?: QbAccessBadge | string;
  paper: PastPaper & {
    sections: Array<{
      id: string;
      title: string;
      code?: string | null;
      instructions?: string | null;
      order: number;
      questionCount: number;
    }>;
  };
};

export type AdminPastPaperList = {
  program: { id: string; name: string; slug: string };
  papers: PastPaper[];
};

export type PastPaperSectionInput = {
  title: string;
  code?: string;
  instructions?: string;
  order: number;
  items: Array<{ questionId: string; marks?: number; order?: number }>;
};

export type CreatePastPaperInput = {
  programId: string;
  year: number;
  session: string;
  paperCode: string;
  title: string;
  slug: string;
  description?: string;
  durationMin: number;
  sourceType: PastPaperSourceType;
  pdfUrl?: string;
  markSchemeUrl?: string;
  accessTier?: QbAccessBadge;
  isPublished?: boolean;
  order?: number;
  isActive?: boolean;
  sections: PastPaperSectionInput[];
};

export type UpdatePastPaperInput = {
  year?: number;
  session?: string;
  paperCode?: string;
  title?: string;
  slug?: string;
  description?: string | null;
  durationMin?: number;
  sourceType?: PastPaperSourceType;
  pdfUrl?: string | null;
  markSchemeUrl?: string | null;
  accessTier?: QbAccessBadge;
  isPublished?: boolean;
  order?: number;
  isActive?: boolean;
  sections?: PastPaperSectionInput[];
};

export type StartPastPaperInput = {
  programSlug: string;
  paperSlug: string;
  forceNew?: boolean;
};

export type PastPaperAttemptQuestion = {
  id: string;
  number: number;
  prompt: string;
  body?: string | null;
  diagramUrl?: string | null;
  difficulty?: string;
  options: string[];
  marks: number;
  order: number;
  studentAnswer?: string | null;
  isCorrect?: boolean | null;
  correctAnswer?: string;
  markScheme?: string | null;
};

export type PastPaperAttemptPayload = {
  restored?: boolean;
  attempt: {
    id: string;
    status: string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    totalMarks: number;
    earnedMarks: number;
    startedAt: string;
    expiresAt?: string | null;
    submittedAt?: string | null;
  };
  paper: {
    id: string;
    title: string;
    slug: string;
    year: number;
    session: string;
    paperCode: string;
    durationMin: number;
    totalMarks: number;
    accessTier: QbAccessBadge | string;
    sourceType: PastPaperSourceType;
  };
  questions: PastPaperAttemptQuestion[];
};
