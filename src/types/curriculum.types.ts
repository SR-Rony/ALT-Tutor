export type LessonType = "VIDEO" | "PDF" | "TEXT";

export interface LessonAttachment {
  id: string;
  filename: string;
  url: string;
  publicId?: string | null;
  mimeType?: string | null;
  size?: number | null;
  order: number;
  lessonId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurriculumLesson {
  id: string;
  title: string;
  description?: string | null;
  body?: string | null;
  type: LessonType | string;
  contentUrl?: string | null;
  contentPublicId?: string | null;
  duration?: number | null;
  order: number;
  isPublished?: boolean;
  isPreview?: boolean;
  chapterId: string;
  attachments?: LessonAttachment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CurriculumChapter {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  isPublished?: boolean;
  courseId: string;
  lessons: CurriculumLesson[];
  createdAt?: string;
  updatedAt?: string;
}

export type ChapterInput = {
  title: string;
  description?: string;
  order?: number;
  isPublished?: boolean;
  courseId: string;
};

export type LessonInput = {
  title: string;
  description?: string;
  body?: string;
  type: LessonType;
  contentUrl?: string;
  contentPublicId?: string;
  duration?: number;
  order?: number;
  isPublished?: boolean;
  isPreview?: boolean;
  chapterId: string;
};

export type LessonAttachmentInput = {
  filename: string;
  url: string;
  publicId?: string;
  mimeType?: string;
  size?: number;
  order?: number;
};
