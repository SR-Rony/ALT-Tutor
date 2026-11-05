/**
 * Helpers for managing Questionbank question notes, which can contain
 * rich text content, an attached PDF document (via upload or URL), or both.
 */

export type ParsedNotes = {
  text: string;
  pdfUrl: string | null;
};

/**
 * Extracts any attached PDF URL and remaining text content from a question.notes string.
 */
export function extractNotesParts(rawNotes: string | null | undefined): ParsedNotes {
  if (!rawNotes || !rawNotes.trim()) {
    return { text: "", pdfUrl: null };
  }

  const trimmed = rawNotes.trim();

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

  // 1. Explicit data attribute: data-notes-pdf="..." or data-pdf-url="..."
  const dataMatch = trimmed.match(/data-(?:notes-)?pdf(?:-url)?=["']([^"']+)["']/i);
  if (dataMatch?.[1]) {
    const pdfUrl = dataMatch[1].trim();
    const cleanedText = trimmed
      .replace(/<div[^>]*data-(?:notes-)?pdf(?:-url)?=["'][^"']+["'][^>]*>[\s\S]*?<\/div>/gi, "")
      .replace(/<p[^>]*><a[^>]*data-(?:notes-)?pdf(?:-url)?=["'][^"']+["'][^>]*>[\s\S]*?<\/a><\/p>/gi, "")
      .replace(/<a[^>]*data-(?:notes-)?pdf(?:-url)?=["'][^"']+["'][^>]*>[\s\S]*?<\/a>/gi, "")
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

  return { text: rawNotes, pdfUrl: null };
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
