/**
 * Helpers for managing Questionbank question notes and mark schemes,
 * which can contain rich text content, an attached PDF document (via upload or URL), or both.
 */

export type ParsedNotes = {
  text: string;
  pdfUrl: string | null;
};

export type ParsedMarkScheme = ParsedNotes;

/**
 * Extracts any attached PDF URL and remaining text content from a raw HTML/text string
 * (works for both question.notes and question.markScheme).
 */
export function extractContentAndPdfParts(
  rawContent: string | null | undefined,
  pdfAttrNames: string[] = ["data-notes-pdf", "data-mark-scheme-pdf", "data-pdf-url"]
): ParsedNotes {
  if (!rawContent || !rawContent.trim()) {
    return { text: "", pdfUrl: null };
  }

  const trimmed = rawContent.trim();

  // 0. JSON format check (if stored as JSON string)
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && (typeof parsed.text === "string" || typeof parsed.pdfUrl === "string")) {
        return {
          text: typeof parsed.text === "string" ? parsed.text : "",
          pdfUrl: typeof parsed.pdfUrl === "string" && parsed.pdfUrl ? parsed.pdfUrl : null,
        };
      }
    } catch {
      // not valid JSON, proceed with HTML/regex parsing
    }
  }

  // 1. Explicit data attributes: data-notes-pdf, data-mark-scheme-pdf, data-pdf-url
  const attrPattern = pdfAttrNames.join("|");
  const dataMatch = trimmed.match(new RegExp(`(?:${attrPattern})=["']([^"']+)["']`, "i"));
  if (dataMatch?.[1]) {
    const pdfUrl = dataMatch[1].trim();
    const cleanedText = trimmed
      .replace(new RegExp(`<div[^>]*?(?:${attrPattern})=["'][^"']+["'][^>]*?>[\\s\\S]*?<\\/div>`, "gi"), "")
      .replace(new RegExp(`<p[^>]*?><a[^>]*?(?:${attrPattern})=["'][^"']+["'][^>]*?>[\\s\\S]*?<\\/a><\\/p>`, "gi"), "")
      .replace(new RegExp(`<a[^>]*?(?:${attrPattern})=["'][^"']+["'][^>]*?>[\\s\\S]*?<\\/a>`, "gi"), "")
      .replace(/^<p>\s*(?:<br\s*\/?>)?\s*<\/p>/i, "")
      .trim();
    return { text: cleanedText, pdfUrl };
  }

  // 2. Bare PDF URL (absolute or relative)
  if (/^(?:https?:\/\/|\/)[^\s<>"']+\.pdf(?:\?[^\s<>"']*)?$/i.test(trimmed)) {
    return { text: "", pdfUrl: trimmed };
  }

  // 3. Anchor tag pointing to a PDF file
  const linkMatch = trimmed.match(/<a[^>]+href=["']([^"']+\.pdf(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/i);
  if (linkMatch?.[1]) {
    const pdfUrl = linkMatch[1].trim();
    const cleanedText = trimmed
      .replace(/<p[^>]*><a[^>]+href=["'][^"']+\.pdf(?:\?[^"']*)?["'][^>]*>[\s\S]*?<\/a><\/p>/gi, "")
      .replace(/<div[^>]*><a[^>]+href=["'][^"']+\.pdf(?:\?[^"']*)?["'][^>]*>[\s\S]*?<\/a><\/div>/gi, "")
      .replace(/^<p>\s*(?:<br\s*\/?>)?\s*<\/p>/i, "")
      .trim();
    return { text: cleanedText, pdfUrl };
  }

  return { text: rawContent, pdfUrl: null };
}

/**
 * Extracts attached PDF URL and remaining text content from question.notes.
 */
export function extractNotesParts(rawNotes: string | null | undefined): ParsedNotes {
  return extractContentAndPdfParts(rawNotes, ["data-notes-pdf", "data-pdf-url"]);
}

/**
 * Extracts attached PDF URL and remaining text content from question.markScheme.
 */
export function extractMarkSchemeParts(rawMarkScheme: string | null | undefined): ParsedMarkScheme {
  return extractContentAndPdfParts(rawMarkScheme, ["data-mark-scheme-pdf", "data-notes-pdf", "data-pdf-url"]);
}

/**
 * Combines rich text and an optional PDF URL into a unified question.notes string.
 */
export function combineNotesParts(text: string | null | undefined, pdfUrl: string | null | undefined): string | null {
  const cleanPdf = pdfUrl?.trim() || null;
  const cleanText = text?.trim() || "";

  if (!cleanPdf && !cleanText) {
    return null;
  }

  if (cleanPdf && !cleanText) {
    return `<div data-notes-pdf="${cleanPdf}" class="notes-pdf-attachment"><p><a href="${cleanPdf}" target="_blank" rel="noopener noreferrer" data-notes-pdf="${cleanPdf}">📄 Attached Notes (PDF)</a></p></div>`;
  }

  if (cleanPdf && cleanText) {
    return `<div data-notes-pdf="${cleanPdf}" class="notes-pdf-attachment"><p><a href="${cleanPdf}" target="_blank" rel="noopener noreferrer" data-notes-pdf="${cleanPdf}">📄 Attached Notes (PDF)</a></p></div>${cleanText}`;
  }

  return cleanText || null;
}

/**
 * Combines rich text and an optional PDF URL into a unified question.markScheme string.
 */
export function combineMarkSchemeParts(text: string | null | undefined, pdfUrl: string | null | undefined): string | null {
  const cleanPdf = pdfUrl?.trim() || null;
  const cleanText = text?.trim() || "";

  if (!cleanPdf && !cleanText) {
    return null;
  }

  if (cleanPdf && !cleanText) {
    return `<div data-mark-scheme-pdf="${cleanPdf}" class="mark-scheme-pdf-attachment"><p><a href="${cleanPdf}" target="_blank" rel="noopener noreferrer" data-mark-scheme-pdf="${cleanPdf}">📄 Attached Mark Scheme (PDF)</a></p></div>`;
  }

  if (cleanPdf && cleanText) {
    return `<div data-mark-scheme-pdf="${cleanPdf}" class="mark-scheme-pdf-attachment"><p><a href="${cleanPdf}" target="_blank" rel="noopener noreferrer" data-mark-scheme-pdf="${cleanPdf}">📄 Attached Mark Scheme (PDF)</a></p></div>${cleanText}`;
  }

  return cleanText || null;
}
