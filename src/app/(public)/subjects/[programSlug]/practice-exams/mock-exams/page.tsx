import { MockExamsPage } from "@/components/public/subjects/mock-exams-page";

type PageProps = {
  params: Promise<{ programSlug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { programSlug } = await params;
  return {
    title: `Mock Exams · ${programSlug}`,
  };
}

export default async function MockExamsRoute({ params }: PageProps) {
  const { programSlug } = await params;
  return <MockExamsPage programSlug={programSlug} />;
}
