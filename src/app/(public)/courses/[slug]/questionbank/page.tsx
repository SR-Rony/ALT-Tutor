import type { Metadata } from "next";
import { QuestionbankPage } from "@/components/public/questionbank";
import { courseService } from "@/services";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await courseService.getBySlug(slug);
  const title = course ? `${course.title} Questionbank` : "Questionbank";
  return {
    title,
    description: course?.description ?? "Topic-sorted practice questions with explanations.",
  };
}

export default async function CourseQuestionbankRoute({ params }: PageProps) {
  const { slug } = await params;
  return <QuestionbankPage slug={slug} />;
}
