import { Suspense } from "react";
import { PaymentReturnPage } from "@/components/student/payment-return-page";
import { PageLoader } from "@/components/shared";

export default function PaymentsReturnRoute() {
  return (
    <Suspense fallback={<PageLoader label="Loading payment…" />}>
      <PaymentReturnPage />
    </Suspense>
  );
}
