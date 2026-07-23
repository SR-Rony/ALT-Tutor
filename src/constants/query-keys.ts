export const queryKeys = {
  auth: {
    session: ["auth", "session"] as const,
  },
  home: {
    all: ["home"] as const,
    categories: ["home", "categories"] as const,
  },
  courses: {
    all: ["courses"] as const,
    catalog: (filters: object = {}) => ["courses", "catalog", filters] as const,
    detail: (slug: string, authed = false) => ["courses", "detail", slug, authed ? "authed" : "anon"] as const,
  },
  curriculum: {
    byCourse: (courseId: string) => ["curriculum", courseId] as const,
  },
  teacher: {
    dashboard: ["teacher", "dashboard"] as const,
    courses: ["teacher", "courses"] as const,
    subjects: ["teacher", "subjects"] as const,
  },
  subjects: {
    all: ["subjects"] as const,
    menu: ["subjects", "menu"] as const,
    adminTree: ["subjects", "admin-tree"] as const,
    mine: ["subjects", "mine"] as const,
  },
  questionbank: {
    all: ["questionbank"] as const,
    program: (slug: string, authKey = "anon") =>
      ["questionbank", "program", slug, authKey] as const,
    questions: (programSlug: string, subtopicSlug: string, filters: object, authKey = "anon") =>
      ["questionbank", "questions", programSlug, subtopicSlug, filters, authKey] as const,
    admin: (programId?: string) => ["questionbank", "admin", programId ?? "all"] as const,
    practiceSession: (sessionId: string) => ["questionbank", "practice", sessionId] as const,
  },
  practiceExams: {
    all: ["practice-exams"] as const,
    admin: (programId?: string) => ["practice-exams", "admin", programId ?? "all"] as const,
    program: (slug: string, authKey = "anon") =>
      ["practice-exams", "program", slug, authKey] as const,
    template: (programSlug: string, templateSlug: string, authKey = "anon") =>
      ["practice-exams", "template", programSlug, templateSlug, authKey] as const,
    history: (programSlug: string, authKey = "anon") =>
      ["practice-exams", "history", programSlug, authKey] as const,
  },
  assignments: {
    mine: ["assignments", "mine"] as const,
    byCourse: (courseId: string) => ["assignments", "course", courseId] as const,
    byProgram: (programId: string) => ["assignments", "program", programId] as const,
  },
  submissions: {
    mine: ["submissions", "mine"] as const,
    ungraded: ["submissions", "ungraded"] as const,
  },
  payments: {
    products: ["payments", "products"] as const,
  },
  mcq: {
    all: ["mcq"] as const,
    admin: (courseId?: string, programId?: string) =>
      ["mcq", "admin", courseId ?? "all", programId ?? ""] as const,
    results: (examId: string) => ["mcq", "results", examId] as const,
    status: (id: string) => ["mcq", "status", id] as const,
    mine: ["mcq", "mine"] as const,
  },
  admin: {
    dashboard: ["admin", "dashboard"] as const,
    users: ["admin", "users"] as const,
    user: (id: string) => ["admin", "users", id] as const,
    courses: ["admin", "courses"] as const,
    course: (id: string) => ["admin", "courses", id] as const,
    coursePrograms: (id: string) => ["admin", "courses", id, "programs"] as const,
    categories: ["admin", "categories"] as const,
    subjects: ["admin", "subjects"] as const,
    payments: ["admin", "payments"] as const,
    enrollments: (filters: object = {}) => ["admin", "enrollments", filters] as const,
    reviews: (filters: object = {}) => ["admin", "reviews", filters] as const,
    settings: ["admin", "settings"] as const,
    support: ["admin", "support"] as const,
  },
  student: {
    dashboard: ["student", "dashboard"] as const,
    courses: ["student", "courses"] as const,
    submissions: ["student", "submissions"] as const,
    notifications: ["student", "notifications"] as const,
    payments: ["student", "payments"] as const,
    profile: ["student", "profile"] as const,
    assignments: (courseId: string) => ["student", "assignments", courseId] as const,
    myAssignments: ["student", "my-assignments"] as const,
  },
} as const;
