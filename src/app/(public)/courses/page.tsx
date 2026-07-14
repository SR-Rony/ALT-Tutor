import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants";
import { courseService } from "@/services";
import { PageHeader } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Courses" };

export default async function CoursesPage() {
  const courses = await courseService.getAll();

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <PageHeader title="Courses" description="Browse published courses from Alt Tutor." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Link key={course.id} href={ROUTES.courseDetail(course.slug)} className="group">
            <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
              {course.thumbnail ? (
                <div className="relative aspect-[16/9] bg-muted">
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <CardHeader>
                <p className="text-xs font-semibold text-primary">{course.category}</p>
                <CardTitle className="text-lg group-hover:text-primary">{course.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
                <p className="mt-3 text-sm font-semibold text-primary">
                  {course.price <= 0 ? "Free" : `৳${course.price.toLocaleString()}`}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {courses.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">No published courses yet.</p>
      ) : null}
    </section>
  );
}
