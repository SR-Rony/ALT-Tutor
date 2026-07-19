import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
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
  const course = await courseService.getBySlug(slug);
  const programSlug = course?.programLinks?.[0]?.program?.slug;

  if (programSlug) {
    redirect(ROUTES.subjectQuestionbankStudy(programSlug, subtopicId));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Questionbank not linked</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Link a subject program to this course to open the shared questionbank.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link href={ROUTES.courseDetail(slug)}>Back to course</Link>
      </Button>
    </div>
  );
}
