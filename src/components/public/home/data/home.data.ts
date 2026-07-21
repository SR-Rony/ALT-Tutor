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
  alt: "Confident learner ready for digital education",
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
    "Everything you need for SSC & HSC exam success — questionbanks, past papers, practice exams, and more in one place.",
  features: [
    {
      id: "questionbank",
      title: "Questionbank",
      icon: "clipboard" as const,
      iconColor: "#ef3239",
      description:
        "All the questions you could need! Sorted by topic and arranged by difficulty, with mark schemes and video solutions for every question.",
      previewCards: [
        { code: "A1.1", title: "Number Systems", progress: 72 },
        { code: "A2.1", title: "Functions & Graphs", progress: 45 },
        { code: "A3.1", title: "Geometry & Trig", progress: 58 },
        { code: "A4.1", title: "Statistics", progress: 33 },
      ],
    },
    {
      id: "past-papers",
      title: "Past Papers",
      icon: "file" as const,
      iconColor: "#1877f2",
      description:
        "Official-style past papers with worked solutions so you can practise under exam conditions and learn from every mistake.",
      previewCards: [
        { code: "P1", title: "May 2024 Paper 1", progress: 80 },
        { code: "P2", title: "May 2024 Paper 2", progress: 55 },
        { code: "P1", title: "Nov 2023 Paper 1", progress: 90 },
        { code: "P2", title: "Nov 2023 Paper 2", progress: 40 },
      ],
    },
    {
      id: "practice-exams",
      title: "Practice Exams",
      icon: "pen" as const,
      iconColor: "#a855f7",
      description:
        "Full-length practice exams designed to mirror real board papers — timed, scored, and ready when you are.",
      previewCards: [
        { code: "EX1", title: "SL Practice Set A", progress: 65 },
        { code: "EX2", title: "SL Practice Set B", progress: 28 },
        { code: "EX3", title: "HL Practice Set A", progress: 50 },
        { code: "EX4", title: "HL Practice Set B", progress: 15 },
      ],
    },
    {
      id: "key-concepts",
      title: "Key Concepts",
      icon: "lightbulb" as const,
      iconColor: "#22c55e",
      description:
        "Clear, concise concept notes that cut through the syllabus noise — perfect for quick revision before class or exams.",
      previewCards: [
        { code: "KC1", title: "Core Definitions", progress: 88 },
        { code: "KC2", title: "Formula Sheets", progress: 70 },
        { code: "KC3", title: "Worked Examples", progress: 52 },
        { code: "KC4", title: "Common Pitfalls", progress: 41 },
      ],
    },
    {
      id: "prediction-exams",
      title: "Prediction Exams",
      icon: "target" as const,
      iconColor: "#f59e0b",
      description:
        "Targeted prediction-style papers focused on high-yield topics so you can sharpen your final exam strategy.",
      previewCards: [
        { code: "PE1", title: "May Session Pack", progress: 60 },
        { code: "PE2", title: "Nov Session Pack", progress: 35 },
        { code: "PE3", title: "Topic Hotspots", progress: 75 },
        { code: "PE4", title: "Final Sprint Set", progress: 20 },
      ],
    },
    {
      id: "flashcards",
      title: "Flashcards",
      icon: "layers" as const,
      iconColor: "#06b6d4",
      description:
        "Spaced-repetition flashcards for formulas, definitions, and key facts — so retention sticks when it matters.",
      previewCards: [
        { code: "FC1", title: "Formula Deck", progress: 92 },
        { code: "FC2", title: "Definitions Deck", progress: 68 },
        { code: "FC3", title: "Theorem Deck", progress: 44 },
        { code: "FC4", title: "Exam Tips Deck", progress: 57 },
      ],
    },
    {
      id: "bootcamps",
      title: "Bootcamps",
      icon: "zap" as const,
      iconColor: "#ec4899",
      description:
        "Intensive bootcamp sessions and IA toolkit support to push your scores higher in a short, focused timeframe.",
      previewCards: [
        { code: "BC1", title: "Exam Crash Course", progress: 48 },
        { code: "BC2", title: "IA Toolkit", progress: 62 },
        { code: "BC3", title: "Paper 2 Sprint", progress: 30 },
        { code: "BC4", title: "HL Extension Week", progress: 22 },
      ],
    },
  ],
} as const;

