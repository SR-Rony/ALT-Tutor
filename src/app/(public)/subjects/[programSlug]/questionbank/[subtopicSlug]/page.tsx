import { QuestionbankStudyPage } from "@/components/public/questionbank/questionbank-study-page";

type PageProps = {
  params: Promise<{ programSlug: string; subtopicSlug: string }>;
  searchParams: Promise<{ mode?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { subtopicSlug } = await params;
  return { title: `Study · ${subtopicSlug}` };
}

export default async function SubjectQuestionbankStudyRoute({ params, searchParams }: PageProps) {
  const search = await searchParams;
  const { programSlug, subtopicSlug } = await params;
  const examMode = search.mode === "exam";
  return <QuestionbankStudyPage programSlug={programSlug} subtopicSlug={subtopicSlug} examMode={examMode} />;
}
