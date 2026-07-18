import { StudentCourseLearnPage } from "@/components/student/student-course-learn-page";

export const metadata = { title: "Course Player" };

type PageProps = { params: Promise<{ slug: string }> };

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <StudentCourseLearnPage slug={slug} />;
}
