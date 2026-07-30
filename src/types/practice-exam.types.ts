import type { QbAccessBadge, QbDifficulty } from "@/types/qb.types";

export type PracticeExamType = "TOPIC_QUIZ" | "MOCK" | "LADDER";
export type PracticeExamMode = "MCQ" | "WRITTEN";
/** PACK = full paper upload; PER_QUESTION = one answer file per question. */
export type PracticeExamWrittenStyle = "PACK" | "PER_QUESTION";

export type PracticeExamBlueprintRule = {
  topicId?: string;
  subtopicId?: string;
  difficulty?: QbDifficulty;
  count?: number;
  questionIds?: string[];
};

export type PracticeExamTemplate = {
  id: string;
  programId: string;
  title: string;
  slug: string;
  description?: string | null;
  type: PracticeExamType;
  typeLabel?: string;
  mode?: PracticeExamMode;
  modeLabel?: string;
  writtenStyle?: PracticeExamWrittenStyle | null;
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
  status: "IN_PROGRESS" | "SUBMITTED" | "GRADED" | "ABANDONED" | string;
  score: number | null;
  correctCount: number | null;
  totalQuestions: number;
  earnedMarks: number | null;
  totalMarks: number | null;
  startedAt: string;
  submittedAt: string | null;
  expiresAt: string | null;
  answeredCount: number;
  answerFileUrls?: string[];
  feedback?: string | null;
  awaitingMarking?: boolean;
  template: {
    id: string;
    title: string;
    slug: string;
    type: PracticeExamType;
    mode?: PracticeExamMode;
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
    status: "IN_PROGRESS" | "SUBMITTED" | "GRADED" | string;
    score: number;
    correctCount: number;
    totalQuestions: number;
    totalMarks: number;
    earnedMarks: number;
    startedAt: string;
    expiresAt: string | null;
    submittedAt: string | null;
    answerFileUrls?: string[];
    passed: boolean | null;
    feedback?: string | null;
    gradedAt?: string | null;
    awaitingMarking?: boolean;
    gradingStatus?: "NONE" | "AWAITING" | "GRADED" | "AUTO" | string;
  };
  template: {
    id: string;
    title: string;
    slug: string;
    type: PracticeExamType | string;
    mode?: PracticeExamMode | string;
    writtenStyle?: PracticeExamWrittenStyle | null;
    durationMin: number;
    passMarkPercent: number | null;
    accessTier: QbAccessBadge | string;
  };
  questions: PracticeExamAttemptQuestion[];
  student?: { id: string; name: string; phone?: string | null; email?: string | null };
  program?: { id: string; name: string; slug: string };
  draftGrade?: number;
  draftFeedback?: string | null;
  isPublished?: boolean;
};

export type WrittenPracticeSubmission = {
  id: string;
  status: string;
  score: number;
  earnedMarks: number;
  totalMarks: number;
  totalQuestions: number;
  answerFileUrls: string[];
  questionAnswerFiles?: Array<{ questionId: string; fileUrl: string }>;
  writtenStyle?: PracticeExamWrittenStyle | null;
  feedback?: string | null;
  gradedAt?: string | null;
  submittedAt: string | null;
  startedAt: string;
  awaitingMarking?: boolean;
  student: { id: string; name: string; phone?: string | null; email?: string | null };
  template: {
    id: string;
    title: string;
    slug: string;
    mode?: PracticeExamMode;
    writtenStyle?: PracticeExamWrittenStyle | null;
    durationMin: number;
    totalQuestions: number;
    passMarkPercent?: number | null;
  };
  program: { id: string; name: string; slug: string };
};

export type GradeWrittenPracticeInput = {
  grade: number;
  feedback?: string;
  publish?: boolean;
};

export type StartPracticeExamInput = {
  programSlug: string;
  templateSlug: string;
  forceNew?: boolean;
};

export type SavePracticeExamAnswerResult =
  | { saved: true; expired: false }
  | { expired: true; result: PracticeExamAttemptPayload };

export type SavePracticeExamAnswerFilesResult =
  | { saved: true; expired: false; answerFileUrls: string[] }
  | { expired: true; result: PracticeExamAttemptPayload };

export type CreatePracticeExamTemplateInput = {
  programId: string;
  title: string;
  slug: string;
  description?: string;
  type: PracticeExamType;
  mode?: PracticeExamMode;
  writtenStyle?: PracticeExamWrittenStyle;
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
> & {
  passMarkPercent?: number | null;
};
