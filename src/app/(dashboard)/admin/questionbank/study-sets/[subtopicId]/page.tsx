import { Suspense } from "react";
import { AdminQbStudySetPage } from "@/components/admin/questionbank/admin-qb-study-set-page";
import { PageLoader } from "@/components/shared";

export const metadata = { title: "Admin Study Set" };

type Props = { params: Promise<{ subtopicId: string }> };

export default async function AdminQbStudySetRoute({ params }: Props) {
  const { subtopicId } = await params;
  return (
    <Suspense fallback={<PageLoader label="Loading study set..." />}>
      <AdminQbStudySetPage subtopicId={subtopicId} />
    </Suspense>
  );
}
