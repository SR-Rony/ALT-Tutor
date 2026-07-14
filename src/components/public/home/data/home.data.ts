export const heroBadge = "Trusted by 500+ institutions worldwide";

export const heroHeadline = {
  lead: "Empower every learner with a",
  highlight: "next-generation LMS",
} as const;

export const heroDescription =
  "Deliver structured courses, live sessions, quizzes, and verified certificates — all in one platform built for students, instructors, and administrators.";

export const heroHighlights = [
  {
    title: "Live & self-paced learning",
    description: "Host webinars, record sessions, and let learners study on their schedule.",
  },
  {
    title: "Certificates & assessments",
    description: "Automated grading, quizzes, and shareable credentials upon completion.",
  },
  {
    title: "Role-based dashboards",
    description: "Dedicated workspaces for students, teachers, and platform admins.",
  },
  {
    title: "Progress analytics",
    description: "Track engagement, completion rates, and performance in real time.",
  },
] as const;

export const homeStats = [
  { label: "Active learners", value: "50K+", icon: "users" as const },
  { label: "Courses published", value: "1,200+", icon: "book" as const },
  { label: "Expert instructors", value: "350+", icon: "graduation" as const },
  { label: "Completion rate", value: "94%", icon: "chart" as const },
] as const;

export const homeTrustPartners = [
  { label: "Universities", icon: "building" as const },
  { label: "Corporates", icon: "briefcase" as const },
  { label: "Bootcamps", icon: "rocket" as const },
  { label: "Academies", icon: "school" as const },
] as const;

/** @deprecated use homeStats */
export const heroStats = homeStats;

/** @deprecated use homeTrustPartners */
export const heroTrustLabels = homeTrustPartners.map((p) => p.label);

export const heroCategories = ["Web Development", "Data Science", "UX Design", "Business", "Marketing"] as const;

export const heroPreview = {
  trackLabel: "My learning path",
  trackTitle: "Full-Stack Development",
  trackMeta: "4 courses · 36 lessons · 12 weeks",
  progress: 72,
  instructor: "Dr. Sarah Mitchell",
  nextLive: "Live Q&A in 25 min",
  learnersOnline: 312,
} as const;

export const heroPreviewLessons = [
  { title: "HTML, CSS & Responsive Layouts", progress: 100, status: "completed" as const, duration: "2h 40m" },
  { title: "JavaScript Fundamentals", progress: 72, status: "in-progress" as const, duration: "4h 15m" },
  { title: "React & Modern Front-End", progress: 0, status: "locked" as const, duration: "6h 30m" },
] as const;

export const heroSocialProof = {
  rating: 4.9,
  reviewCount: "2,400+",
  learnerAvatars: ["AK", "JM", "RS", "LP"],
} as const;
