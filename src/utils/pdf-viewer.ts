/** Cloudinary raw PDFs default to attachment; force inline display in browser embeds. */
export function getInlinePdfUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("cloudinary.com") && parsed.pathname.includes("/upload/")) {
      if (!parsed.pathname.includes("fl_attachment:false")) {
        parsed.pathname = parsed.pathname.replace("/upload/", "/upload/fl_attachment:false/");
      }
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|#|$)/i.test(url);
}

export function resolveLessonPdfUrl(lesson: {
  type: string;
  contentUrl?: string | null;
  attachments?: { url: string; mimeType?: string | null }[];
}): string | null {
  const type = String(lesson.type).toUpperCase();
  if (lesson.contentUrl && (type === "PDF" || isPdfUrl(lesson.contentUrl))) {
    return lesson.contentUrl;
  }

  const attachment = lesson.attachments?.find(
    (item) => item.mimeType === "application/pdf" || isPdfUrl(item.url)
  );
  return attachment?.url ?? null;
}

/** Sidebar / hero preview — video or streamable URL, not PDF or text-only lessons. */
export function isPlayableVideoLesson(lesson: {
  type: string;
  contentUrl?: string | null;
  body?: string | null;
  attachments?: { url: string; mimeType?: string | null }[];
}): boolean {
  if (resolveLessonPdfUrl(lesson)) return false;
  const type = String(lesson.type).toUpperCase();
  if (type === "TEXT" && lesson.body && !lesson.contentUrl) return false;
  return Boolean(lesson.contentUrl?.trim());
}
