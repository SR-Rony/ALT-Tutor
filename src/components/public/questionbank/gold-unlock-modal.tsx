"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Check,
  ClipboardList,
  FileText,
  Loader2,
  Lock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES, queryKeys } from "@/constants";
import { useAccessProducts, useCheckout } from "@/hooks";
import {
  accessTierRank,
  canAccessWithTier,
  normalizeAccessBadge,
  tierBadgeClass,
  tierLabel,
  type QbAccessBadge,
} from "@/lib/access-tier";
import { formatMoney } from "@/lib/format";
import { setPaymentReturnTo } from "@/lib/payment-return";
import { richTextToPlain } from "@/lib/rich-text";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import type { AccessProduct } from "@/types/student-dashboard.types";
import { cn } from "@/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  programId: string;
  programName: string;
  programSlug: string;
  subtopicTitle?: string | null;
  /** Minimum product tier that unlocks this study set. */
  requiredTier?: string;
  /** Called after access is granted immediately (free / already entitled). */
  onUnlocked?: () => void;
  /** Where to return after checkout (defaults to questionbank). */
  returnPath?: string;
};

type Step = "pitch" | "plans";

function sortProductsForProgram(
  products: AccessProduct[],
  programId: string,
  requiredTier: string
) {
  const eligible = products.filter((p) => canAccessWithTier(p.tier, requiredTier));
  const matching = eligible.filter((p) => p.programId === programId);
  const global = eligible.filter((p) => !p.programId);
  const other = eligible.filter((p) => p.programId && p.programId !== programId);
  const byTier = (a: AccessProduct, b: AccessProduct) =>
    accessTierRank(a.tier) - accessTierRank(b.tier);

  return [...matching.sort(byTier), ...global.sort(byTier), ...other.sort(byTier)];
}

function unlockedTier(tier: QbAccessBadge): string[] {
  if (tier === "DIAMOND") return ["Free", "Silver", "Gold", "Diamond"];
  if (tier === "GOLD") return ["Free", "Silver", "Gold"];
  if (tier === "SILVER") return ["Free", "Silver"];
  return ["Free"];
}

function tierTheme(tier: QbAccessBadge) {
  if (tier === "SILVER") {
    return {
      hero: "from-[#eef2f7] via-[#f8fafc] to-white",
      accent: "text-[#475569]",
      accentSoft: "bg-[#e2e8f0]/70 text-[#334155]",
      iconWrap: "bg-[#e2e8f0] text-[#475569]",
      cta: "!bg-none bg-[#64748b] text-white shadow-none hover:!bg-[#475569] hover:translate-y-0 hover:shadow-none",
      ring: "ring-[#94a3b8]/40",
      selected: "border-[#64748b] bg-[#f8fafc]",
    };
  }
  if (tier === "DIAMOND") {
    return {
      hero: "from-[#eff6ff] via-[#f8fbff] to-white",
      accent: "text-[#1d4ed8]",
      accentSoft: "bg-[#dbeafe]/70 text-[#1e40af]",
      iconWrap: "bg-[#dbeafe] text-[#1d4ed8]",
      cta: "!bg-none bg-[#1d4ed8] text-white shadow-none hover:!bg-[#1e40af] hover:translate-y-0 hover:shadow-none",
      ring: "ring-[#3b82f6]/35",
      selected: "border-[#3b82f6] bg-[#eff6ff]",
    };
  }
  return {
    hero: "from-[#fff7ed] via-[#fffbeb] to-white",
    accent: "text-[#b45309]",
    accentSoft: "bg-[#fde68a]/50 text-[#92400e]",
    iconWrap: "bg-[#fef3c7] text-[#b45309]",
    cta: "!bg-none bg-[#d4a017] text-white shadow-none hover:!bg-[#b45309] hover:translate-y-0 hover:shadow-none",
    ring: "ring-[#d4a017]/40",
    selected: "border-[#d4a017] bg-[#fffbeb]",
  };
}

