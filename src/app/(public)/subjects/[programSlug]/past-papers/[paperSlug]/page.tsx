import { PastPaperDetailPage } from "@/components/public/subjects/past-paper-detail-page";

type PageProps = {
  params: Promise<{ programSlug: string; paperSlug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { paperSlug } = await params;
  return {
    title: `Past Paper · ${paperSlug}`,
  };
}

export default async function PastPaperDetailRoute({ params }: PageProps) {
  const { programSlug, paperSlug } = await params;
  return <PastPaperDetailPage programSlug={programSlug} paperSlug={paperSlug} />;
}
