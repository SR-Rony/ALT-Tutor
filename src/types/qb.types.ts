export type QbDifficulty = "EASY" | "MEDIUM" | "HARD";
export type QbPaper = "PAPER_1" | "PAPER_2" | "PAPER_3";
export type QbQuestionType = "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "DATA_BASED";
export type QbAccessBadge = "FREE" | "GOLD";

export interface QbQuestion {
  id: string;
  number: number;
  prompt: string;
  body?: string | null;
  diagramUrl?: string | null;
  difficulty: QbDifficulty | string;
  paper: QbPaper | string;
  questionType: QbQuestionType | string;
  calculatorAllowed: boolean;
  options: string[];
  correctAnswer: string;
  markScheme?: string | null;
  videoUrl?: string | null;
  order: number;
  isActive: boolean;
  subtopicId: string;
}

export interface QbSubtopic {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  order: number;
  badge: QbAccessBadge | string;
  isActive: boolean;
  topicId: string;
  _count?: { questions: number };
  questions?: QbQuestion[];
}

export interface QbTopic {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  number: number;
  order: number;
  isActive: boolean;
  programId: string;
  subtopics: QbSubtopic[];
  program?: { id: string; name: string; slug: string };
}

export interface QbProgramOverview {
  id: string;
  name: string;
  slug: string;
  subject: {
    id: string;
    name: string;
    slug: string;
    category: { id: string; name: string; slug: string };
  };
  qbTopics: QbTopic[];
}

export interface QbStudyPayload {
  subtopic: QbSubtopic & {
    topic: QbTopic & {
      program: QbProgramOverview;
    };
  };
  questions: QbQuestion[];
}

export type QbFilters = {
  difficulty?: QbDifficulty[];
  paper?: QbPaper[];
  type?: QbQuestionType[];
};

export type PracticeMode = "STUDY" | "EXAM";
export type PracticeSessionStatus = "IN_PROGRESS" | "SUBMITTED";

export interface PracticeAnswerFeedback {
  isCorrect: boolean;
  correctAnswer: string;
  markScheme?: string | null;
  videoUrl?: string | null;
}

export interface PracticeSession {
  id: string;
  studentId: string;
  programId: string;
  subtopicId: string;
  mode: PracticeMode;
  status: PracticeSessionStatus;
  questionIds: string[];
  totalQuestions: number;
  correctCount?: number | null;
  score?: number | null;
  expiresAt?: string | null;
  submittedAt?: string | null;
  createdAt: string;
}

export interface PracticeSessionStart {
  session: PracticeSession;
  access: { canAccess: boolean; canViewSolutions: boolean; reason?: string | null };
  questions: QbQuestion[];
}

export interface PracticeQuestionResult extends QbQuestion {
  studentAnswer?: string | null;
  isCorrect?: boolean | null;
}

export interface PracticeSessionResult {
  session: PracticeSession;
  questions: PracticeQuestionResult[];
}

export interface StartPracticeSessionInput {
  programSlug: string;
  subtopicSlug: string;
  mode: PracticeMode;
  difficulty?: QbDifficulty[];
  paper?: QbPaper[];
  questionType?: QbQuestionType[];
  durationMinutes?: number;
}
