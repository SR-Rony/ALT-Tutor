/** Leading integer at start of a title, e.g. "10 D.C. circuits" → 10. */
export function leadingSerialNumber(title: string | null | undefined): number | null {
  const match = String(title ?? "")
    .trim()
    .match(/^(\d+)\b/);
  if (!match) return null;
  const n = Number.parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Natural / numeric-aware title compare so lists go 1, 2, 3 … 9, 10, 11
 * instead of lexicographic 1, 10, 11, 2.
 */
export function compareNaturalTitle(a: string, b: string): number {
  const na = leadingSerialNumber(a);
  const nb = leadingSerialNumber(b);
  if (na != null && nb != null && na !== nb) return na - nb;
  if (na != null && nb == null) return -1;
  if (na == null && nb != null) return 1;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/** Sort by explicit order first (when set), then natural title. */
export function compareByOrderThenNaturalTitle<T extends { order?: number | null; title: string }>(
  a: T,
  b: T
): number {
  const oa = a.order ?? 0;
  const ob = b.order ?? 0;
  if (oa !== ob) return oa - ob;
  return compareNaturalTitle(a.title, b.title);
}
