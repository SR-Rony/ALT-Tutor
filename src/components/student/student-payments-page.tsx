"use client";

import Link from "next/link";
import { PageHeader, PageLoader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useStudentPayments } from "@/hooks";
import { formatMoney, formatShortDate } from "@/lib/format";
import type { ApiError } from "@/types";
import { cn } from "@/utils";

function statusClass(status: string) {
  const s = status.toUpperCase();
  if (s === "SUCCESS") return "bg-[#ecfdf3] text-accent-green";
  if (s === "FAILED" || s === "REFUNDED") return "bg-accent/10 text-accent";
  return "bg-muted text-muted-foreground";
}

export function StudentPaymentsPage() {
  const { data = [], isLoading, error, refetch } = useStudentPayments();

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
          description="Checkout history for paid courses."
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
                <th className="px-5 py-3 font-semibold">Course</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((payment) => (
                <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-4 font-semibold text-foreground">
                    {payment.course?.title ?? "Course"}
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
    </div>
  );
}
