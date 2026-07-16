export type McqPhase = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CAN_RETAKE";
export type McqAttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "TIME_EXPIRED";

export interface McqQuestion {
  id: string;
  text: string;
  options: string[];
  order: number;
}

export interface McqExam {
  id: string;
  title: string;
  description: string;
  type: "MCQ";
  courseId: string;
  durationMinutes?: number | null;
  maxAttempts?: number;
  passingScore?: number | null;
  dueDate?: string | null;
  createdAt?: string;
  course?: { id: string; title: string; slug: string };
  questions?: McqQuestion[];
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
}

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

export interface McqResult {
  attemptId: string;
  attemptNumber: number;
  status: McqAttemptStatus;
  score: number;
  accuracy: number;
  correctCount: number;
  answeredCount: number;
  totalQuestions: number;
  unansweredCount: number;
  passed: boolean;
  passingScore?: number | null;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string | null;
  message?: string;
  yourAnswers?: Record<string, string>;
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
  courseId: string;
  durationMinutes: number;
  maxAttempts?: number;
  passingScore?: number;
  dueDate?: string;
  questions: { text: string; options: string[]; correctAnswer: string; order?: number }[];
};
