import { Suspense } from "react";
import { AdminQuestionbankPage } from "@/components/admin/questionbank";
import { PageLoader } from "@/components/shared";

export const metadata = { title: "Admin Questions" };

export default function AdminQuestionbankRoute() {
  return (
    <Suspense fallback={<PageLoader label="Loading questionbank..." />}>
      <AdminQuestionbankPage />
    </Suspense>
  );
}
