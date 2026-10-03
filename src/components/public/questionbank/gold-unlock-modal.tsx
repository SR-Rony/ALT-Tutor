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
  PlayCircle,
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
import { formatDurationUntil, formatMoney } from "@/lib/format";
import { setPaymentReturnTo } from "@/lib/payment-return";
import { richTextToPlain } from "@/lib/rich-text";
import { studySetPrice, studySetRegularPrice } from "@/lib/study-set-pricing";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import type { QbSubtopic } from "@/types/qb.types";
import type { AccessProduct } from "@/types/student-dashboard.types";
import { cn } from "@/utils";

export type UnlockStudySet = Pick<
  QbSubtopic,
  "id" | "slug" | "title" | "price" | "regularPrice" | "accessDurationDays"
>;

type Props = {
  open: boolean;
  onClose: () => void;
  programId: string;
  programName: string;
  programSlug: string;
  subtopicTitle?: string | null;
  /** Minimum product tier that unlocks this study set. */
  requiredTier?: string;
  /** When set (and priced), the student can buy just this study set. */
  studySet?: UnlockStudySet | null;
  /** Called after access is granted immediately (free / already entitled). */
  onUnlocked?: () => void;
  /** Where to return after checkout (defaults to questionbank). */
  returnPath?: string;
};

type Step = "pitch" | "plans";

type UnlockOption =
  | { id: "study-set"; kind: "studySet"; price: number; studySet: UnlockStudySet }
  | { id: string; kind: "product"; price: number; product: AccessProduct };

function sortProductsForProgram(
  products: AccessProduct[],
  programId: string,
  requiredTier: string
) {
  const eligible = products.filter((p) => canAccessWithTier(p.tier, requiredTier));
  const matching = eligible.filter((p) => p.programId === programId);
  // Program-less passes are price templates: bought for the subject chosen at checkout.
  const generic = eligible.filter((p) => !p.programId);
  const byTier = (a: AccessProduct, b: AccessProduct) =>
    accessTierRank(a.tier) - accessTierRank(b.tier);

  return [...matching.sort(byTier), ...generic.sort(byTier)];
}

function unlockedTier(tier: QbAccessBadge): string[] {
  if (normalizeAccessBadge(tier) === "GOLD") return ["Free", "Gold"];
  return ["Free"];
}

const theme = {
  hero: "from-[#fff7ed] via-[#fffbeb] to-white",
  accent: "text-[#b45309]",
  iconWrap: "bg-[#fef3c7] text-[#b45309]",
  cta: "!bg-none bg-[#d4a017] text-white shadow-none hover:!bg-[#b45309] hover:translate-y-0 hover:shadow-none",
  ring: "ring-[#d4a017]/40",
  selected: "border-[#d4a017] bg-[#fffbeb]",
};

