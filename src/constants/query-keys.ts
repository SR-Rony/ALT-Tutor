export const queryKeys = {
  auth: {
    session: ["auth", "session"] as const,
  },
  courses: {
    all: ["courses"] as const,
    detail: (slug: string) => ["courses", slug] as const,
  },
  admin: {
    example: ["admin", "example"] as const,
    dashboard: ["admin", "dashboard"] as const,
    users: ["admin", "users"] as const,
    courses: ["admin", "courses"] as const,
    payments: ["admin", "payments"] as const,
  },
} as const;
