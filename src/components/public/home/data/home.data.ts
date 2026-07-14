export const heroHeadline = {
  lead: "Bangladesh's Trusted",
  highlight: "Digital School",
} as const;

export const heroSubheadline =
  "Academic, Admission — study at the best online school in the country, with expert teachers, in your own way.";

export const heroPrimaryCta = "How Alt Tutor Works";
export const heroSecondaryCta = "Watch Video";

export const heroImage = {
  src: "/hero-student.png",
  alt: "Smiling student learning on her phone",
} as const;

export const homeStats = [
  { label: "Students", value: "50K+", color: "#ef3239" },
  { label: "Animated Videos", value: "1,200+", color: "#1877f2" },
  { label: "Quiz Banks", value: "350+", color: "#22c55e" },
  { label: "Live Courses", value: "30+", color: "#f97316" },
] as const;

export const academicProgram = {
  title: "What's included in the Alt Tutor Academic Program",
  subtitle:
    "Everything you need to stay ahead in class lessons and board exam preparation — all in one place.",
  features: [
    {
      id: "live-recorded",
      title: "Live & Recorded Classes",
      icon: "video" as const,
      iconColor: "#ef3239",
    },
    {
      id: "animated",
      title: "Animated Videos",
      icon: "play" as const,
      iconColor: "#1877f2",
    },
    {
      id: "practice-mcq",
      title: "Practice MCQ Tests",
      icon: "clipboard" as const,
      iconColor: "#a855f7",
    },
    {
      id: "live-mcq",
      title: "Live MCQ Tests",
      icon: "radio" as const,
      iconColor: "#22c55e",
    },
    {
      id: "class-notes",
      title: "Class Notes",
      icon: "book" as const,
      iconColor: "#f59e0b",
    },
    {
      id: "smart-notes",
      title: "Smart Notes",
      icon: "sparkles" as const,
      iconColor: "#06b6d4",
    },
    {
      id: "report-card",
      title: "Report Card",
      icon: "chart" as const,
      iconColor: "#ec4899",
    },
  ],
  preview: {
    teacherName: "Enamul Islam Rehan",
    teacherImage: "/teacher.png",
    joinedCount: "554 Joined",
    chatCount: 123,
    lectureCard: {
      label: "Lecture starting",
      title: "Biology 1st Paper — Chapter 1 Topics Covered",
      time: "8:30pm – 9:30pm | 60 min",
      cta: "Join Now",
    },
    sideCard: {
      title: "Lecture Class",
      date: "15-01-26 | 8:30pm",
      cta: "Start",
    },
  },
} as const;

export const animatedLessons = {
  title: "Learn faster with beautiful animated video lessons",
  subtitle:
    "Watch expert-crafted animated examples from top mentors and stay ahead in class and exams.",
  tabs: [
    { id: "all", label: "All Classes" },
    { id: "ssc", label: "SSC" },
    { id: "hsc", label: "HSC" },
  ],
  items: [
    {
      id: "1",
      category: "ssc",
      subject: "SSC Physics",
      title: "4.1 — Nature of Light",
      badge: "SSC",
      dot: "#a855f7",
      gradient: "from-[#7dd3fc] via-[#38bdf8] to-[#0284c7]",
    },
    {
      id: "2",
      category: "ssc",
      subject: "SSC Chemistry",
      title: "3.2 — Atomic Structure",
      badge: "SSC",
      dot: "#22c55e",
      gradient: "from-[#86efac] via-[#4ade80] to-[#16a34a]",
    },
    {
      id: "3",
      category: "hsc",
      subject: "HSC Biology",
      title: "2.1 — Cell Division",
      badge: "HSC",
      dot: "#1877f2",
      gradient: "from-[#93c5fd] via-[#60a5fa] to-[#2563eb]",
    },
    {
      id: "4",
      category: "ssc",
      subject: "SSC Math",
      title: "5.4 — Linear Equations",
      badge: "SSC",
      dot: "#f97316",
      gradient: "from-[#fdba74] via-[#fb923c] to-[#ea580c]",
    },
    {
      id: "5",
      category: "hsc",
      subject: "HSC Physics",
      title: "1.3 — Motion & Force",
      badge: "HSC",
      dot: "#ef3239",
      gradient: "from-[#fda4af] via-[#fb7185] to-[#e11d48]",
    },
    {
      id: "6",
      category: "hsc",
      subject: "HSC Chemistry",
      title: "4.2 — Chemical Bonding",
      badge: "HSC",
      dot: "#06b6d4",
      gradient: "from-[#67e8f9] via-[#22d3ee] to-[#0891b2]",
    },
    {
      id: "7",
      category: "ssc",
      subject: "SSC English",
      title: "6.1 — Grammar Basics",
      badge: "SSC",
      dot: "#8b5cf6",
      gradient: "from-[#c4b5fd] via-[#a78bfa] to-[#7c3aed]",
    },
    {
      id: "8",
      category: "hsc",
      subject: "HSC Math",
      title: "7.5 — Differentiation",
      badge: "HSC",
      dot: "#eab308",
      gradient: "from-[#fde047] via-[#facc15] to-[#ca8a04]",
    },
  ],
} as const;

export const aboutSection = {
  title: "Everyone learns with Alt Tutor. Everyone wins.",
  description:
    "No matter where you are in your journey, you can move forward with Alt Tutor — the trusted digital learning platform for students across Bangladesh. Watch our story and discover how thousands of learners are succeeding every day.",
  cta: "Learn About Us",
  media: {
    src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    alt: "Students learning together with Alt Tutor",
    headline: "I will learn. I will win.",
    subtext: "Master every subject for SSC & HSC — and ace every exam with Alt Tutor.",
  },
} as const;

/** @deprecated */
export const heroBadge = "Trusted by 500+ institutions worldwide";

/** @deprecated */
export const heroDescription = heroSubheadline;

/** @deprecated */
export const heroHighlights = [] as const;

/** @deprecated */
export const homeTrustPartners = [] as const;

/** @deprecated use homeStats */
export const heroStats = homeStats;

/** @deprecated */
export const heroTrustLabels: string[] = [];

/** @deprecated */
export const heroCategories = [] as const;

/** @deprecated */
export const heroPreview = {} as const;

/** @deprecated */
export const heroPreviewLessons = [] as const;

/** @deprecated */
export const heroSocialProof = {} as const;
