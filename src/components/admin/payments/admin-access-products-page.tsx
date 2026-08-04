"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Save, Sparkles, Wallet } from "lucide-react";
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
  includes: string[];
}> = [
  {
    tier: "SILVER",
    slug: "global-silver-pass",
    title: "Silver Pass",
    defaultPrice: "199",
    defaultDays: "30",
    blurb: "Unlocks Free + Silver content across Questionbank, Key Concepts, Practice Exams, and Past Papers.",
    includes: ["Free content", "Silver content", "All subjects"],
  },
  {
    tier: "GOLD",
    slug: "global-gold-pass",
    title: "Gold Pass",
    defaultPrice: "399",
    defaultDays: "30",
    blurb: "Unlocks Free + Silver + Gold content across Questionbank, Key Concepts, Practice Exams, and Past Papers.",
    includes: ["Everything in Silver", "Gold content", "All subjects"],
  },
  {
    tier: "DIAMOND",
    slug: "global-diamond-pass",
    title: "Diamond Pass",
    defaultPrice: "999",
    defaultDays: "90",
    blurb: "Full unlock — Free through Diamond content for Questionbank, Key Concepts, Practice Exams, and Past Papers.",
    includes: ["Everything in Gold", "Diamond content", "All subjects"],
  },
];

const solidBtn =
  "border-0 text-white shadow-none hover:translate-y-0 hover:shadow-none";

function tierButtonClass(tier: ProductTier) {
  if (tier === "SILVER") return "bg-[#94a3b8] hover:bg-[#7f8fa6]";
  if (tier === "GOLD") return "bg-[#d4a017] hover:bg-[#b88912]";
  return "bg-[#6366f1] hover:bg-[#4f52d5]";
}

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

function findGlobalProduct(products: AccessProduct[], meta: (typeof GLOBAL_TIERS)[number]) {
  const bySlug = products.find((p) => !p.programId && p.slug === meta.slug);
  if (bySlug) return bySlug;
  return (
    products.find(
      (p) =>
        !p.programId &&
        String(p.tier).toUpperCase() === meta.tier &&
        p.isActive !== false
    ) ?? null
  );
}

const EMPTY_PRODUCTS: AccessProduct[] = [];