export const practiceExamQuestions = {
  title: "Practice SSC & HSC Exam Style Questions",
  subtitle:
    "Thousands of exam-style questions, filtered by topic and difficulty, with detailed mark schemes and video solutions for every question.",
  tabs: [
    { id: "mathematics", label: "Mathematics" },
    { id: "sciences", label: "Science" },
    { id: "english", label: "English" },
    { id: "higher-math", label: "Higher Math" },
  ],
  questions: {
    mathematics: {
      calculator: true,
      difficulty: "Medium" as const,
      stars: 3,
      prompt:
        "A bouncy ball is dropped from a height of 2 metres onto a hard floor. After each bounce the ball reaches 75% of the height of the previous bounce.",
      figureLabel: null as string | null,
      figureNote: null as string | null,
      body: "Find the total distance travelled by the ball before it comes to rest.",
      marks: 4,
      options: [
        { key: "A", text: "8 metres" },
        { key: "B", text: "14 metres" },
        { key: "C", text: "16 metres" },
        { key: "D", text: "18 metres" },
      ],
      bookletLabel: "Formula Booklet",
      videoCount: 1,
    },
    sciences: {
      calculator: true,
      difficulty: "Medium" as const,
      stars: 3,
      prompt: "A car travels 100 km in 2 hours. What is its average speed?",
      figureLabel: null as string | null,
      figureNote: null as string | null,
      body: null as string | null,
      marks: 1,
      options: [
        { key: "A", text: "25 km/h" },
        { key: "B", text: "50 km/h" },
        { key: "C", text: "100 km/h" },
        { key: "D", text: "200 km/h" },
      ],
      bookletLabel: "Formula Sheet",
      videoCount: 1,
    },
    english: {
      calculator: false,
      difficulty: "Easy" as const,
      stars: 2,
      prompt: "Choose the correct passive form: “They built this school in 2010.”",
      figureLabel: null as string | null,
      figureNote: null as string | null,
      body: null as string | null,
      marks: 1,
      options: [
        { key: "A", text: "This school built in 2010." },
        { key: "B", text: "This school was built in 2010." },
        { key: "C", text: "This school is built in 2010." },
        { key: "D", text: "This school has built in 2010." },
      ],
      bookletLabel: "Grammar Notes",
      videoCount: 1,
    },
    "higher-math": {
      calculator: true,
      difficulty: "Hard" as const,
      stars: 4,
      prompt: "If f(x) = 2x + 3, what is f(4)?",
      figureLabel: null as string | null,
      figureNote: null as string | null,
      body: null as string | null,
      marks: 1,
      options: [
        { key: "A", text: "8" },
        { key: "B", text: "10" },
        { key: "C", text: "11" },
        { key: "D", text: "14" },
      ],
      bookletLabel: "Formula Booklet",
      videoCount: 1,
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

export const helpSection = {
  call: {
    title: "Need help? Call us anytime",
    description: "Our support team is ready to guide you with classes, courses, and account questions.",
    hours: "9:00 AM – 10:00 PM",
    note: "*Standard call rates apply from any number",
    image: "/help-student.png",
    imageAlt: "Student getting help on her phone",
  },
  videos: {
    title: "Free Video Library",
    cta: "Watch Videos",
    href: "/courses",
  },
  facebook: {
    title: "Alt Tutor Facebook Group",
    cta: "Join the Group",
    href: "https://facebook.com",
  },
} as const;

export const photoGallery = {
  titleLead: "Take a look at our",
  titleHighlight: "Photo Gallery",
  images: [
    {
      id: "1",
      src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80",
      alt: "Students studying together",
    },
    {
      id: "2",
      src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80",
      alt: "Collaborative learning session",
    },
    {
      id: "3",
      src: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=600&q=80",
      alt: "Student with headphones learning online",
    },
    {
      id: "4",
      src: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=600&q=80",
      alt: "Classroom group discussion",
    },
    {
      id: "5",
      src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80",
      alt: "Teacher guiding students",
    },
    {
      id: "6",
      src: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80",
      alt: "Students in lecture hall",
    },
    {
      id: "7",
      src: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=600&q=80",
      alt: "Young learner reading outdoors",
    },
    {
      id: "8",
      src: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=600&q=80",
      alt: "Campus study moment",
    },
    {
      id: "9",
      src: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80",
      alt: "Stack of educational books",
    },
    {
      id: "10",
      src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
      alt: "Student planning study goals",
    },
    {
      id: "11",
      src: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
      alt: "Focused desk study session",
    },
    {
      id: "12",
      src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80",
      alt: "Online class on laptop",
    },
  ],
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
