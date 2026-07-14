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
  },
} as const;
