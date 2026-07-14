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
    detail: (slug: string) => ["courses", "detail", slug] as const,
  },
  admin: {
    example: ["admin", "example"] as const,
    dashboard: ["admin", "dashboard"] as const,
    users: ["admin", "users"] as const,
    courses: ["admin", "courses"] as const,
    payments: ["admin", "payments"] as const,
  },
  teacher: {
    dashboard: ["teacher", "dashboard"] as const,
  },
  student: {
    dashboard: ["student", "dashboard"] as const,
    courses: ["student", "courses"] as const,
    submissions: ["student", "submissions"] as const,
    notifications: ["student", "notifications"] as const,
    payments: ["student", "payments"] as const,
    profile: ["student", "profile"] as const,
    assignments: (courseId: string) => ["student", "assignments", courseId] as const,
  },
} as const;
