import type { ManualPaymentMethod, QbSubtopic, StudySetAccessSource } from "@/types/qb.types";

/** Price of a study set as a number, or null when it isn't sold individually. */
export function studySetPrice(sub: Pick<QbSubtopic, "price">): number | null {
  const price = Number(sub.price ?? 0);
  return Number.isFinite(price) && price > 0 ? price : null;
}

/** Struck-through "was" price, only when it is above the selling price. */
export function studySetRegularPrice(
  sub: Pick<QbSubtopic, "price" | "regularPrice">
): number | null {
  const price = studySetPrice(sub);
  const regular = Number(sub.regularPrice ?? 0);
  if (!price || !Number.isFinite(regular) || regular <= price) return null;
  return regular;
}

export const MANUAL_PAYMENT_METHODS: { value: ManualPaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "ROCKET", label: "Rocket" },
  { value: "BANK", label: "Bank transfer" },
  { value: "CARD", label: "Card" },
  { value: "OTHER", label: "Other" },
];

export function manualPaymentMethodLabel(method?: string | null) {
  return MANUAL_PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method ?? "Manual";
}

export function studySetAccessSourceLabel(source: StudySetAccessSource | string) {
  if (source === "PURCHASE") return "Online payment";
  if (source === "MANUAL_PAYMENT") return "Manual payment";
  return "Free grant";
}
