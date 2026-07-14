import { AdminCourseCurriculumPage } from "@/components/admin/courses/admin-course-curriculum-page";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Course curriculum · ${id.slice(0, 8)}` };
}

export default async function AdminCourseCurriculumRoute({ params }: PageProps) {
  const { id } = await params;
  return <AdminCourseCurriculumPage courseId={id} />;
}
