import { TeacherCourseCurriculumPage } from "@/components/teacher/teacher-course-curriculum-page";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Curriculum · ${id.slice(0, 8)}` };
}

export default async function TeacherCourseCurriculumRoute({ params }: PageProps) {
  const { id } = await params;
  return <TeacherCourseCurriculumPage courseId={id} />;
}
