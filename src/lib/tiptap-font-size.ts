import { FontSize as TipTapFontSize, TextStyle } from "@tiptap/extension-text-style";

export const FONT_SIZE_OPTIONS = [
  { label: "Small", value: "14px" },
  { label: "Normal", value: "16px" },
  { label: "Large", value: "18px" },
  { label: "XL", value: "20px" },
] as const;

export type FontSizeValue = (typeof FONT_SIZE_OPTIONS)[number]["value"];

export function normalizeFontSize(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase();
  const match = cleaned.match(/^(\d+(?:\.\d+)?)(px|pt|rem|em)?$/);
  if (!match) return null;
  const n = Number.parseFloat(match[1]!);
  if (!Number.isFinite(n) || n < 10 || n > 32) return null;
  const unit = match[2] || "px";
  if (unit === "px") return `${Math.round(n)}px`;
  if (unit === "pt") return `${Math.round(n * 1.333)}px`;
  if (unit === "rem" || unit === "em") return `${Math.round(n * 16)}px`;
  return null;
}

export { TextStyle };

/** TipTap official font-size extension (requires TextStyle). */
export const FontSize = TipTapFontSize;
