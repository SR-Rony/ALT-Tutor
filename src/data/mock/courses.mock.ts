import type { Course } from "@/types";

export const mockCourses: Course[] = [
  {
    id: "course-1",
    slug: "ux-design-foundations",
    title: "Foundations of User Experience (UX) Design",
    description: "Learn core UX principles, research methods, and prototyping workflows.",
    thumbnail: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=640&h=360&fit=crop",
    instructorName: "Taylor Teacher",
    price: 49,
    rating: 4.8,
    studentsCount: 1240,
    category: "Design",
  },
  {
    id: "course-2",
    slug: "web-development-basics",
    title: "Web Development Basics",
    description: "HTML, CSS, JavaScript fundamentals for modern web apps.",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=360&fit=crop",
    instructorName: "Taylor Teacher",
    price: 39,
    rating: 4.6,
    studentsCount: 980,
    category: "Development",
  },
];
