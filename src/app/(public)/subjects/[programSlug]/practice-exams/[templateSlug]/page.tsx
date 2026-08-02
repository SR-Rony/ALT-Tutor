import { redirect } from "next/navigation";
import { ROUTES } from "@/constants";

type PageProps = {
  params: Promise<{ programSlug: string; templateSlug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { templateSlug } = await params;
  return {
    title: `Practice Exam · ${templateSlug}`,
  };
}

/** Detail/open page removed — send visitors straight to the take flow. */
export default async function PracticeExamDetailRoute({ params }: PageProps) {
  const { programSlug, templateSlug } = await params;
  redirect(ROUTES.subjectPracticeExamTake(programSlug, templateSlug));
}
