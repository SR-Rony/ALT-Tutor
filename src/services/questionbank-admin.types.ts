import type { QbAccessBadge, QbDifficulty, QbPaper, QbQuestionType } from "@/types/qb.types";

export type CreateQbTopicInput = {
  programId: string;
  title: string;
  slug: string;
  description?: string;
  number?: number;
  order?: number;
  isActive?: boolean;
};

export type CreateQbSubtopicInput = {
  topicId: string;
  title: string;
  slug: string;
  description?: string;
  badge?: QbAccessBadge;
  order?: number;
  isActive?: boolean;
};

export type CreateQbQuestionInput = {
  subtopicId: string;
  number: number;
  prompt: string;
  body?: string;
  diagramUrl?: string;
  difficulty?: QbDifficulty;
  paper?: QbPaper;
  questionType?: QbQuestionType;
  calculatorAllowed?: boolean;
  marks?: number;
  yearHint?: number;
  sourceLabel?: string;
  options: string[];
  correctAnswer: string;
  markScheme?: string;
  videoUrl?: string;
  order?: number;
  isActive?: boolean;
};

export type QbImportError = {
  row: number;
  message: string;
};

export type QbImportResult = {
  imported: number;
  skipped: number;
  errors: QbImportError[];
};
