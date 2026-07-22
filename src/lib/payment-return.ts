const STORAGE_KEY = "alt_tutor_payment_return_to";

/** Persist where the student should return after Practice Pass / course checkout. */
export function setPaymentReturnTo(path: string) {
  if (typeof window === "undefined") return;
  try {
    const safe = path.startsWith("/") ? path : `/${path}`;
    sessionStorage.setItem(STORAGE_KEY, safe);
  } catch {
    // Ignore private-mode / storage failures.
  }
}

export function peekPaymentReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (!value || !value.startsWith("/")) return null;
    return value;
  } catch {
    return null;
  }
}

export function consumePaymentReturnTo(): string | null {
  const value = peekPaymentReturnTo();
  if (typeof window === "undefined") return value;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return value;
}
