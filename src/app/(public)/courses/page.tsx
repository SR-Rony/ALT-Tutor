import { courseService } from "@/services";
import { PageHeader } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Courses" };

export default async function CoursesPage() {
  const courses = await courseService.getAll();

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <PageHeader title="Courses" description="Public catalog powered by the service layer." />
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle>{course.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{course.description}</p>
              <p className="mt-3 text-sm font-semibold text-primary">${course.price}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
