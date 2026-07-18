import { mockCourses } from "@/data/mock/courses.mock";
import { env } from "@/config";
import type {
  CatalogCourse,
  CourseChapter,
  CourseDetail,
  CourseLesson,
  CourseReview,
  CoursesListResult,
  CoursesQuery,
} from "@/types/course.types";
import { sleep } from "@/utils";
import { apiClient } from "./api-client";

type BackendTeacher = { id: string; name: string; avatar?: string | null };
type BackendCategory = { id: string; name: string; slug: string };

type BackendCatalogCourse = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string | null;
  price: number | string;
  level?: string;
  teacher?: BackendTeacher | null;
  category?: BackendCategory | null;
  _count?: { enrollments?: number; reviews?: number };
};

type BackendLesson = {
  id: string;
  title: string;
  type: string;
  contentUrl?: string | null;
  duration?: number | null;
  order: number;
};

type BackendChapter = {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  lessons?: BackendLesson[];
};

type BackendReview = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  student?: { id: string; name: string; avatar?: string | null };
};

type BackendCourseDetail = BackendCatalogCourse & {
  chapters?: BackendChapter[];
  reviews?: BackendReview[];
  createdAt?: string;
};

type BackendListResponse = {
  items: BackendCatalogCourse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function mapCatalogCourse(raw: BackendCatalogCourse): CatalogCourse {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    description: raw.description,
    thumbnail: raw.thumbnail ?? null,
    price: Number(raw.price) || 0,
    level: raw.level ?? "BEGINNER",
    teacher: {
      id: raw.teacher?.id ?? "",
      name: raw.teacher?.name ?? "Instructor",
      avatar: raw.teacher?.avatar ?? null,
    },
    category: raw.category
      ? { id: raw.category.id, name: raw.category.name, slug: raw.category.slug }
      : null,
    studentsCount: Number(raw._count?.enrollments) || 0,
    reviewsCount: Number(raw._count?.reviews) || 0,
  };
}

function mapLesson(raw: BackendLesson): CourseLesson {
  return {
    id: raw.id,
    title: raw.title,
    type: raw.type,
    contentUrl: raw.contentUrl ?? null,
    duration: raw.duration ?? null,
    order: raw.order,
  };
}

function mapChapter(raw: BackendChapter): CourseChapter {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? null,
    order: raw.order,
    lessons: (raw.lessons ?? []).map(mapLesson).sort((a, b) => a.order - b.order),
  };
}

function mapReview(raw: BackendReview): CourseReview {
  return {
    id: raw.id,
    rating: Number(raw.rating) || 0,
    comment: raw.comment ?? null,
    createdAt: raw.createdAt,
    student: {
      id: raw.student?.id ?? "",
      name: raw.student?.name ?? "Student",
      avatar: raw.student?.avatar ?? null,
    },
  };
}

function mapDetail(raw: BackendCourseDetail): CourseDetail {
  const base = mapCatalogCourse(raw);
  const reviews = (raw.reviews ?? []).map(mapReview);
  return {
    ...base,
    chapters: (raw.chapters ?? []).map(mapChapter).sort((a, b) => a.order - b.order),
    reviews,
    reviewsCount: reviews.length || base.reviewsCount,
    createdAt: raw.createdAt,
  };
}

function buildQueryString(query: CoursesQuery = {}) {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.categoryId) params.set("categoryId", query.categoryId);
  if (query.level) params.set("level", query.level);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function filterMock(query: CoursesQuery = {}): CoursesListResult {
  let items = [...mockCourses];
  const search = query.search?.trim().toLowerCase();
  if (search) {
    items = items.filter(
      (c) =>
        c.title.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search)
    );
  }
  if (query.categoryId) {
    items = items.filter((c) => c.category?.id === query.categoryId);
  }
  if (query.level) {
    items = items.filter((c) => c.level === query.level);
  }
  const page = query.page ?? 1;
  const limit = query.limit ?? 12;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total,
    page,
    limit,
    totalPages,
  };
}

export const courseService = {
  async getCatalog(query: CoursesQuery = {}): Promise<CoursesListResult> {
    if (env.useMockApi) {
      await sleep(300);
      return filterMock(query);
    }

    const response = await apiClient.get<BackendListResponse>(
      `/courses${buildQueryString(query)}`,
      { skipAuth: true }
    );

    const data = response.data;
    return {
      items: (data.items ?? []).map(mapCatalogCourse),
      total: Number(data.total) || 0,
      page: Number(data.page) || 1,
      limit: Number(data.limit) || 12,
      totalPages: Number(data.totalPages) || 1,
    };
  },

  /** @deprecated Use getCatalog */
  async getAll(): Promise<CatalogCourse[]> {
    const result = await this.getCatalog({ limit: 50 });
    return result.items;
  },

  async getBySlug(slug: string): Promise<CourseDetail | null> {
    if (env.useMockApi) {
      await sleep(300);
      const found = mockCourses.find((course) => course.slug === slug);
      if (!found) return null;
      return {
        ...found,
        chapters: [],
        reviews: [],
      };
    }

    try {
      const response = await apiClient.get<BackendCourseDetail>(`/courses/slug/${slug}`, {
        skipAuth: true,
      });
      return mapDetail(response.data);
    } catch {
      return null;
    }
  },
};
