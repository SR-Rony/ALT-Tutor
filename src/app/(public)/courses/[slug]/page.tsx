import type { Metadata } from "next";
import { CourseDetailView } from "@/components/public/courses";
import { courseService } from "@/services";

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await courseService.getBySlug(slug);
  if (!course) {
    return { title: "Course not found" };
  }
  return {
    title: course.title,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      images: course.thumbnail ? [{ url: course.thumbnail }] : undefined,
    },
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  return <CourseDetailView slug={slug} />;
}
