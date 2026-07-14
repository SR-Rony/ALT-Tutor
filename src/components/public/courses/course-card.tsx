"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Users } from "lucide-react";
import { ROUTES } from "@/constants";
import { formatCourseLevel, formatCoursePrice } from "@/lib/course-format";
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
        "group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_-14px_rgba(26,43,94,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_44px_-16px_rgba(239,50,57,0.22)]",
        className
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#93c5fd] via-[#60a5fa] to-[#2563eb]">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-white/80" aria-hidden />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2b5e]/55 via-transparent to-transparent opacity-80" />
        <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1877f2] shadow-sm">
          {formatCourseLevel(course.level)}
        </span>
        <span className="absolute bottom-3 right-3 rounded-md bg-[#ef3239] px-2.5 py-1 text-xs font-bold text-white shadow-sm">
          {formatCoursePrice(course.price)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-4 sm:px-5 sm:py-5">
        {course.category ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1877f2]">
            {course.category.name}
          </p>
        ) : null}

        <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#1a2b5e] transition-colors duration-300 group-hover:text-[#ef3239] sm:text-lg">
          {course.title}
        </h3>

        <p className="line-clamp-2 text-sm leading-relaxed text-[#64748b]">{course.description}</p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#eef2f8] pt-3.5">
          <p className="truncate text-sm font-medium text-[#475569]">{course.teacher.name}</p>
          <p className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#64748b]">
            <Users className="h-3.5 w-3.5 text-[#1877f2]" aria-hidden />
            {course.studentsCount}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="aspect-[16/10] animate-pulse bg-[#e8edf5]" />
      <div className="flex flex-1 flex-col gap-3 px-5 py-5">
        <div className="h-3 w-24 animate-pulse rounded bg-[#e8edf5]" />
        <div className="h-5 w-full animate-pulse rounded bg-[#e8edf5]" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-[#e8edf5]" />
        <div className="mt-auto flex justify-between border-t border-[#eef2f8] pt-3.5">
          <div className="h-4 w-28 animate-pulse rounded bg-[#e8edf5]" />
          <div className="h-4 w-10 animate-pulse rounded bg-[#e8edf5]" />
        </div>
      </div>
    </div>
  );
}
