import { SubjectResourcePage } from "@/components/public/subjects/subject-resource-page";

type PageProps = {
  params: Promise<{ programSlug: string; resourceSlug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { programSlug, resourceSlug } = await params;
  return {
    title: `${resourceSlug} · ${programSlug}`,
  };
}

export default async function SubjectResourceRoute({ params }: PageProps) {
  const { programSlug, resourceSlug } = await params;
  return <SubjectResourcePage programSlug={programSlug} resourceSlug={resourceSlug} />;
}
