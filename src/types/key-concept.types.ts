import type { QbAccessBadge } from "@/types/qb.types";

export type KeyConceptContentType = "VIDEO" | "ARTICLE" | "MIXED";

export type KeyConceptTopicRef = {
  id: string;
  title: string;
  slug: string;
  number: number;
};

export type KeyConceptSubtopicRef = {
  id: string;
  title: string;
  slug: string;
  badge: QbAccessBadge | string;
};

export type KeyConceptLesson = {
  id: string;
  programId?: string;
  topicId?: string;
  subtopicId?: string | null;
  title: string;
  slug: string;
  summary?: string | null;
  contentType: KeyConceptContentType;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  bodyMarkdown?: string | null;
  durationSec?: number | null;
  accessTier: QbAccessBadge | string;
  isPublished?: boolean;
  order: number;
  isActive?: boolean;
  locked?: boolean;
  hasBody?: boolean;
  hasVideo?: boolean;
  practiceSubtopicSlug?: string | null;
  topic?: KeyConceptTopicRef;
  subtopic?: KeyConceptSubtopicRef | null;
};

export type KeyConceptLessonDetail = {
  program: { id: string; name: string; slug: string };
  userTier?: QbAccessBadge | string;
  lesson: KeyConceptLesson;
};

export type KeyConceptProgramList = {
  program: { id: string; name: string; slug: string };
  userTier: QbAccessBadge | string;
  lessons: KeyConceptLesson[];
};

export type AdminKeyConceptList = {
  program: { id: string; name: string; slug: string };
  lessons: KeyConceptLesson[];
};

export type CreateKeyConceptLessonInput = {
  programId: string;
  topicId: string;
  subtopicId?: string;
  title: string;
  slug: string;
  summary?: string;
  contentType: KeyConceptContentType;
  videoUrl?: string;
  thumbnailUrl?: string;
  bodyMarkdown?: string;
  durationSec?: number;
  accessTier?: QbAccessBadge;
  isPublished?: boolean;
  order?: number;
  isActive?: boolean;
};

export type UpdateKeyConceptLessonInput = {
  topicId?: string;
  subtopicId?: string | null;
  title?: string;
  slug?: string;
  summary?: string | null;
  contentType?: KeyConceptContentType;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  bodyMarkdown?: string | null;
  durationSec?: number | null;
  accessTier?: QbAccessBadge;
  isPublished?: boolean;
  order?: number;
  isActive?: boolean;
};
