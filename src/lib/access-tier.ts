/** Questionbank / Practice Pass access tiers. */
export type QbAccessBadge = "FREE" | "SILVER" | "GOLD" | "DIAMOND";

export const ACCESS_TIER_ORDER: QbAccessBadge[] = ["FREE", "SILVER", "GOLD", "DIAMOND"];

export const ACCESS_TIER_RANK: Record<QbAccessBadge, number> = {
  FREE: 0,
  SILVER: 1,
  GOLD: 2,
  DIAMOND: 3,
};

export function normalizeAccessBadge(value?: string | null): QbAccessBadge {
  const key = String(value ?? "FREE").toUpperCase();
  if (key === "SILVER" || key === "GOLD" || key === "DIAMOND") return key;
  return "FREE";
}

export function accessTierRank(tier?: string | null): number {
  return ACCESS_TIER_RANK[normalizeAccessBadge(tier)];
}

export function canAccessWithTier(userTier?: string | null, required?: string | null): boolean {
  return accessTierRank(userTier) >= accessTierRank(required);
}

export function tierLabel(tier?: string | null): string {
  const key = normalizeAccessBadge(tier);
  if (key === "SILVER") return "ALT Silver";
  if (key === "GOLD") return "ALT Gold";
  if (key === "DIAMOND") return "ALT Diamond";
  return "ALT Free";
}

export function tierBadgeClass(tier?: string | null): string {
  const key = normalizeAccessBadge(tier);
  if (key === "SILVER") return "bg-[#94a3b8]";
  if (key === "GOLD") return "bg-[#d4a017]";
  if (key === "DIAMOND") return "bg-[#6366f1]";
  return "bg-primary";
}

/** Cycle Free → Silver → Gold → Diamond → Free for admin quick toggle. */
export function nextAccessBadge(current?: string | null): QbAccessBadge {
  const key = normalizeAccessBadge(current);
  const idx = ACCESS_TIER_ORDER.indexOf(key);
  return ACCESS_TIER_ORDER[(idx + 1) % ACCESS_TIER_ORDER.length]!;
}

export function paidProductTier(): Exclude<QbAccessBadge, "FREE">[] {
  return ["SILVER", "GOLD", "DIAMOND"];
}
