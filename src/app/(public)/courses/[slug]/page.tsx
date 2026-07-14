import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ROUTES } from "@/constants";
import { courseService } from "@/services";
import { Button } from "@/components/ui/button";

type CourseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = await courseService.getBySlug(slug);
  return {
    title: course?.title ?? "Course",
    description: course?.description,
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = await courseService.getBySlug(slug);
  if (!course) notFound();

  const priceLabel = course.price <= 0 ? "Free" : `৳${course.price.toLocaleString()}`;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold text-[#1877f2]">{course.category}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1a2b5e] sm:text-4xl">
            {course.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#64748b]">{course.description}</p>
          <p className="mt-4 text-sm text-[#475569]">
            Instructor: <span className="font-semibold text-[#1a2b5e]">{course.instructorName}</span>
          </p>
          <p className="mt-1 text-sm text-[#475569]">
            {course.studentsCount} student{course.studentsCount === 1 ? "" : "s"} enrolled
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <p className="text-2xl font-extrabold text-[#ef3239]">{priceLabel}</p>
            <Button asChild variant="default" size="pillLg">
              <Link href={ROUTES.login}>Enroll now</Link>
            </Button>
            <Button asChild variant="secondary" size="pillLg">
              <Link href={ROUTES.courses}>All courses</Link>
            </Button>
          </div>
        </div>

        <div className="relative aspect-[16/11] overflow-hidden rounded-2xl bg-[#e8edf5] shadow-[0_16px_40px_-16px_rgba(26,43,94,0.25)]">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
