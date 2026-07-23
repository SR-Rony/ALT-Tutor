import { Suspense } from "react";
import { PracticeExamTakePage } from "@/components/public/subjects/practice-exam-take-page";
import { PageLoader } from "@/components/shared";

type PageProps = {
  params: Promise<{ programSlug: string; templateSlug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { templateSlug } = await params;
  return { title: `Take exam · ${templateSlug}` };
}

export default async function PracticeExamTakeRoute({ params }: PageProps) {
  const { programSlug, templateSlug } = await params;
  return (
    <Suspense fallback={<PageLoader label="Starting exam..." />}>
      <PracticeExamTakePage programSlug={programSlug} templateSlug={templateSlug} />
    </Suspense>
  );
}
