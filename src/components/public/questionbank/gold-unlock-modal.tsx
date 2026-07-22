"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Loader2, Lock, Sparkles } from "lucide-react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { Button } from "@/components/ui/button";
import { ROUTES, queryKeys } from "@/constants";
import { useAccessProducts, useCheckout } from "@/hooks";
import {
  accessTierRank,
  canAccessWithTier,
  normalizeAccessBadge,
  tierBadgeClass,
  tierLabel,
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
};

function sortProductsForProgram(
  products: AccessProduct[],
  programId: string,
  requiredTier: string
) {
  // product.tier rank >= requiredTier rank means the product unlocks at least the required tier
  const eligible = products.filter((p) => canAccessWithTier(p.tier, requiredTier));
  const matching = eligible.filter((p) => p.programId === programId);
  const global = eligible.filter((p) => !p.programId);
  const other = eligible.filter((p) => p.programId && p.programId !== programId);

  const byTier = (a: AccessProduct, b: AccessProduct) =>
    accessTierRank(a.tier) - accessTierRank(b.tier);

  return [
    ...matching.sort(byTier),
    ...global.sort(byTier),
    ...other.sort(byTier),
  ];
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
}: Props) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useAccessProducts();
  const checkout = useCheckout();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const required = normalizeAccessBadge(requiredTier);
  const requiredName = tierLabel(required);

  const returnPath = useMemo(() => {
    const base = ROUTES.subjectQuestionbank(programSlug);
    return `${base}?unlocked=1`;
  }, [programSlug]);

  const loginHref = `${ROUTES.auth.login}?next=${encodeURIComponent(
    `${ROUTES.subjectQuestionbank(programSlug)}?unlock=1`
  )}`;

  const ranked = useMemo(
    () => sortProductsForProgram(products, programId, required).slice(0, 4),
    [products, programId, required]
  );

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

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={`Unlock ${requiredName}`}
      description={
        subtopicTitle
          ? `Get a Practice Pass to open “${subtopicTitle}” and other ${requiredName} topics in ${programName}.`
          : `Get a Practice Pass to open ${requiredName} topics in ${programName}.`
      }
      className="sm:max-w-lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={ROUTES.courses}>
              <BookOpen className="h-4 w-4" aria-hidden />
              Or browse courses
            </Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Not now
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[#f5d0a8] bg-[#fff8ef] px-3 py-2.5 text-sm text-[#9a3412]">
          <p className="inline-flex items-center gap-1.5 font-semibold">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            {requiredName} content stays on this page
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#9a3412]/90">
            Buy a pass here — after payment you’ll return to this questionbank automatically.
          </p>
        </div>

        {!isAuthenticated ? (
          <div className="rounded-xl border border-primary/20 bg-primary-muted/50 px-3 py-3 text-sm">
            <p className="font-semibold text-foreground">Sign in to purchase</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You’ll come back here to finish unlocking {requiredName} topics.
            </p>
            <Button asChild className="mt-3 w-full" size="pill">
              <Link href={loginHref}>Sign in to continue</Link>
            </Button>
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
            {error}
          </p>
        ) : null}

        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Practice Pass options…
          </div>
        ) : ranked.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No Practice Pass products are available yet. You can still unlock {requiredName} by
            enrolling in a linked course.
            <div className="mt-3">
              <Button asChild variant="outline" size="sm">
                <Link href={ROUTES.courses}>Browse courses</Link>
              </Button>
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {ranked.map((product) => {
              const isProgramMatch = product.programId === programId;
              const isGlobal = !product.programId;
              const busy = busyId === product.id;
              const productTier = product.tier ?? "GOLD";

              return (
                <li
                  key={product.id}
                  className={cn(
                    "rounded-xl border bg-card p-4",
                    isProgramMatch ? "border-[#d4a017]/50 shadow-sm" : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-foreground">{product.title}</p>
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
                            tierBadgeClass(productTier)
                          )}
                        >
                          {tierLabel(productTier)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {richTextToPlain(product.description) ||
                          (isGlobal
                            ? "All subject programs"
                            : product.program?.name || programName)}
                      </p>
                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[#9a3412]">
                        {isProgramMatch
                          ? "Best match for this questionbank"
                          : isGlobal
                            ? "All programs"
                            : "Other program"}
                        {product.durationDays ? ` · ${product.durationDays} days` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-lg font-extrabold text-foreground">
                      {formatMoney(Number(product.price))}
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="mt-3 w-full"
                    size="pill"
                    disabled={!isAuthenticated || busy || Boolean(busyId)}
                    onClick={() => void buy(product)}
                  >
                    {busy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Starting checkout…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" aria-hidden />
                        Buy & unlock
                      </>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminModal>
  );
}
