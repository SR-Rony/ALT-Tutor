"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Users } from "lucide-react";
import { ROUTES } from "@/constants";
import { formatCourseLevel, formatCoursePrice } from "@/lib/course-format";
import { richTextToPlain } from "@/lib/rich-text";
import type { CatalogCourse } from "@/types/course.types";
import { cn } from "@/utils";

type CourseCardProps = {
  course: CatalogCourse;
  className?: string;
};

export function CourseCard({ course, className }: CourseCardProps) {
  return (
    <Link
      href={ROUTES.courseDetail(course.slug)}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#1D4ED8] hover:shadow-md",
        className
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <BookOpen className="h-12 w-12 text-slate-400" aria-hidden />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-md border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700 shadow-sm">
          {formatCourseLevel(course.level)}
        </span>
        <span className="absolute bottom-3 right-3 inline-flex items-baseline gap-1.5 rounded-md bg-[#1D4ED8] px-2.5 py-1 text-xs font-bold text-white shadow-sm">
          {course.regularPrice && course.regularPrice > course.price ? (
            <span className="text-[10px] font-medium text-white/75 line-through">
              {formatCoursePrice(course.regularPrice)}
            </span>
          ) : null}
          {formatCoursePrice(course.price)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {course.category ? (
          <p className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
            {course.category.name}
          </p>
        ) : null}

        <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-900 transition-colors duration-200 group-hover:text-[#1D4ED8] sm:text-lg">
          {course.title}
        </h3>

        <p className="line-clamp-2 text-sm leading-relaxed text-slate-500">
          {course.summary?.trim() || richTextToPlain(course.description)}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs">
          <p className="truncate font-medium text-slate-600">{course.teacher.name}</p>
          <p className="inline-flex shrink-0 items-center gap-1 font-semibold text-slate-500">
            <Users className="h-3.5 w-3.5 text-[#1D4ED8]" aria-hidden />
            {course.studentsCount} enrolled
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-[#1D4ED8] transition-colors group-hover:bg-blue-50">
          <span>Enroll / View Course</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[16/10] animate-pulse bg-slate-100" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
        <div className="mt-auto flex justify-between border-t border-slate-100 pt-4">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-12 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-8 w-full animate-pulse rounded bg-slate-100" />
      </div>
    </div>
  );
}
