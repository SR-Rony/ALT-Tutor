"use client";

const STORAGE_KEY = "alt-tutor-admin-nav-seen";

export type AdminNavSeenKey = "users" | "enrollments";

type SeenMap = Partial<Record<AdminNavSeenKey, string>>;

function readSeen(): SeenMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SeenMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getAdminNavSeen(key: AdminNavSeenKey): string | undefined {
  return readSeen()[key];
}

export function markAdminNavSeen(key: AdminNavSeenKey) {
  if (typeof window === "undefined") return;
  const next: SeenMap = { ...readSeen(), [key]: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getAdminNavSeenSnapshot(): SeenMap {
  return readSeen();
}
