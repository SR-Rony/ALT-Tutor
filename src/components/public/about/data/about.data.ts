import { homeStats } from "@/components/public/home/data/home.data";

/** Replace with your official brand story video when ready. */
export const aboutDemoVideo = {
  url: "https://www.youtube.com/watch?v=3fumBcKC6RE",
  title: "Alt Tutor — Platform Overview",
  caption:
    "Discover how Alt Tutor brings expert-led classes, animated lessons, and exam-ready practice to students across Bangladesh — anytime, anywhere.",
} as const;

export const aboutPageContent = {
  meta: {
    title: "About Alt Tutor",
    description:
      "Alt Tutor is Bangladesh's trusted digital learning platform for SSC, HSC, and admission prep — built for students who want to learn smarter and win bigger.",
  },
  hero: {
    eyebrow: "About Alt Tutor",
    titleLead: "Building Bangladesh's most trusted",
    titleHighlight: "digital school",
    description:
      "We believe every student deserves world-class learning — no matter their city, school, or schedule. Alt Tutor combines expert teachers, cinematic lessons, and smart practice tools so you can prepare with confidence.",
  },
  story: {
    title: "Watch our story",
    subtitle:
      "From a small idea to thousands of learners nationwide — see how Alt Tutor is changing the way Bangladesh studies.",
  },
  mission: {
    title: "Our mission",
    body: "To make high-quality SSC, HSC, and admission preparation accessible to every student in Bangladesh — through engaging video lessons, structured courses, and data-driven practice that actually improves results.",
  },
  vision: {
    title: "Our vision",
    body: "A future where no student is left behind because of geography or resources. We want Alt Tutor to be the first place every Bangladeshi learner opens when they say: “I will learn. I will win.”",
  },
  values: [
    {
      id: "excellence",
      title: "Excellence in teaching",
      description: "Every lesson is designed by subject experts who understand the Bangladesh curriculum and what examiners look for.",
      color: "#ef3239",
    },
    {
      id: "access",
      title: "Access for everyone",
      description: "Learn from anywhere — phone, tablet, or laptop. Free previews and flexible plans keep quality education within reach.",
      color: "#1877f2",
    },
    {
      id: "practice",
      title: "Practice that sticks",
      description: "Questionbanks, mock exams, and instant feedback turn study time into measurable progress — not just passive watching.",
      color: "#22c55e",
    },
    {
      id: "trust",
      title: "Trust & transparency",
      description: "Clear syllabi, honest pricing, and responsive support. We earn your trust one successful exam at a time.",
      color: "#f97316",
    },
  ],
  pillars: [
    {
      step: "01",
      title: "Learn with expert teachers",
      description: "Structured courses led by experienced educators who break down complex topics into clear, memorable lessons.",
    },
    {
      step: "02",
      title: "Watch animated explanations",
      description: "Visual, story-driven videos that make difficult concepts easy — perfect for revision on the go.",
    },
    {
      step: "03",
      title: "Practice with smart tools",
      description: "Topic-wise questionbanks, timed exams, and progress tracking keep you exam-ready every single day.",
    },
    {
      step: "04",
      title: "Win with confidence",
      description: "Walk into SSC, HSC, and admission tests knowing you have prepared the Alt Tutor way.",
    },
  ],
  stats: homeStats,
  cta: {
    title: "Ready to start your journey?",
    description: "Join thousands of students already learning smarter with Alt Tutor. Explore courses or reach out — we're here to help.",
    primary: "Browse Courses",
    secondary: "Contact Us",
  },
} as const;
