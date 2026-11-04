"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { ROUTES } from "@/constants";
import { useCoursesCatalog } from "@/hooks";
import { CourseCard, CourseCardSkeleton } from "@/components/public/courses/course-card";
import { mockCourses } from "@/data/mock/courses.mock";

export function HomeFeaturedCourses() {
  const { data, isLoading } = useCoursesCatalog({ limit: 6 });
  const rawItems = data?.items && data.items.length > 0 ? data.items : mockCourses.slice(0, 6);

  return (
    <section className="w-full border-t border-slate-200 bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
              <Sparkles className="h-3.5 w-3.5" />
              Recorded &amp; Live Courses
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Master Your Syllabus with Expert Courses.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500">
              Complete recorded video lessons, chapter quizzes, and structured lecture notes designed by top mentors to help you ace your exams.
            </p>
          </div>

          <Link
            href={ROUTES.courses}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#1D4ED8] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800"
          >
            <span>Explore All Courses</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Courses Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))
          ) : rawItems.length > 0 ? (
            rawItems.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-4 text-base font-semibold text-slate-700">No courses available at the moment</p>
              <p className="mt-1 text-sm text-slate-500">New syllabus batches are launching soon!</p>
            </div>
          )}
        </div>

        {/* Bottom Banner for Easy Enrollment */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6 sm:flex-row sm:p-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Not sure which course is right for your curriculum?
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Filter by Cambridge, Edexcel, IB, SSC, or HSC to find matching video modules and study packs.
            </p>
          </div>
          <Link
            href={ROUTES.courses}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
          >
            Filter by Curriculum →
          </Link>
        </div>
      </div>
    </section>
  );
}

