import { PastPaperResultPage } from "@/components/public/subjects/past-paper-result-page";

type PageProps = {
  params: Promise<{ programSlug: string; paperSlug: string; attemptId: string }>;
};

export default async function PastPaperResultRoute({ params }: PageProps) {
  const { programSlug, paperSlug, attemptId } = await params;
  return (
    <PastPaperResultPage
      programSlug={programSlug}
      paperSlug={paperSlug}
      attemptId={attemptId}
    />
  );
}
