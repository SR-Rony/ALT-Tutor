import type { QbAccessBadge, QbDifficulty } from "@/types/qb.types";

export type PracticeExamType = "TOPIC_QUIZ" | "MOCK" | "LADDER";

export type PracticeExamBlueprintRule = {
  topicId?: string;
  subtopicId?: string;
  difficulty?: QbDifficulty;
  count: number;
};

export type PracticeExamTemplate = {
  id: string;
  programId: string;
  title: string;
  slug: string;
  description?: string | null;
  type: PracticeExamType;
  typeLabel?: string;
  durationMin: number;
  totalQuestions: number;
  passMarkPercent?: number | null;
  blueprint: PracticeExamBlueprintRule[];
  accessTier: QbAccessBadge | string;
  isPublished: boolean;
  order: number;
  isActive: boolean;
  locked?: boolean;
};

export type AdminPracticeExamList = {
  program: { id: string; name: string; slug: string };
  templates: PracticeExamTemplate[];
};

export type PracticeExamProgramList = {
  program: { id: string; name: string; slug: string };
  userTier: QbAccessBadge | string;
  templates: PracticeExamTemplate[];
};

export type PracticeExamTemplateDetail = {
  program: { id: string; name: string; slug: string };
  template: PracticeExamTemplate & {
    blueprintSummary?: PracticeExamBlueprintRule[];
  };
};

export type PracticeExamHistoryItem = {
  id: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "ABANDONED" | string;
  score: number | null;
  correctCount: number | null;
  totalQuestions: number;
  earnedMarks: number | null;
  totalMarks: number | null;
  startedAt: string;
  submittedAt: string | null;
  expiresAt: string | null;
  answeredCount: number;
  template: {
    id: string;
    title: string;
    slug: string;
    type: PracticeExamType;
    durationMin: number;
    accessTier: QbAccessBadge | string;
  };
  program: { id: string; name: string; slug: string };
};

export type PracticeExamAttemptQuestion = {
  id: string;
  number: number;
  prompt: string;
  body?: string | null;
  diagramUrl?: string | null;
  difficulty?: string | null;
  paper?: string | null;
  questionType: string;
  calculatorAllowed?: boolean;
  marks?: number | null;
  options: string[];
  order: number;
  correctAnswer?: string;
  markScheme?: string | null;
  videoUrl?: string | null;
  studentAnswer?: string | null;
  isCorrect?: boolean | null;
};

export type PracticeExamAttemptPayload = {
  restored: boolean;
  attempt: {
    id: string;
    status: "IN_PROGRESS" | "SUBMITTED" | string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    totalMarks: number;
    earnedMarks: number;
    startedAt: string;
    expiresAt: string | null;
    submittedAt: string | null;
    passed: boolean | null;
  };
  template: {
    id: string;
    title: string;
    slug: string;
    type: PracticeExamType | string;
    durationMin: number;
    passMarkPercent: number | null;
    accessTier: QbAccessBadge | string;
  };
  questions: PracticeExamAttemptQuestion[];
};

export type StartPracticeExamInput = {
  programSlug: string;
  templateSlug: string;
  forceNew?: boolean;
};

export type SavePracticeExamAnswerResult =
  | { saved: true; expired: false }
  | { expired: true; result: PracticeExamAttemptPayload };

export type CreatePracticeExamTemplateInput = {
  programId: string;
  title: string;
  slug: string;
  description?: string;
  type: PracticeExamType;
  durationMin: number;
  totalQuestions: number;
  passMarkPercent?: number;
  blueprint: PracticeExamBlueprintRule[];
  accessTier?: QbAccessBadge;
  isPublished?: boolean;
  order?: number;
  isActive?: boolean;
};

export type UpdatePracticeExamTemplateInput = Partial<
  Omit<CreatePracticeExamTemplateInput, "programId">
>;
