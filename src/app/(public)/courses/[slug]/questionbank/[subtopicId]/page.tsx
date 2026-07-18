import type { Metadata } from "next";
import { CourseQuestionbankStudyPage } from "@/components/public/questionbank";
import { courseService } from "@/services";

type PageProps = { params: Promise<{ slug: string; subtopicId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await courseService.getBySlug(slug);
  const title = course ? `${course.title} · Study Set` : "Study Set";
  return {
    title,
    description: "Practice questions with instant feedback and explanations.",
  };
}

export default async function CourseQuestionbankStudyRoute({ params }: PageProps) {
  const { slug, subtopicId } = await params;
  return <CourseQuestionbankStudyPage slug={slug} subtopicId={subtopicId} />;
}
