import Link from "next/link";
import { BookOpen, ClipboardCheck, FileText, Lightbulb } from "lucide-react";
import { ROUTES } from "@/constants";

const FEATURES = [
  {
    title: "Question Bank",
    description:
      "Thousands of topic-wise practice questions with step-by-step video solutions and mark schemes.",
    icon: BookOpen,
    href: `${ROUTES.home}#question-bank`,
  },
  {
    title: "Past Papers",
    description:
      "Complete collection of board and term past papers to master real exam formats and grading standards.",
    icon: FileText,
    href: `${ROUTES.home}#past-papers`,
  },
  {
    title: "Practice Exams",
    description:
      "Full-length timed mock exams mirroring official board papers with instant score evaluation.",
    icon: ClipboardCheck,
    href: `${ROUTES.home}#practice-exams`,
  },
  {
    title: "Key Concepts",
    description:
      "High-yield revision notes, formula sheets, and core definitions for rapid, targeted exam review.",
    icon: Lightbulb,
    href: `${ROUTES.home}#key-concepts`,
  },
] as const;

export function HomeCoreFeatures() {
  return (
    <section id="features" className="w-full bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Everything You Need to Succeed
          </h2>
          <p className="mt-3 text-base text-slate-500 sm:text-lg">
            Four powerful tools in one platform to help you master your exams.
          </p>
        </div>

        {/* 4-Column Grid (1 col mobile, 2 col tablet, 4 col desktop, gap-6) */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-[#1D4ED8] hover:shadow-md"
              >
                <div>
                  {/* 48x48px Icon container with bg-blue-50 and primary blue icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1D4ED8]">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>

                  {/* Title */}
                  <h3 className="mt-4 text-lg font-semibold text-slate-900 transition-colors group-hover:text-[#1D4ED8]">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                </div>

                {/* Learn more link */}
                <div className="mt-6 pt-2">
                  <span className="inline-block text-sm font-medium text-[#1D4ED8] transition-transform duration-200 group-hover:translate-x-0.5">
                    Learn more &rarr;
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

