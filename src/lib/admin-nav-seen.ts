"use client";

type Role = "admin" | "teacher" | "student";

function storageKey(role: Role) {
  return `alt-tutor-${role}-nav-seen`;
}

type SeenMap = Record<string, string>;

function readSeen(role: Role): SeenMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(role));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SeenMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getNavSeenSnapshot(role: Role): SeenMap {
  return readSeen(role);
}

export function getNavSeen(role: Role, key: string): string | undefined {
  return readSeen(role)[key];
}

export function markNavSeen(role: Role, key: string) {
  if (typeof window === "undefined") return;
  const next: SeenMap = { ...readSeen(role), [key]: new Date().toISOString() };
  window.localStorage.setItem(storageKey(role), JSON.stringify(next));
}

/** @deprecated use markNavSeen("admin", key) */
export type AdminNavSeenKey = "users" | "enrollments";

export function getAdminNavSeen(key: AdminNavSeenKey) {
  return getNavSeen("admin", key);
}

export function markAdminNavSeen(key: AdminNavSeenKey) {
  markNavSeen("admin", key);
}

export function getAdminNavSeenSnapshot() {
  return getNavSeenSnapshot("admin");
}
