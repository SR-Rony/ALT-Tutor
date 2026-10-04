import type { StudentNotification } from "@/types/student-dashboard.types";

/** Internal path for a notification, or null. External or protocol-relative URLs are ignored. */
export function notificationHref(note: Pick<StudentNotification, "href">): string | null {
  const href = note.href?.trim();
  if (!href || !href.startsWith("/") || href.startsWith("//")) return null;
  return href;
}

export function notificationActionLabel(note: Pick<StudentNotification, "type" | "href">) {
  const href = note.href ?? "";
  if (note.type === "GRADE_RELEASED") {
    return /\/(practice-exams|past-papers)\//.test(href) ? "View result" : "View grade";
  }
  if (note.type === "EXAM_OPEN" || note.type === "DUE_SOON") return "Open exam";
  return "Open";
}
