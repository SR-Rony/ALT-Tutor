export const siteConfig = {
  name: "Alt Tutor",
  tagline: "Learn. Teach. Grow.",
  description: "Alt Tutor — your learning platform for students, teachers, and institutions.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  links: {
    support: "/help",
  },
} as const;
