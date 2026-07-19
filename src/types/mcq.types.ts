export type McqPhase = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CAN_RETAKE";
export type McqAttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "TIME_EXPIRED";

export interface McqQuestion {
  id: string;
  text: string;
  options: string[];
  order: number;
  /** Present on manager/admin payloads only */
  correctAnswer?: string;
  sourceQuestionId?: string | null;
}

export interface McqExam {
  id: string;
  title: string;
  description: string;
  type: "MCQ";
  status?: "DRAFT" | "PUBLISHED" | "CLOSED" | string;
  courseId?: string | null;
  programId?: string | null;
  durationMinutes?: number | null;
  maxAttempts?: number;
  passingScore?: number | null;
  dueDate?: string | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
  resultReleaseMode?: ResultReleaseMode;
  createdAt?: string;
  course?: { id: string; title: string; slug: string };
  program?: { id: string; name: string; slug: string };
  questions?: McqQuestion[];
  selectedQuestionbankIds?: string[];
  _count?: { mcqAttempts?: number; questions?: number };
  mcqStatus?: McqExamStatus | null;
}

export interface McqExamStatus {
  assignmentId: string;
  title: string;
  description: string;
  durationMinutes?: number | null;
  maxAttempts: number;
  passingScore?: number | null;
  questionCount: number;
  phase: McqPhase;
  attemptsUsed: number;
  attemptsRemaining: number;
  canRetake: boolean;
  inProgressAttemptId?: string | null;
  latestResult?: McqResult | null;
  resultReleaseMode?: ResultReleaseMode;
  reviewAnswersAfter?: boolean;
  resultsReleased?: boolean;
  canReviewAnswers?: boolean;
  finishedAttemptCount?: number;
  bestScore?: number | null;
  latestScore?: number | null;
  scoreTrend?: Array<{ attemptNumber: number; score: number; passed: boolean }>;
}

export type ResultReleaseMode = "IMMEDIATE" | "AFTER_CLOSE" | "MANUAL";

export interface McqSession {
  attemptId: string;
  attemptNumber: number;
  assignmentId: string;
  title: string;
  status: McqAttemptStatus;
  startedAt: string;
  expiresAt: string;
  remainingSeconds: number;
  durationMinutes?: number | null;
  maxAttempts: number;
  totalQuestions: number;
  savedAnswers: Record<string, string>;
  questions: McqQuestion[];
}

export interface McqReviewItem {
  questionId: string;
  text: string;
  options: string[];
  order: number;
  yourAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface McqResult {
  attemptId: string;
  attemptNumber: number;
  status: McqAttemptStatus;
  score: number | null;
  accuracy: number | null;
  correctCount: number | null;
  answeredCount: number;
  totalQuestions: number;
  unansweredCount: number;
  passed: boolean | null;
  passingScore?: number | null;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string | null;
  message?: string;
  resultsReleased?: boolean;
  canReviewAnswers?: boolean;
  resultReleaseMode?: ResultReleaseMode;
  yourAnswers?: Record<string, string>;
  review?: McqReviewItem[];
}

export interface McqAttemptHistory {
  assignmentId: string;
  title: string;
  resultsReleased: boolean;
  canReviewAnswers: boolean;
  resultReleaseMode: ResultReleaseMode;
  finishedAttemptCount: number;
  bestScore: number | null;
  latestScore: number | null;
  scoreTrend: Array<{ attemptNumber: number; score: number; passed: boolean }>;
  latest: McqResult;
  attempts: McqResult[];
}

export interface McqAttemptRow {
  id: string;
  attemptNumber: number;
  status: McqAttemptStatus;
  score: number;
  accuracy: number;
  correctCount: number;
  answeredCount: number;
  totalQuestions: number;
  passed: boolean;
  startedAt: string;
  submittedAt?: string | null;
  student: { id: string; name: string; phone: string; avatar?: string | null };
}

export type CreateMcqExamInput = {
  title: string;
  description: string;
  courseId?: string;
  programId?: string;
  status?: "DRAFT" | "PUBLISHED" | "CLOSED";
  durationMinutes?: number;
  maxAttempts?: number;
  passingScore?: number;
  dueDate?: string;
  availableFrom?: string;
  availableUntil?: string;
  resultReleaseMode?: ResultReleaseMode;
  questions?: { text: string; options: string[]; correctAnswer: string; order?: number }[];
  questionbankQuestionIds?: string[];
};
