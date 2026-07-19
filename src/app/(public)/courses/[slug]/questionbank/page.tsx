import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
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
  const course = await courseService.getBySlug(slug);
  const programSlug = course?.programLinks?.[0]?.program?.slug;

  if (programSlug) {
    redirect(ROUTES.subjectQuestionbank(programSlug));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-foreground">Questionbank not linked</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This course does not include a subject program questionbank yet. Browse subject programs
        or ask your admin to link one in the course workspace.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild variant="outline">
          <Link href={ROUTES.courseDetail(slug)}>Back to course</Link>
        </Button>
        <Button asChild>
          <Link href={ROUTES.courses}>Browse subjects</Link>
        </Button>
      </div>
    </div>
  );
}
