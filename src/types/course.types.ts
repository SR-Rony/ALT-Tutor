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
  thumbnail: string | null;
  price: number;
  level: CourseLevel | string;
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

export interface CourseLesson {
  id: string;
  title: string;
  type: string;
  duration?: number | null;
  order: number;
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
  chapters: CourseChapter[];
  reviews: CourseReview[];
  createdAt?: string;
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
