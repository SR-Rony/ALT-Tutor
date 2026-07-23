import { PracticeExamDetailPage } from "@/components/public/subjects/practice-exam-detail-page";

type PageProps = {
  params: Promise<{ programSlug: string; templateSlug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { templateSlug } = await params;
  return {
    title: `Practice Exam · ${templateSlug}`,
  };
}

export default async function PracticeExamDetailRoute({ params }: PageProps) {
  const { programSlug, templateSlug } = await params;
  return <PracticeExamDetailPage programSlug={programSlug} templateSlug={templateSlug} />;
}
