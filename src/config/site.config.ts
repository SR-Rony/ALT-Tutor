export const siteConfig = {
  name: "Alt Tutor",
  tagline: "Learn. Teach. Grow.",
  description: "Alt Tutor — your learning platform for students, teachers, and institutions.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  /** Full wordmark used in navbar, dashboards, auth, footer, and print. */
  logo: "/logo.png",
  /** Square mark for collapsed sidebars and compact UI. */
  logoIcon: "/logo-icon.png",
  phone: "16780",
  company: "CodeZyne",
  links: {
    support: "/help",
  },
} as const;
