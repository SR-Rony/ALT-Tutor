/** Safe internal redirect target from a ?next= query param (blocks external/open redirects). */
export function getSafeNextParam(search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const next = params.get("next");
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}