export function AdminAccessProductsPage() {
  const { data, isLoading, error, refetch, isFetching } = useAdminAccessProducts();
  const products = data ?? EMPTY_PRODUCTS;
  const createProduct = useCreateAccessProduct();
  const updateProduct = useUpdateAccessProduct();
  const deactivateProduct = useDeactivateAccessProduct();

  const [drafts, setDrafts] = useState<Record<ProductTier, TierDraft>>({
    SILVER: draftFromProduct(GLOBAL_TIERS[0]!),
    GOLD: draftFromProduct(GLOBAL_TIERS[1]!),
    DIAMOND: draftFromProduct(GLOBAL_TIERS[2]!),
  });
  const [savingTier, setSavingTier] = useState<ProductTier | null>(null);
  const [setupBusy, setSetupBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  const globalBySlug = useMemo(() => {
    const map = new Map<string, AccessProduct>();
    for (const meta of GLOBAL_TIERS) {
      const match = findGlobalProduct(products, meta);
      if (match) map.set(meta.slug, match);
    }
    return map;
  }, [products]);

  const draftSyncKey = useMemo(
    () =>
      GLOBAL_TIERS.map((meta) => {
        const product = globalBySlug.get(meta.slug);
        if (!product) return `${meta.slug}:missing`;
        return [
          meta.slug,
          product.id,
          product.title,
          String(product.price),
          product.durationDays ?? "",
          product.description ?? "",
        ].join(":");
      }).join("|"),
    [globalBySlug]
  );

  useEffect(() => {
    setDrafts({
      SILVER: draftFromProduct(GLOBAL_TIERS[0]!, globalBySlug.get("global-silver-pass")),
      GOLD: draftFromProduct(GLOBAL_TIERS[1]!, globalBySlug.get("global-gold-pass")),
      DIAMOND: draftFromProduct(GLOBAL_TIERS[2]!, globalBySlug.get("global-diamond-pass")),
    });
    // Sync only when server product fields change — not on every Map identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draftSyncKey captures product snapshot
  }, [draftSyncKey]);

  const knownGlobalIds = useMemo(() => {
    const ids = new Set<string>();
    for (const meta of GLOBAL_TIERS) {
      const product = globalBySlug.get(meta.slug);
      if (product) ids.add(product.id);
    }
    return ids;
  }, [globalBySlug]);

  const extraActive = useMemo(
    () => products.filter((p) => p.isActive !== false && !knownGlobalIds.has(p.id)),
    [products, knownGlobalIds]
  );

  const missingCount = GLOBAL_TIERS.filter((meta) => !globalBySlug.get(meta.slug)).length;
  const needsSetup = missingCount > 0 || extraActive.length > 0;

  const setDraft = (tier: ProductTier, patch: Partial<TierDraft>) => {
    setDrafts((prev) => ({ ...prev, [tier]: { ...prev[tier], ...patch } }));
  };

  const persistTier = async (tier: ProductTier, draft: TierDraft) => {
    const meta = GLOBAL_TIERS.find((t) => t.tier === tier)!;
    const existing = globalBySlug.get(meta.slug);
    const price = Number.parseFloat(draft.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new Error(`${meta.title}: enter a valid price.`);
    }
    const durationDays = draft.durationDays.trim()
      ? Number.parseInt(draft.durationDays, 10)
      : null;
    if (durationDays != null && (!Number.isFinite(durationDays) || durationDays < 1)) {
      throw new Error(`${meta.title}: enter valid access days (or leave blank for lifetime).`);
    }

    const payload = {
      title: draft.title.trim() || meta.title,
      slug: meta.slug,
      description: draft.description.trim() || meta.blurb,
      price,
      durationDays,
      programId: null as string | null,
      tier,
      isActive: true,
    };

    if (existing) {
      await updateProduct.mutateAsync({ id: existing.id, payload });
    } else {
      await createProduct.mutateAsync({
        title: payload.title,
        slug: payload.slug,
        description: payload.description,
        price: payload.price,
        durationDays: durationDays ?? undefined,
        tier,
      });
    }
  };

  const saveTier = async (tier: ProductTier) => {
    setSavingTier(tier);
    setActionError(null);
    setActionOk(null);
    try {
      await persistTier(tier, drafts[tier]);
      setActionOk(`${GLOBAL_TIERS.find((t) => t.tier === tier)!.title} saved.`);
      await refetch();
    } catch (err) {
      setActionError((err as ApiError)?.message || `Failed to save ${tier}`);
    } finally {
      setSavingTier(null);
    }
  };

  const applyStandardSetup = async () => {
    setSetupBusy(true);
    setActionError(null);
    setActionOk(null);
    try {
      for (const meta of GLOBAL_TIERS) {
        const draft = drafts[meta.tier];
        await persistTier(meta.tier, {
          ...draft,
          title: draft.title.trim() || meta.title,
          price: draft.price.trim() || meta.defaultPrice,
          durationDays: draft.durationDays.trim() || meta.defaultDays,
          description: draft.description.trim() || meta.blurb,
        });
      }
      for (const product of extraActive) {
        await deactivateProduct.mutateAsync(product.id);
      }
      setActionOk("Silver, Gold, and Diamond passes are set. Extra products disabled.");
      await refetch();
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to apply standard pricing");
    } finally {
      setSetupBusy(false);
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
    setSetupBusy(true);
    setActionError(null);
    setActionOk(null);
    try {
      for (const product of extraActive) {
        await deactivateProduct.mutateAsync(product.id);
      }
      setActionOk("Extra products disabled. Only the 3 tier prices remain active.");
      await refetch();
    } catch (err) {
      setActionError((err as ApiError)?.message || "Failed to disable extras");
    } finally {
      setSetupBusy(false);
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
            description="Only 3 paid plans: Silver, Gold, and Diamond. These unlock Questionbank, Key Concepts, Practice Exams, and Past Papers."
            className="mb-0"
          />
          <div className="flex flex-wrap items-center gap-2">
            {needsSetup ? (
              <Button
                type="button"
                size="sm"
                className={cn(solidBtn, "bg-primary hover:bg-primary-hover")}
                disabled={setupBusy}
                onClick={() => void applyStandardSetup()}
              >
                {setupBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Set up all 3 passes
              </Button>
            ) : null}
            <AdminIconAction
              label="Refresh"
              icon={RefreshCw}
              tone="primary"
              disabled={isFetching || setupBusy}
              onClick={() => void refetch()}
              className={isFetching ? "animate-spin" : undefined}
            />
          </div>
        </div>

        <div className="space-y-3 px-5 py-4 text-sm text-muted-foreground">
          <p>
            Higher tiers include lower ones: Diamond ⊃ Gold ⊃ Silver ⊃ Free. Content is tagged by
            tier; students buy one pass for all subjects.
          </p>

          {needsSetup ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
              <div className="space-y-1">
                {missingCount > 0 ? (
                  <p className="font-medium">
                    {missingCount} pass{missingCount === 1 ? "" : "es"} not created yet (Silver /
                    Gold / Diamond).
                  </p>
                ) : null}
                {extraActive.length > 0 ? (
                  <p>
                    {extraActive.length} old extra product{extraActive.length === 1 ? "" : "s"} still
                    active — disable so students only see these 3 prices.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {extraActive.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={setupBusy}
                    onClick={() => void disableExtras()}
                  >
                    Disable extras
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  className={cn(solidBtn, "bg-primary hover:bg-primary-hover")}
                  disabled={setupBusy}
                  onClick={() => void applyStandardSetup()}
                >
                  {setupBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Fix now
                </Button>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl border border-accent-green/25 bg-accent-green/5 px-3 py-2 text-accent-green">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              All 3 passes are active. No extra products.
            </div>
          )}

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
          const busy = savingTier === meta.tier || setupBusy;
          const pricePreview = Number(draft.price) || 0;
          const daysLabel = draft.durationDays.trim()
            ? `${draft.durationDays.trim()} days`
            : "Lifetime";

          return (
            <article
              key={meta.tier}
              className="flex h-full flex-col rounded-2xl border border-border/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white",
                    tierBadgeClass(meta.tier)
                  )}
                >
                  {tierLabel(meta.tier)}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    existing
                      ? "bg-accent-green/10 text-accent-green"
                      : "bg-amber-50 text-amber-800"
                  )}
                >
                  {existing ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      Active
                    </>
                  ) : (
                    "Needs setup"
                  )}
                </span>
              </div>

              <div className="mt-4 flex items-end gap-2">
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {formatMoney(pricePreview)}
                </p>
                <p className="pb-1 text-sm text-muted-foreground">/ {daysLabel}</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{meta.blurb}</p>

              <ul className="mt-4 space-y-1.5">
                {meta.includes.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-5 space-y-3 border-t border-border pt-4">
                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold text-foreground">Display name</span>
                  <Input
                    value={draft.title}
                    onChange={(e) => setDraft(meta.tier, { title: e.target.value })}
                    placeholder={meta.title}
                  />
                </label>
                <label className="block space-y-1.5 text-sm">
                  <span className="font-semibold text-foreground">Price (BDT)</span>
                  <Input
                    type="number"
                    min={0}
                    value={draft.price}
                    onChange={(e) => setDraft(meta.tier, { price: e.target.value })}
                  />
                </label>
                <label className="block space-y-1.5 text-sm">
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
                className={cn("mt-5 w-full", solidBtn, tierButtonClass(meta.tier))}
                disabled={busy || createProduct.isPending || updateProduct.isPending}
                onClick={() => void saveTier(meta.tier)}
              >
                {busy && savingTier === meta.tier ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : existing ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                {existing ? `Update ${meta.title}` : `Create ${meta.title}`}
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
