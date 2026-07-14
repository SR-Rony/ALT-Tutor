export type LessonType = "VIDEO" | "PDF" | "TEXT";

export interface CurriculumLesson {
  id: string;
  title: string;
  type: LessonType | string;
  contentUrl?: string | null;
  duration?: number | null;
  order: number;
  chapterId: string;
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
  type: LessonType;
  contentUrl?: string;
  duration?: number;
  order?: number;
  chapterId: string;
};
