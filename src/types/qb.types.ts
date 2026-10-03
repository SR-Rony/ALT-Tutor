import type { QbAccessBadge } from "@/lib/access-tier";

export type QbDifficulty = "EASY" | "MEDIUM" | "HARD";
/** Dynamic paper key, e.g. PAPER_1 … PAPER_N */
export type QbPaper = string;
export type QbQuestionType = "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "DATA_BASED";
export type { QbAccessBadge } from "@/lib/access-tier";

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
  marks?: number;
  yearHint?: number | null;
  sourceLabel?: string | null;
  options: string[];
  correctAnswer: string;
  markScheme?: string | null;
  videoUrl?: string | null;
  order: number;
  isActive: boolean;
  subtopicId: string;
}

export type QbPaperKind = "MCQ" | "WRITTEN";

export interface QbPaperConfigEntry {
  label: string;
  questionKind: QbPaperKind;
}

export type QbPaperConfig = Record<string, QbPaperConfigEntry>;

export interface QbSubtopic {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  order: number;
  badge: QbAccessBadge | string;
  /** Number of Paper tabs (Paper 1 … Paper N). */
  paperCount?: number;
  /** Per-paper label and MCQ/Written kind. */
  paperConfig?: QbPaperConfig | null;
  /** BDT price to unlock only this study set (Decimal → string from the API). */
  price?: number | string | null;
  regularPrice?: number | string | null;
  /** Days of access per purchase; null = lifetime. */
  accessDurationDays?: number | null;
  isActive: boolean;
  topicId: string;
  /** True when the current user can't open this set (no tier access and not bought). */
  locked?: boolean;
  /** True when the current user bought / was granted this set individually. */
  purchased?: boolean;
  accessExpiresAt?: string | null;
  /** Admin list only: students who can open this set via an individual purchase/grant. */
  activeAccessCount?: number;
  _count?: { questions: number };
  questions?: QbQuestion[];
}

export type StudySetAccessSource = "PURCHASE" | "MANUAL_PAYMENT" | "ADMIN_GRANT";

export interface StudySetAccessRow {
  id: string;
  studentId: string;
  subtopicId: string;
  source: StudySetAccessSource | string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | string;
  note?: string | null;
  startsAt: string;
  expiresAt: string | null;
  createdAt: string;
  isCurrent: boolean;
  isQueued: boolean;
  student: { id: string; name: string; phone: string; email?: string | null };
  grantedBy?: { id: string; name: string } | null;
  payment?: {
    id: string;
    amount: number | string;
    currency: string;
    provider: string;
    status: string;
    transactionId?: string | null;
    gatewayTxnId?: string | null;
    paidAt?: string | null;
    method?: string | null;
    reference?: string | null;
  } | null;
}

export type ManualPaymentMethod =
  | "CASH"
  | "BKASH"
  | "NAGAD"
  | "ROCKET"
  | "BANK"
  | "CARD"
  | "OTHER";

export interface GrantStudySetAccessInput {
  studentId: string;
  amount?: number;
  method?: ManualPaymentMethod;
  reference?: string;
  note?: string;
  /** Omit for the study set default; null = lifetime. */
  durationDays?: number | null;
}

export interface QbProgramAccess {
  userTier?: QbAccessBadge | string;
  source?: "GOLD_PASS" | "ADMIN_GRANT" | "COURSE" | null;
  purchasedAt?: string | null;
  expiresAt?: string | null;
  hasProgramAccess: boolean;
  canStudyFree: boolean;
  canStudySilver?: boolean;
  canStudyGold: boolean;
  canStudyDiamond?: boolean;
}

export interface QbStudyAccess {
  canAccess: boolean;
  canViewSolutions: boolean;
  reason?: string | null;
  /** Set when access comes from an individual study set purchase (null = lifetime). */
  accessExpiresAt?: string | null;
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
  access?: QbProgramAccess;
  qbTopics: QbTopic[];
}

export interface QbStudyPayload {
  subtopic: QbSubtopic & {
    topic: QbTopic & {
      program: QbProgramOverview;
    };
  };
  access?: QbStudyAccess;
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
  questions: PracticeQuestionResult[];
  restored?: boolean;
}

export interface PracticeQuestionResult extends QbQuestion {
  studentAnswer?: string | null;
  isCorrect?: boolean | null;
}

export interface PracticeSessionResult {
  session: PracticeSession;
  questions: PracticeQuestionResult[];
}

export interface PracticeHistoryItem extends Omit<PracticeSession, "subtopicId"> {
  answeredCount: number;
  program: { id: string; name: string; slug: string };
  subtopicId?: string | null;
}

export interface StartPracticeSessionInput {
  programSlug: string;
  subtopicSlug: string;
  mode: PracticeMode;
  difficulty?: QbDifficulty[];
  paper?: QbPaper[];
  questionType?: QbQuestionType[];
  durationMinutes?: number;
  forceNew?: boolean;
}
