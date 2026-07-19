"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useConfirmStubPayment, usePaymentByTransaction } from "@/hooks";
import { formatMoney } from "@/lib/format";
import type { ApiError } from "@/types";

export function PaymentReturnPage() {
  const params = useSearchParams();
  const transactionId = params.get("transactionId") ?? "";
  const statusHint = (params.get("status") ?? "pending").toLowerCase();

  const { data: payment, isLoading, error, refetch } = usePaymentByTransaction(
    transactionId || undefined
  );
  const confirmStub = useConfirmStubPayment();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!payment?.transactionId) return;
    if (payment.provider !== "stub") return;
    if (String(payment.status).toUpperCase() !== "PENDING") return;
    if (statusHint !== "pending") return;
  }, [payment, statusHint]);

  const onConfirm = async (status: "SUCCESS" | "FAILED" | "CANCELLED") => {
    if (!transactionId) return;
    setActionError(null);
    try {
      await confirmStub.mutateAsync({ transactionId, status });
      await refetch();
    } catch (err) {
      setActionError((err as ApiError)?.message || "Could not confirm payment");
    }
  };

  const resolvedStatus = String(payment?.status ?? statusHint).toUpperCase();
  const fulfilled = Boolean(payment?.fulfilledAt);
  const isSuccess = resolvedStatus === "SUCCESS" && (fulfilled || payment?.provider === "stub");
  const isFailed =
    resolvedStatus === "FAILED" ||
    resolvedStatus === "CANCELLED" ||
    resolvedStatus === "REFUNDED";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <h1 className="text-2xl font-bold text-foreground">Payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {transactionId
            ? `Transaction ${transactionId.slice(0, 8)}…`
            : "Missing transaction reference."}
        </p>

        {isLoading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking payment status…
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-accent">
            {(error as unknown as ApiError)?.message || "Unable to load payment"}
          </p>
        ) : null}

        {payment ? (
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <span className="font-semibold">Amount:</span> {formatMoney(Number(payment.amount))}
            </p>
            <p>
              <span className="font-semibold">Item:</span>{" "}
              {payment.course?.title ?? payment.accessProduct?.title ?? "—"}
            </p>
            <p>
              <span className="font-semibold">Status:</span> {resolvedStatus}
              {fulfilled ? " · fulfilled" : ""}
            </p>
          </div>
        ) : null}

        {isSuccess ? (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 rounded-xl bg-[#ecfdf3] px-3 py-2 text-sm font-semibold text-accent-green">
              <CheckCircle2 className="h-4 w-4" />
              Payment confirmed. Access granted.
            </div>
            <div className="flex flex-wrap gap-2">
              {payment?.course?.slug ? (
                <Button asChild>
                  <Link href={ROUTES.student.courseLearn(payment.course.slug)}>Go to course</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href={ROUTES.student.practicePass}>Practice Pass</Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href={ROUTES.student.payments}>Payment history</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {isFailed ? (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 rounded-xl bg-accent/10 px-3 py-2 text-sm font-semibold text-accent">
              <XCircle className="h-4 w-4" />
              Payment was not completed.
            </div>
            <Button asChild variant="outline">
              <Link href={ROUTES.student.payments}>Back to payments</Link>
            </Button>
          </div>
        ) : null}

        {payment &&
        String(payment.status).toUpperCase() === "PENDING" &&
        payment.provider === "stub" ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Stub gateway (dev): confirm the payment to run the signed webhook + atomic
              fulfillment path.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={confirmStub.isPending}
                onClick={() => void onConfirm("SUCCESS")}
              >
                {confirmStub.isPending ? "Confirming…" : "Simulate success"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={confirmStub.isPending}
                onClick={() => void onConfirm("FAILED")}
              >
                Simulate fail
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={confirmStub.isPending}
                onClick={() => void onConfirm("CANCELLED")}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {payment &&
        String(payment.status).toUpperCase() === "PENDING" &&
        payment.provider !== "stub" ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Waiting for the payment provider to confirm… This page refreshes automatically.
          </p>
        ) : null}

        {actionError ? <p className="mt-3 text-sm text-accent">{actionError}</p> : null}
      </div>
    </div>
  );
}
