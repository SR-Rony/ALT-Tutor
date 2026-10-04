"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import { ListPagination, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useClientPagination, useMyAccess, useStudentPayments } from "@/hooks";
import { addDays, formatAccessRemaining, formatMoney, formatShortDate } from "@/lib/format";
import { richTextToPlain } from "@/lib/rich-text";
import type { ApiError } from "@/types";
import type { StudentAccessGrant, StudentPayment } from "@/types/student-dashboard.types";
import { cn } from "@/utils";

function statusClass(status: string) {
  const s = status.toUpperCase();
  if (s === "SUCCESS") return "bg-[#ecfdf3] text-accent-green";
  if (s === "FAILED" || s === "REFUNDED") return "bg-accent/10 text-accent";
  return "bg-muted text-muted-foreground";
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
  const { data: grants = [], isLoading: grantsLoading } = useMyAccess();
  const { page, setPage, pageItems, total, totalPages, from, to } =
    useClientPagination(data);

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
            You haven’t unlocked any Gold content yet. Gold study sets are bought one at a time
            from each subject’s questionbank.
          </div>
        ) : (
          <ul className="space-y-2">
            {grants.map((grant) => (
              <AccessRow key={grant.id} grant={grant} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            <h2 className="text-lg font-bold text-foreground">Payment history</h2>
            <p className="text-sm text-muted-foreground">Course and study set purchases</p>
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