export function GoldUnlockModal({
  open,
  onClose,
  programId,
  programName,
  programSlug,
  subtopicTitle,
  requiredTier = "GOLD",
  studySet,
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
  const requiredShort = requiredName.replace(/^ALT\s+/, "");
  const unlockLabels = unlockedTier(required);
  const setPrice = studySet ? studySetPrice(studySet) : null;
  const setRegular = studySet ? studySetRegularPrice(studySet) : null;
  const setTitle = studySet
    ? richTextToPlain(studySet.title) || studySet.title
    : subtopicTitle ?? null;

  const returnPath = useMemo(() => {
    if (returnPathProp) return returnPathProp;
    return `${ROUTES.subjectQuestionbank(programSlug)}?unlocked=1`;
  }, [programSlug, returnPathProp]);

  const loginHref = `${ROUTES.auth.login}?next=${encodeURIComponent(returnPath)}`;

  const options = useMemo<UnlockOption[]>(() => {
    const list: UnlockOption[] = [];
    if (studySet && setPrice != null) {
      list.push({ id: "study-set", kind: "studySet", price: setPrice, studySet });
    }
    for (const product of sortProductsForProgram(products, programId, required).slice(0, 1)) {
      list.push({ id: product.id, kind: "product", price: Number(product.price) || 0, product });
    }
    return list;
  }, [products, programId, required, studySet, setPrice]);

  const selected = options.find((o) => o.id === selectedId) ?? options[0] ?? null;
  const fromPrice = options.length ? Math.min(...options.map((o) => o.price)) : null;

  useEffect(() => {
    if (!open) return;
    setStep("pitch");
    setError(null);
    setBusyId(null);
  }, [open, required, programId, studySet?.id]);

  useEffect(() => {
    if (!open || options.length === 0) return;
    setSelectedId((prev) =>
      prev && options.some((o) => o.id === prev) ? prev : options[0]!.id
    );
  }, [open, options]);

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

  const buy = async (option: UnlockOption) => {
    const afterPayment =
      option.kind === "studySet"
        ? ROUTES.subjectQuestionbankStudy(programSlug, option.studySet.slug)
        : returnPath;

    if (!isAuthenticated) {
      window.location.href = `${ROUTES.auth.login}?next=${encodeURIComponent(afterPayment)}`;
      return;
    }

    setError(null);
    setBusyId(option.id);
    setPaymentReturnTo(afterPayment);

    try {
      const result = await checkout.mutateAsync(
        option.kind === "studySet"
          ? { subtopicId: option.studySet.id }
          : {
              accessProductId: option.product.id,
              programId: option.product.programId ?? programId,
            }
      );
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      if (result.granted) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.questionbank.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.practiceExams.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.keyConcepts.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.pastPapers.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
        onUnlocked?.();
        onClose();
        return;
      }
      setError("Checkout started, but no payment URL was returned. Please try again.");
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError?.status === 409) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.questionbank.all });
        onUnlocked?.();
      }
      setError(apiError?.message || "Checkout failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (!open) return null;

  const benefits =
    setPrice != null
      ? [
          { icon: BookOpen, text: "Every question in this study set, across all papers" },
          { icon: FileText, text: "Mark schemes and worked solutions after each answer" },
          { icon: PlayCircle, text: "Video solutions and timed exam mode with scoring" },
        ]
      : [
          {
            icon: BookOpen,
            text: `Questionbank study sets up to ${requiredShort} (${unlockLabels.join(" + ")})`,
          },
          { icon: ClipboardList, text: "Practice exams for this subject at the same access level" },
          { icon: FileText, text: "Past papers and review tools after you submit" },
        ];

  const pitchCta = () => {
    if (!isAuthenticated) {
      window.location.href = loginHref;
      return;
    }
    if (options.length === 1) {
      void buy(options[0]!);
      return;
    }
    setStep("plans");
  };

  const pitchLabel = (() => {
    if (!isAuthenticated) return "Sign in to unlock";
    if (busyId) return null;
    if (options.length === 1) {
      return options[0]!.kind === "studySet"
        ? `Unlock this set · ${formatMoney(options[0]!.price)}`
        : `Unlock with ${formatMoney(options[0]!.price)}`;
    }
    return fromPrice != null
      ? `View ${requiredShort} options · from ${formatMoney(fromPrice)}`
      : `View ${requiredShort} options`;
  })();

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
              {setPrice != null && setTitle ? (
                <>
                  Unlock <span className={theme.accent}>“{setTitle}”</span>
                </>
              ) : (
                <>
                  Take your practice to the <span className={theme.accent}>next level</span>
                </>
              )}
            </h2>
            {setPrice != null ? (
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-2xl font-extrabold tracking-tight text-foreground">
                  {formatMoney(setPrice)}
                </p>
                {setRegular != null ? (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatMoney(setRegular)}
                  </p>
                ) : null}
                <p className="text-xs font-medium text-muted-foreground">
                  · {formatDurationUntil(studySet?.accessDurationDays)}
                </p>
              </div>
            ) : (
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {setTitle
                  ? `“${setTitle}” is ${requiredName}. Upgrade to unlock it in ${programName}.`
                  : `This content needs ${requiredName}. Upgrade to unlock it in ${programName}.`}
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "pitch" ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {setPrice != null ? "What you get:" : `Upgrade to ${requiredName} and unlock:`}
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
                  {setPrice != null ? (
                    <>
                      This payment unlocks <span className="font-semibold text-foreground">this study set only</span>.
                      Other Gold study sets are bought separately. After payment you return here
                      automatically.
                    </>
                  ) : (
                    <>
                      Gold is bought per subject — this pass unlocks{" "}
                      <span className="font-semibold text-foreground">{programName}</span> only.
                      After payment you return here automatically.
                    </>
                  )}
                </p>
              </div>

              {error ? (
                <p role="alert" className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
                  {error}
                </p>
              ) : null}

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
                <p className="text-sm font-semibold text-foreground">Choose how to unlock</p>
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

              {isLoading && options.length === 0 ? (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading options…
                </div>
              ) : options.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  This study set isn’t on sale yet. You can still unlock {requiredName} by
                  enrolling in a linked course.
                  <div className="mt-3">
                    <Button asChild variant="outline" size="sm">
                      <Link href={ROUTES.courses}>Browse courses</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {options.map((option) => {
                    const active = selected?.id === option.id;
                    const isSet = option.kind === "studySet";
                    const titleText = isSet ? "This study set only" : option.product.title;
                    const scope = isSet
                      ? `Unlocks “${setTitle}” only`
                      : `Unlocks all ${requiredShort} sets in ${option.product.program?.name || programName}`;
                    const duration = isSet
                      ? formatDurationUntil(option.studySet.accessDurationDays)
                      : formatDurationUntil(option.product.durationDays);
                    const description = isSet ? null : richTextToPlain(option.product.description);

                    return (
                      <li key={option.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(option.id)}
                          className={cn(
                            "w-full rounded-xl border px-3.5 py-3 text-left transition",
                            active ? theme.selected : "border-border bg-card hover:border-foreground/15"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={cn(
                                    "flex h-4 w-4 items-center justify-center rounded-full border",
                                    active ? "border-transparent bg-foreground text-white" : "border-border"
                                  )}
                                >
                                  {active ? <Check className="h-2.5 w-2.5" aria-hidden /> : null}
                                </span>
                                <p className="truncate font-semibold text-foreground">{titleText}</p>
                              </div>
                              <p className="mt-1 pl-6 text-xs font-medium text-foreground/80">{scope}</p>
                              <p className="mt-0.5 pl-6 text-xs text-muted-foreground">{duration}</p>
                              {description ? (
                                <p className="mt-0.5 line-clamp-1 pl-6 text-xs text-muted-foreground">
                                  {description}
                                </p>
                              ) : null}
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-base font-extrabold text-foreground">
                                {formatMoney(option.price)}
                              </p>
                              {isSet && setRegular != null ? (
                                <p className="text-xs text-muted-foreground line-through">
                                  {formatMoney(setRegular)}
                                </p>
                              ) : null}
                            </div>
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
                disabled={Boolean(busyId)}
                onClick={pitchCta}
              >
                {busyId ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Starting checkout…
                  </>
                ) : (
                  pitchLabel
                )}
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
                  `Pay ${formatMoney(selected.price)}`
                ) : (
                  "Select an option"
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
