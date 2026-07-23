import { PracticeExamResultPage } from "@/components/public/subjects/practice-exam-result-page";

type PageProps = {
  params: Promise<{
    programSlug: string;
    templateSlug: string;
    attemptId: string;
  }>;
};

export async function generateMetadata() {
  return { title: "Exam result" };
}

export default async function PracticeExamResultRoute({ params }: PageProps) {
  const { programSlug, templateSlug, attemptId } = await params;
  return (
    <PracticeExamResultPage
      programSlug={programSlug}
      templateSlug={templateSlug}
      attemptId={attemptId}
    />
  );
}
