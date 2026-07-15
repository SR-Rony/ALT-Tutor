import { QuestionbankStudyPage } from "@/components/public/questionbank/questionbank-study-page";

type PageProps = { params: Promise<{ programSlug: string; subtopicSlug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { subtopicSlug } = await params;
  return { title: `Study · ${subtopicSlug}` };
}

export default async function SubjectQuestionbankStudyRoute({ params }: PageProps) {
  const { programSlug, subtopicSlug } = await params;
  return <QuestionbankStudyPage programSlug={programSlug} subtopicSlug={subtopicSlug} />;
}
