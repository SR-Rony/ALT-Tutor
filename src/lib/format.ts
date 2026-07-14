export function formatMoney(value: number | string): string {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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

export function formatRoleLabel(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
