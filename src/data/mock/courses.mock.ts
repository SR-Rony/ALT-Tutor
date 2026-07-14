import type { CatalogCourse } from "@/types/course.types";

export const mockCourses: CatalogCourse[] = [
  {
    id: "course-1",
    slug: "ux-design-foundations",
    title: "Foundations of User Experience (UX) Design",
    description: "Learn core UX principles, research methods, and prototyping workflows.",
    thumbnail: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=640&h=360&fit=crop",
    price: 49,
    level: "BEGINNER",
    teacher: { id: "t1", name: "Taylor Teacher", avatar: null },
    category: { id: "cat-design", name: "UI/UX Design", slug: "ui-ux-design" },
    studentsCount: 1240,
    reviewsCount: 48,
  },
  {
    id: "course-2",
    slug: "web-development-basics",
    title: "Web Development Basics",
    description: "HTML, CSS, JavaScript fundamentals for modern web apps.",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=360&fit=crop",
    price: 39,
    level: "BEGINNER",
    teacher: { id: "t1", name: "Taylor Teacher", avatar: null },
    category: { id: "cat-web", name: "Web Development", slug: "web-development" },
    studentsCount: 980,
    reviewsCount: 32,
  },
];
