import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ROUTES } from "@/constants";
import { cn } from "@/utils";

const STATS = [
  {
    value: "10,000+",
    label: "Questions Solved",
    href: "#question-bank",
    hint: "Explore Question Bank",
  },
  {
    value: "500+",
    label: "Past Papers",
    href: ROUTES.courses,
    hint: "View Past Papers",
  },
  {
    value: "50+",
    label: "Live & Recorded Courses",
    href: "#courses",
    hint: "Browse LMS Courses",
  },
  {
    value: "5,000+",
    label: "Happy Students",
    href: "#testimonials",
    hint: "Read Student Reviews",
  },
] as const;

export function HomeStatsSection() {
  return (
    <section id="stats" className="w-full border-y border-slate-200 bg-[#F8FAFC] py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {STATS.map((stat, idx) => (
            <Link
              key={stat.label}
              href={stat.href}
              className={cn(
                "group relative flex flex-col items-center justify-center rounded-xl p-4 text-center transition-all duration-200 hover:bg-white hover:shadow-sm",
                idx !== 0 ? "lg:border-l lg:border-slate-200" : ""
              )}
            >
              <div className="flex items-center gap-1">
                <p className="text-3xl font-extrabold tracking-tight text-[#1D4ED8] transition-colors group-hover:text-blue-800 sm:text-4xl lg:text-[2.5rem] leading-none">
                  {stat.value}
                </p>
                <ArrowUpRight className="h-4 w-4 text-slate-300 opacity-0 transition-all group-hover:text-[#1D4ED8] group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-800 sm:text-sm">
                {stat.label}
              </p>
              <span className="mt-1 text-[11px] font-medium text-slate-400 group-hover:text-[#1D4ED8] transition-colors">
                {stat.hint} →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
