"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { AdminIconAction } from "@/components/admin/shared/admin-icon-action";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAdminAccessProducts,
  useCreateAccessProduct,
  useDeactivateAccessProduct,
  useUpdateAccessProduct,
} from "@/hooks";
import { formatMoney } from "@/lib/format";
import { tierBadgeClass, tierLabel } from "@/lib/access-tier";
import type { ApiError } from "@/types";
import type { AccessProduct } from "@/types/student-dashboard.types";
import { cn } from "@/utils";

type ProductTier = "SILVER" | "GOLD" | "DIAMOND";

type TierDraft = {
  tier: ProductTier;
  slug: string;
  title: string;
  price: string;
  durationDays: string;
  description: string;
};

const GLOBAL_TIERS: Array<{
  tier: ProductTier;
  slug: string;
  title: string;
  defaultPrice: string;
  defaultDays: string;
  blurb: string;
}> = [
  {
    tier: "SILVER",
    slug: "global-silver-pass",
    title: "Silver Pass",
    defaultPrice: "199",
    defaultDays: "30",
    blurb: "Unlocks Free + Silver content across Questionbank, Key Concepts, Practice Exams, and Past Papers.",
  },
  {
    tier: "GOLD",
    slug: "global-gold-pass",
    title: "Gold Pass",
    defaultPrice: "399",
    defaultDays: "30",
    blurb: "Unlocks Free + Silver + Gold content across all subject resources.",
  },
  {
    tier: "DIAMOND",
    slug: "global-diamond-pass",
    title: "Diamond Pass",
    defaultPrice: "999",
    defaultDays: "90",
    blurb: "Full unlock — Free through Diamond content for every subject program.",
  },
];

function draftFromProduct(
  meta: (typeof GLOBAL_TIERS)[number],
  product?: AccessProduct | null
): TierDraft {
  return {
    tier: meta.tier,
    slug: meta.slug,
    title: product?.title?.trim() || meta.title,
    price: product ? String(Number(product.price) || 0) : meta.defaultPrice,
    durationDays:
      product?.durationDays != null
        ? String(product.durationDays)
        : product
          ? ""
          : meta.defaultDays,
    description: product?.description?.trim() || meta.blurb,
  };
}