export function GoldUnlockModal({
  open,
  onClose,
  programId,
  programName,
  programSlug,
  subtopicTitle,
  requiredTier = "GOLD",
  onUnlocked,
  returnPath: returnPathProp,
}: Props) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useAccessProducts();
  const checkout = useCheckout();
  const [step, setStep] = useState<Step>("pitch");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const required = normalizeAccessBadge(requiredTier);
  const requiredName = tierLabel(required);
  const theme = tierTheme(required);
  const unlockLabels = unlockedTier(required);

  const returnPath = useMemo(() => {
    if (returnPathProp) return returnPathProp;
    return `${ROUTES.subjectQuestionbank(programSlug)}?unlocked=1`;
  }, [programSlug, returnPathProp]);

  const loginHref = `${ROUTES.auth.login}?next=${encodeURIComponent(returnPath)}`;

  const ranked = useMemo(
    () => sortProductsForProgram(products, programId, required).slice(0, 3),
    [products, programId, required]
  );

  const selected = ranked.find((p) => p.id === selectedId) ?? ranked[0] ?? null;
  const fromPrice = ranked.length
    ? Math.min(...ranked.map((p) => Number(p.price) || 0))
    : null;

  useEffect(() => {
    if (!open) return;
    setStep("pitch");
    setError(null);
    setBusyId(null);
  }, [open, required, programId]);

  useEffect(() => {
    if (!open || ranked.length === 0) return;
    setSelectedId((prev) =>
      prev && ranked.some((p) => p.id === prev) ? prev : ranked[0]!.id
    );
  }, [open, ranked]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const buy = async (product: AccessProduct) => {
    if (!isAuthenticated) {
      window.location.href = loginHref;
      return;
    }

    setError(null);
    setBusyId(product.id);
    setPaymentReturnTo(returnPath);

    try {
      const result = await checkout.mutateAsync({ accessProductId: product.id });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      if (result.granted) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.questionbank.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.practiceExams.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.keyConcepts.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.pastPapers.all });
        onUnlocked?.();
        onClose();
        return;
      }
      setError("Checkout started, but no payment URL was returned. Please try again.");
    } catch (err) {
      setError((err as ApiError)?.message || "Checkout failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (!open) return null;

  const benefits = [
    {
      icon: BookOpen,
      text: `Questionbank study sets up to ${requiredName.replace(/^ALT\s+/, "")} (${unlockLabels.join(" + ")})`,
    },
    {
      icon: ClipboardList,
      text: "Practice exams for this subject at the same access level",
    },
    {
      icon: FileText,
      text: "Past papers and review tools after you submit",
    },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[#0f172a]/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-modal-title"
        className={cn(
          "relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:max-h-[88vh] sm:max-w-md sm:rounded-2xl",
          "ring-1",
          theme.ring
        )}
      >
        <div className={cn("relative border-b border-border bg-gradient-to-b px-5 pb-5 pt-4", theme.hero)}>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground transition hover:bg-white/70 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="pr-8">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
                tierBadgeClass(required)
              )}
            >
              <Lock className="h-3 w-3" aria-hidden />
              {requiredName}
            </span>
            <h2
              id="unlock-modal-title"
              className="mt-3 text-xl font-bold leading-snug text-foreground sm:text-[1.35rem]"
            >
              Take your practice to the{" "}
              <span className={theme.accent}>next level</span>
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {subtopicTitle
                ? `“${subtopicTitle}” is ${requiredName}. Upgrade to unlock it in ${programName}.`
                : `This content needs ${requiredName}. Upgrade to unlock it in ${programName}.`}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "pitch" ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Upgrade to {requiredName} and unlock:
                </p>
                <ul className="mt-3 space-y-3">
                  {benefits.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          theme.iconWrap
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="text-sm leading-relaxed text-foreground/90">{text}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  After payment you return here automatically.
                </p>
              </div>

              {!isAuthenticated ? (
                <div className="rounded-xl border border-border bg-muted/40 px-3 py-3">
                  <p className="text-sm font-semibold text-foreground">Sign in to continue</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You’ll come back to finish unlocking this topic.
                  </p>
                  <Button asChild className="mt-3 w-full" size="sm">
                    <Link href={loginHref}>Sign in</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">Choose a Practice Pass</p>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary hover:underline"
                  onClick={() => setStep("pitch")}
                >
                  Back
                </button>
              </div>

              {error ? (
                <p role="alert" className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
                  {error}
                </p>
              ) : null}

              {isLoading ? (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading options…
                </div>
              ) : ranked.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  No Practice Pass products are available yet. You can still unlock{" "}
                  {requiredName} by enrolling in a linked course.
                  <div className="mt-3">
                    <Button asChild variant="outline" size="sm">
                      <Link href={ROUTES.courses}>Browse courses</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {ranked.map((product) => {
                    const isProgramMatch = product.programId === programId;
                    const isGlobal = !product.programId;
                    const productTier = normalizeAccessBadge(product.tier);
                    const active = selected?.id === product.id;
                    const scope = isGlobal
                      ? "All programs"
                      : product.program?.name || programName;

                    return (
                      <li key={product.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(product.id)}
                          className={cn(
                            "w-full rounded-xl border px-3.5 py-3 text-left transition",
                            active
                              ? theme.selected
                              : "border-border bg-card hover:border-foreground/15"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={cn(
                                    "flex h-4 w-4 items-center justify-center rounded-full border",
                                    active
                                      ? "border-transparent bg-foreground text-white"
                                      : "border-border"
                                  )}
                                >
                                  {active ? <Check className="h-2.5 w-2.5" aria-hidden /> : null}
                                </span>
                                <p className="truncate font-semibold text-foreground">
                                  {product.title}
                                </p>
                                <span
                                  className={cn(
                                    "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
                                    tierBadgeClass(productTier)
                                  )}
                                >
                                  {tierLabel(productTier).replace(/^ALT\s+/, "")}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-1 pl-6 text-xs text-muted-foreground">
                                {richTextToPlain(product.description) || scope}
                                {product.durationDays
                                  ? ` · ${product.durationDays} days`
                                  : ""}
                              </p>
                              {isProgramMatch ? (
                                <p className={cn("mt-1 pl-6 text-[11px] font-semibold", theme.accent)}>
                                  Best match for this subject
                                </p>
                              ) : null}
                            </div>
                            <p className="shrink-0 text-base font-extrabold text-foreground">
                              {formatMoney(Number(product.price))}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-border px-5 py-4">
          {step === "pitch" ? (
            <>
              <Button
                type="button"
                className={cn("w-full", theme.cta)}
                size="lg"
                disabled={!isAuthenticated && ranked.length === 0}
                onClick={() => {
                  if (!isAuthenticated) {
                    window.location.href = loginHref;
                    return;
                  }
                  setStep("plans");
                }}
              >
                {isAuthenticated
                  ? fromPrice != null
                    ? `View ${requiredName.replace(/^ALT\s+/, "")} options · from ${formatMoney(fromPrice)}`
                    : `View ${requiredName.replace(/^ALT\s+/, "")} options`
                  : "Sign in to view options"}
              </Button>
              <div className="flex items-center justify-between gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={ROUTES.courses}>Or browse courses</Link>
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Not now
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                type="button"
                className={cn("w-full", theme.cta)}
                size="lg"
                disabled={!selected || Boolean(busyId) || !isAuthenticated}
                onClick={() => selected && void buy(selected)}
              >
                {busyId ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Starting checkout…
                  </>
                ) : selected ? (
                  `Unlock with ${formatMoney(Number(selected.price))}`
                ) : (
                  "Select a pass"
                )}
              </Button>
              <Button type="button" variant="ghost" size="sm" className="w-full" onClick={onClose}>
                Not now
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
