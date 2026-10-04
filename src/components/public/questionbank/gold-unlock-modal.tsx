"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  PlayCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES, queryKeys } from "@/constants";
import { useCheckout } from "@/hooks";
import { normalizeAccessBadge, tierBadgeClass, tierLabel } from "@/lib/access-tier";
import { formatDurationUntil, formatMoney } from "@/lib/format";
import { setPaymentReturnTo } from "@/lib/payment-return";
import { richTextToPlain } from "@/lib/rich-text";
import { studySetPrice, studySetRegularPrice } from "@/lib/study-set-pricing";
import { useAppSelector } from "@/store";
import type { ApiError } from "@/types";
import type { QbSubtopic } from "@/types/qb.types";
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
  /** Minimum access level that unlocks this content. */
  requiredTier?: string;
  /** When set and priced, the student buys just this study set. */
  studySet?: UnlockStudySet | null;
  /** Called after access is granted immediately (already entitled). */
  onUnlocked?: () => void;
  /** Where to return after sign-in (defaults to the questionbank). */
  returnPath?: string;
};

const theme = {
  hero: "from-[#fff7ed] via-[#fffbeb] to-white",
  accent: "text-[#b45309]",
  iconWrap: "bg-[#fef3c7] text-[#b45309]",
  cta: "!bg-none bg-[#d4a017] text-white shadow-none hover:!bg-[#b45309] hover:translate-y-0 hover:shadow-none",
  ring: "ring-[#d4a017]/40",
};

export function GoldUnlockModal({
  open,
  onClose,
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
  const checkout = useCheckout();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const required = normalizeAccessBadge(requiredTier);
  const requiredName = tierLabel(required);
  const setPrice = studySet ? studySetPrice(studySet) : null;
  const setRegular = studySet ? studySetRegularPrice(studySet) : null;
  const forSale = Boolean(studySet) && setPrice != null;
  const setTitle = studySet
    ? richTextToPlain(studySet.title) || studySet.title
    : subtopicTitle ?? null;

  const afterPayment = useMemo(() => {
    if (studySet && forSale) return ROUTES.subjectQuestionbankStudy(programSlug, studySet.slug);
    if (returnPathProp) return returnPathProp;
    return `${ROUTES.subjectQuestionbank(programSlug)}?unlocked=1`;
  }, [forSale, programSlug, returnPathProp, studySet]);

  const loginHref = `${ROUTES.auth.login}?next=${encodeURIComponent(afterPayment)}`;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(false);
  }, [open, studySet?.id]);

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

  const buyStudySet = async () => {
    if (!studySet || !forSale) return;
    if (!isAuthenticated) {
      window.location.href = loginHref;
      return;
    }

    setError(null);
    setBusy(true);
    setPaymentReturnTo(afterPayment);

    try {
      const result = await checkout.mutateAsync({ subtopicId: studySet.id });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      if (result.granted) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.questionbank.all });
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
      setBusy(false);
    }
  };

  if (!open) return null;

  const benefits = forSale
    ? [
        { icon: BookOpen, text: "Every question in this study set, across all papers" },
        { icon: FileText, text: "Mark schemes and worked solutions" },
        { icon: PlayCircle, text: "Video solutions and timed exam mode with scoring" },
      ]
    : [
        { icon: GraduationCap, text: `Enroll in a course linked to ${programName}` },
        { icon: BookOpen, text: "Gold questionbank sets, Key Concepts and Flashcards" },
        { icon: ClipboardList, text: "Practice Exams and Past Papers at the same level" },
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
              {setTitle ? (
                <>
                  Unlock <span className={theme.accent}>“{setTitle}”</span>
                </>
              ) : (
                <>
                  This is <span className={theme.accent}>{requiredName}</span> content
                </>
              )}
            </h2>
            {forSale && setPrice != null ? (
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
                {studySet
                  ? "This study set isn’t on sale yet."
                  : `Unlock it in ${programName} by enrolling in a linked course.`}
              </p>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {forSale ? "What you get:" : "How to unlock:"}
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
              {forSale ? (
                <>
                  This payment unlocks{" "}
                  <span className="font-semibold text-foreground">this study set only</span>. Each
                  Gold study set has its own price. After payment you return here automatically.
                </>
              ) : (
                <>
                  Gold questionbank sets are bought one at a time from the study set list. Other
                  Gold content opens with a linked course.
                </>
              )}
            </p>
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent">
              {error}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 border-t border-border px-5 py-4">
          {forSale && setPrice != null ? (
            <Button
              type="button"
              className={cn("w-full", theme.cta)}
              size="lg"
              disabled={busy}
              onClick={() => void buyStudySet()}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Starting checkout…
                </>
              ) : isAuthenticated ? (
                `Unlock this set · ${formatMoney(setPrice)}`
              ) : (
                `Sign in to unlock · ${formatMoney(setPrice)}`
              )}
            </Button>
          ) : (
            <Button asChild className={cn("w-full", theme.cta)} size="lg">
              <Link href={ROUTES.courses}>Browse courses</Link>
            </Button>
          )}
          <div className="flex items-center justify-between gap-2">
            {forSale ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={ROUTES.courses}>Or browse courses</Link>
              </Button>
            ) : !isAuthenticated ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={loginHref}>Already enrolled? Sign in</Link>
              </Button>
            ) : (
              <span />
            )}
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
