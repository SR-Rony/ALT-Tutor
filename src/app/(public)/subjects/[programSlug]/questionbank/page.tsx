import { QuestionbankOverviewPage } from "@/components/public/questionbank/questionbank-overview-page";

type PageProps = { params: Promise<{ programSlug: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { programSlug } = await params;
  return { title: `Questionbank · ${programSlug}` };
}

export default async function SubjectQuestionbankRoute({ params }: PageProps) {
  const { programSlug } = await params;
  return <QuestionbankOverviewPage programSlug={programSlug} />;
}
