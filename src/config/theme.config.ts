/**
 * Alt Tutor brand design tokens — mirrors `globals.css`.
 */
export const themeConfig = {
  font: {
    sans: "Plus Jakarta Sans",
  },
  backgrounds: {
    page: "#f8faff",
    canvas: "#eef2f9",
    muted: "#f0f4fb",
    card: "#ffffff",
    elevated: "#ffffff",
  },
  colors: {
    primary: "#1877f2",
    primaryHover: "#1466db",
    primaryMuted: "#e8f2fe",
    accent: "#ef3239",
    accentPurple: "#5e37ea",
    accentGreen: "#389452",
    foreground: "#1a1a2e",
    mutedForeground: "#58688b",
    border: "#dce4f0",
  },
  gradients: {
    brand: "linear-gradient(135deg, #3b8dee 0%, #ff6b35 45%, #ef3239 100%)",
    hero: "linear-gradient(180deg, #f0f6ff 0%, #f8faff 40%, #ffffff 100%)",
  },
} as const;
