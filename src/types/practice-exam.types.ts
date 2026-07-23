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
