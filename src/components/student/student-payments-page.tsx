"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, Loader2, ShoppingBag } from "lucide-react";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useAccessProducts, useCheckout, useStudentPayments } from "@/hooks";
import {
  accessTierRank,
  normalizeAccessBadge,
  tierBadgeClass,
  tierLabel,
} from "@/lib/access-tier";
import { formatMoney, formatShortDate } from "@/lib/format";
import { richTextToPlain } from "@/lib/rich-text";
import type { ApiError } from "@/types";
import type { AccessProduct } from "@/types/student-dashboard.types";
import { cn } from "@/utils";

function statusClass(status: string) {
  const s = status.toUpperCase();
  if (s === "SUCCESS") return "bg-[#ecfdf3] text-accent-green";
  if (s === "FAILED" || s === "REFUNDED") return "bg-accent/10 text-accent";
  return "bg-muted text-muted-foreground";
}

function tierAccent(tier?: string | null) {
  const key = normalizeAccessBadge(tier);
  if (key === "SILVER") {
    return {
      bar: "from-[#64748b] to-[#94a3b8]",
      soft: "bg-[#f8fafc]",
      ring: "hover:border-[#94a3b8]/50",
    };
  }
  if (key === "GOLD") {
    return {
      bar: "from-[#b45309] to-[#d4a017]",
      soft: "bg-[#fffbeb]",
      ring: "hover:border-[#d4a017]/45",
    };
  }
  if (key === "DIAMOND") {
    return {
      bar: "from-[#1d4ed8] to-[#3b82f6]",
      soft: "bg-[#eff6ff]",
      ring: "hover:border-[#3b82f6]/40",
    };
  }
  return {
    bar: "from-primary to-[#3b8dee]",
    soft: "bg-primary-muted/40",
    ring: "hover:border-primary/30",
  };
}

function unlockedTiers(tier?: string | null): string[] {
  const key = normalizeAccessBadge(tier);
  if (key === "DIAMOND") return ["Free", "Silver", "Gold", "Diamond"];
  if (key === "GOLD") return ["Free", "Silver", "Gold"];
  if (key === "SILVER") return ["Free", "Silver"];
  return ["Free"];
}

function PassCard({
  product,
  busy,
  disabled,
  onBuy,
}: {
  product: AccessProduct;
  busy: boolean;
  disabled: boolean;
  onBuy: () => void;
}) {
  const tier = product.tier ?? "GOLD";
  const accent = tierAccent(tier);
  const price = Number(product.price);
  const regular = product.regularPrice != null ? Number(product.regularPrice) : null;
  const hasDiscount = regular != null && Number.isFinite(regular) && regular > price;
  const scope = product.program?.name || "All programs";
  const blurb =
    richTextToPlain(product.description) ||
    `Unlocks ${unlockedTiers(tier).join(" + ")} sets for ${scope}.`;
  const durationLabel = product.durationDays
    ? `${product.durationDays} days`
    : "Until cancelled";

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition duration-300",
        "shadow-[0_8px_24px_-16px_rgba(15,23,42,0.25)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-16px_rgba(15,23,42,0.3)]",
        accent.ring
      )}
    >
      <div className={cn("h-1 w-full bg-gradient-to-r", accent.bar)} aria-hidden />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
              tierBadgeClass(tier)
            )}
          >
            {tierLabel(tier)}
          </span>
          <span className="truncate rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {scope}
          </span>
        </div>

        <h3 className="mt-2.5 line-clamp-2 text-base font-bold leading-snug text-foreground">
          {product.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {blurb}
        </p>

        <div className={cn("mt-3 rounded-xl px-3 py-2.5", accent.soft)}>
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-extrabold tracking-tight text-foreground">
                  {formatMoney(price)}
                </p>
                {hasDiscount ? (
                  <p className="text-xs text-muted-foreground line-through">
                    {formatMoney(regular!)}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {durationLabel}
            </div>
          </div>
        </div>

        <p className="mt-2.5 text-[11px] font-medium text-muted-foreground">
          Unlocks: {unlockedTiers(tier).join(" · ")}
        </p>

        <Button
          type="button"
          size="sm"
          className="mt-3 w-full"
          disabled={disabled}
          onClick={onBuy}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Starting…
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" aria-hidden />
              Buy {tierLabel(tier).replace(/^ALT\s+/, "")} Pass
            </>
          )}
        </Button>
      </div>
    </article>
  );
}

export function StudentPaymentsPage() {
  const { data = [], isLoading, error, refetch } = useStudentPayments();
  const { data: products = [], isLoading: productsLoading } = useAccessProducts();
  const checkout = useCheckout();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const tierDiff = accessTierRank(a.tier) - accessTierRank(b.tier);
      if (tierDiff !== 0) return tierDiff;
      return Number(a.price) - Number(b.price);
    });
  }, [products]);

  const buyPass = async (accessProductId: string) => {
    setCheckoutError(null);
    setBusyProductId(accessProductId);
    try {
      const result = await checkout.mutateAsync({ accessProductId });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      if (result.granted) {
        void refetch();
      }
    } catch (err) {
      setCheckoutError((err as ApiError)?.message || "Checkout failed");
    } finally {
      setBusyProductId(null);
    }
  };

  if (isLoading && data.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payments" description="Your purchase history." className="mb-0" />
        <PageLoader label="Loading payments..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <PageHeader
          title="Payments"
          description="Course purchases and Practice Pass checkout."
          className="mb-0"
        />
        {error ? (
          <p className="mt-3 text-sm text-accent">
            {(error as unknown as ApiError)?.message || "Failed to load"}
            <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
              Retry
            </button>
          </p>
        ) : null}
      </div>

      <section
        id="practice-pass"
        className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
      >
        <div className="border-b border-border bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_55%,#fff8f4_100%)] px-5 py-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Unlock content
              </p>
              <h2 className="mt-1 text-xl font-bold text-foreground">Practice Pass</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Unlock questionbanks and practice — pick a pass by tier, program, and duration.
              </p>
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              {sortedProducts.length} pass{sortedProducts.length === 1 ? "" : "es"} available
            </p>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {checkoutError ? (
            <p role="alert" className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
              {checkoutError}
            </p>
          ) : null}

          {productsLoading ? (
            <PageLoader label="Loading products..." />
          ) : sortedProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No Practice Pass products are available yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sortedProducts.map((product) => (
                <PassCard
                  key={product.id}
                  product={product}
                  busy={busyProductId === product.id}
                  disabled={Boolean(busyProductId)}
                  onBuy={() => void buyPass(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            <h2 className="text-lg font-bold text-foreground">Payment history</h2>
            <p className="text-sm text-muted-foreground">Course and Practice Pass purchases</p>
          </div>
        </div>

        {data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
            <p className="text-sm text-muted-foreground">No payments yet.</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href={ROUTES.courses}>Browse paid courses</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Item</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-5 py-4 font-semibold text-foreground">
                      {payment.accessProduct?.title ?? payment.course?.title ?? "Purchase"}
                    </td>
                    <td className="px-5 py-4 font-medium">{formatMoney(payment.amount)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase",
                          statusClass(String(payment.status))
                        )}
                      >
                        {String(payment.status).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatShortDate(payment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
