"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, KeyRound, Loader2, ShoppingBag } from "lucide-react";
import { ListPagination, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import {
  useAccessProducts,
  useCheckout,
  useClientPagination,
  useMyAccess,
  useStudentPayments,
  useSubjectsMenu,
} from "@/hooks";
import {
  accessTierRank,
  normalizeAccessBadge,
  tierBadgeClass,
  tierLabel,
} from "@/lib/access-tier";
import {
  addDays,
  formatAccessRemaining,
  formatDurationUntil,
  formatMoney,
  formatShortDate,
} from "@/lib/format";
import { richTextToPlain } from "@/lib/rich-text";
import type { ApiError } from "@/types";
import type {
  AccessProduct,
  StudentAccessGrant,
  StudentPayment,
} from "@/types/student-dashboard.types";
import { cn } from "@/utils";

type ProgramOption = { id: string; name: string; subjectName: string };

function statusClass(status: string) {
  const s = status.toUpperCase();
  if (s === "SUCCESS") return "bg-[#ecfdf3] text-accent-green";
  if (s === "FAILED" || s === "REFUNDED") return "bg-accent/10 text-accent";
  return "bg-muted text-muted-foreground";
}

function tierAccent(tier?: string | null) {
  const key = normalizeAccessBadge(tier);
  if (key === "GOLD") {
    return {
      bar: "from-[#b45309] to-[#d4a017]",
      soft: "bg-[#fffbeb]",
      ring: "hover:border-[#d4a017]/45",
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
  if (key === "GOLD") return ["Free", "Gold"];
  return ["Free"];
}

function programLabel(program?: { name: string; subject?: { name: string } | null } | null) {
  if (!program) return null;
  const subject = program.subject?.name;
  return subject && subject !== program.name ? `${subject} · ${program.name}` : program.name;
}

/** Purchase date and expiry for one payment row. */
function paymentDates(payment: StudentPayment) {
  const success = String(payment.status).toUpperCase() === "SUCCESS";
  const purchasedAt = payment.paidAt ?? payment.fulfilledAt ?? payment.createdAt;
  if (!success) return { purchasedAt, expires: null as string | null };
  if (payment.accessExpiresAt) return { purchasedAt, expires: formatShortDate(payment.accessExpiresAt) };
  const days = payment.accessProduct?.durationDays;
  if (days) {
    return {
      purchasedAt,
      expires: formatShortDate(addDays(days, new Date(purchasedAt)).toISOString()),
    };
  }
  return { purchasedAt, expires: "Lifetime" };
}

function PassCard({
  product,
  programName,
  busy,
  disabled,
  onBuy,
}: {
  product: AccessProduct;
  programName: string | null;
  busy: boolean;
  disabled: boolean;
  onBuy: () => void;
}) {
  const tier = product.tier ?? "GOLD";
  const accent = tierAccent(tier);
  const price = Number(product.price);
  const regular = product.regularPrice != null ? Number(product.regularPrice) : null;
  const hasDiscount = regular != null && Number.isFinite(regular) && regular > price;
  const scope = product.program?.name || programName;
  const blurb =
    richTextToPlain(product.description) ||
    `Unlocks ${unlockedTiers(tier).join(" + ")} sets for one subject.`;

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
            Per subject
          </span>
        </div>

        <h3 className="mt-2.5 line-clamp-2 text-base font-bold leading-snug text-foreground">
          {product.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {blurb}
        </p>

        <div className={cn("mt-3 rounded-xl px-3 py-2.5", accent.soft)}>
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
          <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {formatDurationUntil(product.durationDays)}
          </p>
        </div>

        <p className="mt-2.5 text-[11px] font-medium text-muted-foreground">
          {scope ? (
            <>
              Unlocks <span className="font-semibold text-foreground">{scope}</span> only
            </>
          ) : (
            "Choose a subject above to buy"
          )}
        </p>

        <Button
          type="button"
          size="sm"
          className="mt-3 w-full"
          disabled={disabled || !scope}
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

function AccessRow({ grant }: { grant: StudentAccessGrant }) {
  const remaining = formatAccessRemaining(grant.expiresAt);
  const active = grant.isActive && !remaining.expired;
  const studySet = grant.source === "STUDY_SET" ? grant.subtopic : null;
  const subject =
    programLabel(grant.program) ??
    (grant.source === "ADMIN_GRANT" ? "All subjects" : "Subject removed");
  const heading = studySet ? richTextToPlain(studySet.title) || studySet.title : subject;

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {studySet && active ? (
            <Link
              href={ROUTES.subjectQuestionbankStudy(studySet.programSlug, studySet.slug)}
              className="truncate font-semibold text-foreground hover:text-primary hover:underline"
            >
              {heading}
            </Link>
          ) : (
            <p className="truncate font-semibold text-foreground">{heading}</p>
          )}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              active ? "bg-[#ecfdf3] text-accent-green" : "bg-muted text-muted-foreground"
            )}
          >
            {active ? "Active" : "Expired"}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {studySet
            ? `Single Gold study set · ${subject}`
            : grant.source === "ADMIN_GRANT"
            ? "Granted by admin"
            : grant.source === "COURSE"
              ? `Included with course: ${grant.course?.title ?? "linked course"}`
              : grant.product?.title ?? "Gold Pass"}
        </p>
      </div>
      <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-0.5 text-xs sm:text-right">
        <dt className="text-muted-foreground">Purchased</dt>
        <dt className="text-muted-foreground">Expires</dt>
        <dd className="font-semibold text-foreground">{formatShortDate(grant.purchasedAt)}</dd>
        <dd className={cn("font-semibold", active ? "text-foreground" : "text-accent")}>
          {grant.expiresAt ? formatShortDate(grant.expiresAt) : "Lifetime"}
        </dd>
        {active && remaining.daysLeft != null ? (
          <dd className="col-span-2 text-[11px] text-muted-foreground">
            {remaining.daysLeft} day{remaining.daysLeft === 1 ? "" : "s"} left
          </dd>
        ) : null}
      </dl>
    </li>
  );
}

export function StudentPaymentsPage() {
  const { data = [], isLoading, error, refetch } = useStudentPayments();
  const { data: products = [], isLoading: productsLoading } = useAccessProducts();
  const { data: grants = [], isLoading: grantsLoading, refetch: refetchGrants } = useMyAccess();
  const { data: menu = [] } = useSubjectsMenu();
  const checkout = useCheckout();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [programId, setProgramId] = useState("");
  const { page, setPage, pageItems, total, totalPages, from, to } =
    useClientPagination(data);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const tierDiff = accessTierRank(a.tier) - accessTierRank(b.tier);
      if (tierDiff !== 0) return tierDiff;
      return Number(a.price) - Number(b.price);
    });
  }, [products]);

  const programOptions = useMemo<ProgramOption[]>(
    () =>
      menu.flatMap((category) =>
        category.subjects.flatMap((subject) =>
          subject.programs
            .filter((program) => program.isActive !== false)
            .map((program) => ({ id: program.id, name: program.name, subjectName: subject.name }))
        )
      ),
    [menu]
  );
  const selectedProgram = programOptions.find((p) => p.id === programId) ?? null;

  const buyPass = async (product: AccessProduct) => {
    const targetProgramId = product.programId ?? programId;
    if (!targetProgramId) {
      setCheckoutError("Choose the subject you want to unlock first.");
      return;
    }
    setCheckoutError(null);
    setBusyProductId(product.id);
    try {
      const result = await checkout.mutateAsync({
        accessProductId: product.id,
        programId: targetProgramId,
      });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      if (result.granted) {
        void refetch();
        void refetchGrants();
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
        <PageLoader label="Loading payments..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="text-sm text-accent">
          {(error as unknown as ApiError)?.message || "Failed to load"}
          <button type="button" className="ml-2 underline" onClick={() => void refetch()}>
            Retry
          </button>
        </p>
      ) : null}

      <section className="space-y-3">
        <div className="px-1">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <KeyRound className="h-4 w-4 text-[#b45309]" aria-hidden />
            My Gold access
          </h2>
          <p className="text-sm text-muted-foreground">
            Subjects and study sets you’ve unlocked — each unlock runs from its purchase date until
            it expires.
          </p>
        </div>
        {grantsLoading ? (
          <PageLoader label="Loading access..." />
        ) : grants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-center text-sm text-muted-foreground">
            You haven’t unlocked any Gold content yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {grants.map((grant) => (
              <AccessRow key={grant.id} grant={grant} />
            ))}
          </ul>
        )}
      </section>

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
              <h2 className="mt-1 text-xl font-bold text-foreground">Gold Pass</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Gold is bought separately for each subject — a pass only unlocks the subject you
                choose.
              </p>
            </div>
            <label className="flex w-full flex-col gap-1 text-xs font-semibold text-muted-foreground sm:w-72">
              Subject to unlock
              <select
                value={programId}
                onChange={(event) => {
                  setProgramId(event.target.value);
                  setCheckoutError(null);
                }}
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Choose a subject…</option>
                {programOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.subjectName === option.name
                      ? option.name
                      : `${option.subjectName} · ${option.name}`}
                  </option>
                ))}
              </select>
            </label>
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
              No Gold Pass product is available yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sortedProducts.map((product) => (
                <PassCard
                  key={product.id}
                  product={product}
                  programName={selectedProgram?.name ?? null}
                  busy={busyProductId === product.id}
                  disabled={Boolean(busyProductId)}
                  onBuy={() => void buyPass(product)}
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
            <p className="text-sm text-muted-foreground">
              Course, Gold Pass and study set purchases
            </p>
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
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Item</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Purchased</th>
                    <th className="px-5 py-3 font-semibold">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((payment) => {
                    const { purchasedAt, expires } = paymentDates(payment);
                    const subject = programLabel(payment.program);
                    return (
                      <tr
                        key={payment.id}
                        className="border-b border-border/70 last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-foreground">
                            {payment.accessProduct?.title ??
                              payment.course?.title ??
                              (payment.subtopic
                                ? richTextToPlain(payment.subtopic.title) || payment.subtopic.title
                                : "Purchase")}
                          </p>
                          {payment.subtopic && !payment.accessProduct && !payment.course ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              Gold study set{subject ? ` · ${subject}` : ""}
                            </p>
                          ) : null}
                          {payment.accessProduct ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {subject ? `Subject: ${subject}` : "Subject not recorded"}
                            </p>
                          ) : null}
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
                          {formatShortDate(purchasedAt)}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{expires ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ListPagination
              page={page}
              totalPages={totalPages}
              total={total}
              from={from}
              to={to}
              onPageChange={setPage}
              label="payments"
            />
          </div>
        )}
      </section>
    </div>
  );
}
