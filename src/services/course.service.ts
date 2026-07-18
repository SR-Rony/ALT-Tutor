import { mockCourses } from "@/data/mock/courses.mock";
import { env } from "@/config";
import type {
  CatalogCourse,
  CourseChapter,
  CourseDetail,
  CourseLesson,
  CourseLessonAttachment,
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
  summary?: string | null;
  thumbnail?: string | null;
  price: number | string;
  regularPrice?: number | string | null;
  level?: string;
  language?: string;
  teacher?: BackendTeacher | null;
  category?: BackendCategory | null;
  _count?: { enrollments?: number; reviews?: number };
};

type BackendAttachment = {
  id: string;
  filename: string;
  url: string;
  mimeType?: string | null;
  size?: number | null;
  order: number;
};

type BackendLesson = {
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
  attachments?: BackendAttachment[];
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
  promoVideoUrl?: string | null;
  outcomes?: string[];
  requirements?: string[];
  targetAudience?: string | null;
  hasCertificate?: boolean;
  lifetimeAccess?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  chapters?: BackendChapter[];
  reviews?: BackendReview[];
  createdAt?: string;
  updatedAt?: string;
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
    summary: raw.summary ?? null,
    thumbnail: raw.thumbnail ?? null,
    price: Number(raw.price) || 0,
    regularPrice: Number(raw.regularPrice) > 0 ? Number(raw.regularPrice) : null,
    level: raw.level ?? "BEGINNER",
    language: raw.language ?? "English",
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

function mapAttachment(raw: BackendAttachment): CourseLessonAttachment {
  return {
    id: raw.id,
    filename: raw.filename,
    url: raw.url,
    mimeType: raw.mimeType ?? null,
    size: raw.size ?? null,
    order: raw.order,
  };
}

function mapLesson(raw: BackendLesson): CourseLesson {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? null,
    body: raw.body ?? null,
    type: raw.type,
    contentUrl: raw.contentUrl ?? null,
    duration: raw.duration ?? null,
    order: raw.order,
    isPublished: raw.isPublished ?? true,
    isPreview: raw.isPreview ?? false,
    attachments: (raw.attachments ?? []).map(mapAttachment).sort((a, b) => a.order - b.order),
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
    promoVideoUrl: raw.promoVideoUrl ?? null,
    outcomes: raw.outcomes ?? [],
    requirements: raw.requirements ?? [],
    targetAudience: raw.targetAudience ?? null,
    hasCertificate: raw.hasCertificate ?? true,
    lifetimeAccess: raw.lifetimeAccess ?? true,
    seoTitle: raw.seoTitle ?? null,
    seoDescription: raw.seoDescription ?? null,
    chapters: (raw.chapters ?? []).map(mapChapter).sort((a, b) => a.order - b.order),
    reviews,
    reviewsCount: reviews.length || base.reviewsCount,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
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
