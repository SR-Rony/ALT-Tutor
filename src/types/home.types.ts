export interface HomeCategory {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HomeCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string | null;
  price: number | string;
  level?: string;
  status?: string;
  teacherId?: string;
  categoryId?: string;
  createdAt?: string;
  teacher?: { id: string; name: string; avatar?: string | null };
  category?: HomeCategory | null;
  _count?: { enrollments?: number; reviews?: number };
}

export interface HomeBlog {
  id: string;
  title: string;
  slug: string;
  content?: string;
  thumbnail?: string | null;
  publishedAt?: string | null;
  author?: { id: string; name: string };
}

export interface HomeStats {
  totalCourses: number;
  totalStudents: number;
}

export interface HomeData {
  featuredCourses: HomeCourse[];
  latestBlogs: HomeBlog[];
  stats: HomeStats;
  categories: HomeCategory[];
}