export function AdminAccessProductsPage() {
  const { data: products = [], isLoading, error, refetch, isFetching } = useAdminAccessProducts();
  const createProduct = useCreateAccessProduct();
  const updateProduct = useUpdateAccessProduct();
  const deactivateProduct = useDeactivateAccessProduct();

  const [drafts, setDrafts] = useState<Record<ProductTier, TierDraft>>({
    SILVER: draftFromProduct(GLOBAL_TIERS[0]!),
    GOLD: draftFromProduct(GLOBAL_TIERS[1]!),
    DIAMOND: draftFromProduct(GLOBAL_TIERS[2]!),
  });
  const [savingTier, setSavingTier] = useState<ProductTier | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);

  const globalBySlug = useMemo(() => {
    const map = new Map<string, AccessProduct>();
    for (const product of products) {
      if (!product.programId && GLOBAL_TIERS.some((t) => t.slug === product.slug)) {
        map.set(product.slug, product);
      }
    }
    // Fallback: active global product matching tier if slug differs
    for (const meta of GLOBAL_TIERS) {
      if (map.has(meta.slug)) continue;
      const match = products.find(
        (p) =>
          !p.programId &&
          String(p.tier).toUpperCase() === meta.tier &&
          p.isActive !== false
      );
      if (match) map.set(meta.slug, match);
    }
    return map;
  }, [products]);

  useEffect(() => {
    setDrafts({
      SILVER: draftFromProduct(GLOBAL_TIERS[0]!, globalBySlug.get("global-silver-pass")),
      GOLD: draftFromProduct(GLOBAL_TIERS[1]!, globalBySlug.get("global-gold-pass")),
      DIAMOND: draftFromProduct(GLOBAL_TIERS[2]!, globalBySlug.get("global-diamond-pass")),
    });
  }, [globalBySlug]);

  const extraActive = useMemo(
    () =>
      products.filter(
        (p) =>
          p.isActive !== false &&
          !GLOBAL_TIERS.some((t) => t.slug === p.slug && !p.programId)
      ),
    [products]
  );

  const setDraft = (tier: ProductTier, patch: Partial<TierDraft>) => {
    setDrafts((prev) => ({ ...prev, [tier]: { ...prev[tier], ...patch } }));
  };

  const saveTier = async (tier: ProductTier) => {
    const draft = drafts[tier];
    const meta = GLOBAL_TIERS.find((t) => t.tier === tier)!;
    const existing = globalBySlug.get(meta.slug);
    const price = Number.parseFloat(draft.price);
    if (!Number.isFinite(price) || price < 0) {
      setActionError(`${meta.title}: enter a valid price.`);
      return;
    }
    setSavingTier(tier);
    setActionError(null);
    setActionOk(null);
    const durationDays = draft.durationDays.trim()
      ? Number.parseInt(draft.durationDays, 10)
      : null;
    try {
      if (existing) {
        await updateProduct.mutateAsync({
          id: existing.id,
          payload: {
            title: draft.title.trim() || meta.title,
            slug: meta.slug,
            description: draft.description.trim() || meta.blurb,
            price,
            durationDays,
            programId: null,
            tier,
            isActive: true,
          },
        });
      } else {
        await createProduct.mutateAsync({
          title: draft.title.trim() || meta.title,
          slug: meta.slug,
          description: draft.description.trim() || meta.blurb,
          price,
          durationDays: durationDays ?? undefined,
          tier,
        });
      }
      setActionOk(`${meta.title} price saved.`);
      void refetch();
    } catch (err) {
      setActionError((err as ApiError)?.message || `Failed to save ${meta.title}`);
    } finally {
      setSavingTier(null);
    }
  };

  const disableExtras = async () => {
    if (extraActive.length === 0) return;
    if (
      !window.confirm(
        `Disable ${extraActive.length} extra product(s)? Students will only see Silver / Gold / Diamond.`
      )
    ) {
      return;
    }
    setCleaning(true);
    setActionError(null);
    setActionOk(null);
    try {
      for (const product of extraActive) {
        await deactivateProduct.mutateAsync(product.id);
      }
      setActionOk("Extra products disabled. Only the 3 tier prices remain active.");
      void refetch();
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to disable extras");
    } finally {
      setCleaning(false);
    }
  };

  if (isLoading && products.length === 0) {
    return <PageLoader label="Loading pass pricing..." />;
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-6">
          <PageHeader
            title="Pass pricing"
            description="Only 3 paid plans: Silver, Gold, and Diamond. These prices unlock Questionbank, Key Concepts, Practice Exams, and Past Papers. No other product prices."
            className="mb-0"
          />
          <AdminIconAction
            label="Refresh"
            icon={RefreshCw}
            tone="primary"
            disabled={isFetching}
            onClick={() => void refetch()}
            className={isFetching ? "animate-spin" : undefined}
          />
        </div>

        <div className="space-y-3 px-5 py-4 text-sm text-muted-foreground">
          <p>
            Content items are tagged Free / Silver / Gold / Diamond. Students buy one of these
            passes; higher tiers include lower ones (Diamond ⊃ Gold ⊃ Silver ⊃ Free).
          </p>
          {extraActive.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
              <p>
                {extraActive.length} extra access product(s) are still active (old per-subject
                passes). Disable them so students only see these 3 prices.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={cleaning}
                onClick={() => void disableExtras()}
              >
                {cleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Disable extras
              </Button>
            </div>
          ) : null}
          {actionError ? <p className="text-accent">{actionError}</p> : null}
          {actionOk ? <p className="text-accent-green">{actionOk}</p> : null}
          {error ? (
            <p className="text-accent">{(error as unknown as ApiError)?.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {GLOBAL_TIERS.map((meta) => {
          const draft = drafts[meta.tier];
          const existing = globalBySlug.get(meta.slug);
          const busy = savingTier === meta.tier;
          return (
            <div
              key={meta.tier}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white",
                    tierBadgeClass(meta.tier)
                  )}
                >
                  {tierLabel(meta.tier)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {existing ? "Saved" : "Not created yet"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{meta.blurb}</p>

              <div className="mt-4 space-y-3">
                <label className="block space-y-1 text-sm">
                  <span className="font-semibold text-foreground">Display name</span>
                  <Input
                    value={draft.title}
                    onChange={(e) => setDraft(meta.tier, { title: e.target.value })}
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-semibold text-foreground">Price (BDT)</span>
                  <Input
                    type="number"
                    min={0}
                    value={draft.price}
                    onChange={(e) => setDraft(meta.tier, { price: e.target.value })}
                  />
                  <span className="text-xs text-muted-foreground">
                    Preview: {formatMoney(Number(draft.price) || 0)}
                  </span>
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-semibold text-foreground">Access days</span>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Blank = lifetime"
                    value={draft.durationDays}
                    onChange={(e) => setDraft(meta.tier, { durationDays: e.target.value })}
                  />
                </label>
              </div>

              <Button
                type="button"
                className="mt-5 w-full"
                disabled={busy || createProduct.isPending || updateProduct.isPending}
                onClick={() => void saveTier(meta.tier)}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save {meta.title} price
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
