import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardCheck, FileText, Lightbulb } from "lucide-react";

const FEATURES = [
  {
    title: "Question Bank",
    description:
      "Thousands of topic-wise practice questions with step-by-step video solutions and mark schemes.",
    icon: BookOpen,
    href: "#question-bank",
    action: "Explore Question Bank",
  },
  {
    title: "Past Papers & Courses",
    description:
      "Complete collection of board and term past papers to master real exam formats and grading standards.",
    icon: FileText,
    href: "#courses",
    action: "Browse Syllabus Packs",
  },
  {
    title: "Custom Exam Builder",
    description:
      "Full-length timed mock exams mirroring official board papers with instant score evaluation.",
    icon: ClipboardCheck,
    href: "#custom-exam",
    action: "Generate Mock Exam",
  },
  {
    title: "Video Lessons & Concepts",
    description:
      "High-yield animated video notes, formula sheets, and core definitions for rapid, targeted review.",
    icon: Lightbulb,
    href: "#video-lessons",
    action: "Watch Free Lessons",
  },
] as const;

export function HomeCoreFeatures() {
  return (
    <section id="core-features" className="w-full bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
            Complete Learning Toolkit
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Everything You Need to Succeed
          </h2>
          <p className="mt-3 text-base text-slate-500 sm:text-lg">
            Four powerful tools in one unified platform to help you master every exam.
          </p>
        </div>

        {/* 4-Column Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#1D4ED8] hover:shadow-md"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#1D4ED8] transition-colors group-hover:bg-[#1D4ED8] group-hover:text-white">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-slate-900 transition-colors group-hover:text-[#1D4ED8]">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-[#1D4ED8]">
                  <span>{item.action}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
