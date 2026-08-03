export function formatMoney(value: number | string): string {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatNumber(value: number | string): string {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

export function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

/** Human-readable course access remaining from enrollment.expiresAt (null = lifetime). */
export function formatAccessRemaining(expiresAt?: string | null): {
  label: string;
  daysLeft: number | null;
  expired: boolean;
} {
  if (!expiresAt) {
    return { label: "Lifetime access", daysLeft: null, expired: false };
  }
  const end = new Date(expiresAt).getTime();
  const msLeft = end - Date.now();
  if (msLeft <= 0) {
    return { label: "Access expired", daysLeft: 0, expired: true };
  }
  const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
  return {
    label: `${daysLeft} day${daysLeft === 1 ? "" : "s"} left · until ${formatShortDate(expiresAt)}`,
    daysLeft,
    expired: false,
  };
}

export function formatRoleLabel(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
