import { Suspense } from "react";
import { PastPaperTakePage } from "@/components/public/subjects/past-paper-take-page";
import { PageLoader } from "@/components/shared";

type PageProps = {
  params: Promise<{ programSlug: string; paperSlug: string }>;
};

export default async function PastPaperTakeRoute({ params }: PageProps) {
  const { programSlug, paperSlug } = await params;
  return (
    <Suspense fallback={<PageLoader label="Starting past paper..." />}>
      <PastPaperTakePage programSlug={programSlug} paperSlug={paperSlug} />
    </Suspense>
  );
}
