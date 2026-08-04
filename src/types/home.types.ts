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
  summary?: string | null;
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

export interface HomeFeaturedReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt?: string;
  student: { id: string; name: string; avatar?: string | null };
  course: { id: string; title: string; slug: string };
}

export interface HomePracticeOption {
  key: string;
  text: string;
}

export interface HomePracticeQuestion {
  id: string;
  calculator: boolean;
  difficulty: string;
  stars: number;
  prompt: string;
  body?: string | null;
  diagramUrl?: string | null;
  figureLabel?: string | null;
  marks: number;
  options: HomePracticeOption[];
  correctAnswer: string;
  markScheme?: string | null;
  videoUrl?: string | null;
  videoCount: number;
  bookletLabel: string;
  programSlug: string;
  subtopicSlug: string;
  programName: string;
  topicTitle: string;
  subtopicTitle: string;
  subjectName: string;
  studyHref: string;
}

export interface HomePracticeTab {
  id: string;
  label: string;
  question: HomePracticeQuestion;
}

export interface HomePracticeQuestions {
  title: string;
  subtitle: string;
  tabs: HomePracticeTab[];
}

export interface HomeData {
  featuredCourses: HomeCourse[];
  latestBlogs: HomeBlog[];
  stats: HomeStats;
  categories: HomeCategory[];
  featuredReviews: HomeFeaturedReview[];
  practiceQuestions?: HomePracticeQuestions | null;
}
