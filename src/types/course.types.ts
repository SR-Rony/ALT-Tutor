export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface CourseTeacher {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface CourseCategoryRef {
  id: string;
  name: string;
  slug: string;
}

export interface CatalogCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  summary?: string | null;
  thumbnail: string | null;
  price: number;
  level: CourseLevel | string;
  language?: string;
  teacher: CourseTeacher;
  category: CourseCategoryRef | null;
  studentsCount: number;
  reviewsCount: number;
}

/** @deprecated Prefer CatalogCourse — kept for older mock references */
export type Course = CatalogCourse & {
  instructorName?: string;
  categoryName?: string;
  rating?: number;
};

export interface CourseLessonAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType?: string | null;
  size?: number | null;
  order: number;
}

export interface CourseLesson {
  id: string;
  title: string;
  description?: string | null;
  body?: string | null;
  type: string;
  contentUrl?: string | null;
  duration?: number | null;
  order: number;
  isPublished?: boolean;
  isPreview?: boolean;
  attachments?: CourseLessonAttachment[];
}

export interface CourseChapter {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  lessons: CourseLesson[];
}

export interface CourseReview {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  student: { id: string; name: string; avatar?: string | null };
}

export interface CourseDetail extends CatalogCourse {
  promoVideoUrl?: string | null;
  outcomes?: string[];
  requirements?: string[];
  targetAudience?: string | null;
  hasCertificate?: boolean;
  lifetimeAccess?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  chapters: CourseChapter[];
  reviews: CourseReview[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CoursesQuery {
  search?: string;
  categoryId?: string;
  level?: string;
  page?: number;
  limit?: number;
}

export interface CoursesListResult {
  items: CatalogCourse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
