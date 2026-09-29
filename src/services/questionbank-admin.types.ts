import type { QbAccessBadge, QbDifficulty, QbPaper, QbPaperKind, QbQuestionType } from "@/types/qb.types";

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
  paperCount?: number;
  isActive?: boolean;
};

export type CreateQbQuestionInput = {
  subtopicId: string;
  number: number;
  prompt: string;
  body?: string | null;
  diagramUrl?: string | null;
  difficulty?: QbDifficulty;
  paper?: QbPaper;
  questionType?: QbQuestionType;
  calculatorAllowed?: boolean;
  marks?: number;
  yearHint?: number | null;
  sourceLabel?: string | null;
  options: string[];
  correctAnswer: string;
  markScheme?: string | null;
  videoUrl?: string | null;
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

export type AddQbPaperInput = {
  label?: string;
  questionKind: QbPaperKind;
};

export type UpdateQbPaperConfigInput = {
  label?: string;
  questionKind?: QbPaperKind;
};
