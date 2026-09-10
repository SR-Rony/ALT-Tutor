/** True when value has no visible text (handles empty TipTap HTML). */
export function isRichTextEmpty(value: string | null | undefined): boolean {
  if (!value?.trim()) return true;
  return !richTextToPlain(value);
}

/** Strip HTML tags for previews, validation, and card excerpts. */
export function richTextToPlain(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Keep consecutive / leading spaces as NBSP so layout survives HTML collapse. */
function preserveSpacesAsNbsp(text: string): string {
  return text
    .replace(/ {2,}/g, (chunk) => "\u00A0".repeat(chunk.length))
    .replace(/^ /gm, "\u00A0")
    .replace(/ $/gm, "\u00A0");
}

/** Convert legacy plain-text descriptions for TipTap. */
export function normalizeRichTextContent(value: string | null | undefined): string {
  if (!value?.trim()) return "";
  if (looksLikeHtml(value)) return value;
  const paragraphs = value.split(/\n{2,}/).map((block) => block.replace(/\s+$/, "")).filter(Boolean);
  if (!paragraphs.length) return "";
  return paragraphs
    .map((block) => {
      const html = preserveSpacesAsNbsp(escapeHtml(block)).replace(/\n/g, "<br>");
      return `<p>${html}</p>`;
    })
    .join("");
}

/** First sentence or truncated plain text for compact previews. */
export function richTextExcerpt(
  value: string | null | undefined,
  maxLength = 160,
): string {
  const plain = richTextToPlain(value);
  if (!plain) return "";
  const sentence = plain.match(/^[^.!?]+[.!?]?/)?.[0]?.trim() ?? plain;
  if (sentence.length <= maxLength) return sentence;
  return `${sentence.slice(0, maxLength).trim()}…`;
}

/** Normalize before API submit (empty editor → empty string). */
export function serializeRichText(value: string | null | undefined): string {
  if (isRichTextEmpty(value)) return "";
  const trimmed = value!.trim();
  return looksLikeHtml(trimmed) ? trimmed : normalizeRichTextContent(trimmed);
}
