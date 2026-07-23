import { KeyConceptLessonPage } from "@/components/public/subjects/key-concept-lesson-page";

type PageProps = {
  params: Promise<{ programSlug: string; lessonSlug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { lessonSlug } = await params;
  return { title: `Key Concept · ${lessonSlug}` };
}

export default async function KeyConceptLessonRoute({ params }: PageProps) {
  const { programSlug, lessonSlug } = await params;
  return <KeyConceptLessonPage programSlug={programSlug} lessonSlug={lessonSlug} />;
}
