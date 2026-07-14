import { Suspense } from "react";
import { CoursesCatalogPage } from "@/components/public/courses";

export const metadata = {
  title: "Courses",
  description: "Browse published Alt Tutor courses by category and level.",
};

export default function CoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[#64748b]">
          Loading courses…
        </div>
      }
    >
      <CoursesCatalogPage />
    </Suspense>
  );
}
