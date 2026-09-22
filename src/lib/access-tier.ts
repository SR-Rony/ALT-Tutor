/** Questionbank / Practice Pass access tiers (Free vs Gold only). */
export type QbAccessBadge = "FREE" | "SILVER" | "GOLD" | "DIAMOND";

/** Admin toggle cycles Free ↔ Gold only. */
export const ACCESS_TIER_ORDER: QbAccessBadge[] = ["FREE", "GOLD"];

export const ACCESS_TIER_RANK: Record<QbAccessBadge, number> = {
  FREE: 0,
  SILVER: 1,
  GOLD: 1,
  DIAMOND: 1,
};

/** Collapse legacy Silver/Diamond onto Gold for UI + gating. */
export function normalizeAccessBadge(value?: string | null): QbAccessBadge {
  const key = String(value ?? "FREE").toUpperCase();
  if (key === "FREE") return "FREE";
  return "GOLD";
}

export function accessTierRank(tier?: string | null): number {
  return ACCESS_TIER_RANK[normalizeAccessBadge(tier)];
}

export function canAccessWithTier(userTier?: string | null, required?: string | null): boolean {
  return accessTierRank(userTier) >= accessTierRank(required);
}

export function tierLabel(tier?: string | null): string {
  return normalizeAccessBadge(tier) === "GOLD" ? "ALT Gold" : "ALT Free";
}

export function tierBadgeClass(tier?: string | null): string {
  return normalizeAccessBadge(tier) === "GOLD" ? "bg-[#d4a017]" : "bg-primary";
}

/** Cycle Free → Gold → Free for admin quick toggle. */
export function nextAccessBadge(current?: string | null): QbAccessBadge {
  return normalizeAccessBadge(current) === "GOLD" ? "FREE" : "GOLD";
}

export function paidProductTier(): Exclude<QbAccessBadge, "FREE" | "SILVER" | "DIAMOND">[] {
  return ["GOLD"];
}
