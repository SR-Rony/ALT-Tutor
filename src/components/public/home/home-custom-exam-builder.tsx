import Link from "next/link";
import { ArrowRight, ChevronDown, SlidersHorizontal, Zap } from "lucide-react";
import { ROUTES } from "@/constants";

export function HomeCustomExamBuilder() {
  return (
    <section className="w-full border-t border-slate-200 bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
          
          {/* Left Column: Text */}
          <div className="max-w-xl text-left">
            {/* Small badge: Custom Exams */}
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
              Custom Exams
            </span>

            {/* Heading */}
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Build Your Own Exam.
            </h2>

            {/* Description */}
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              Choose your topic, select the difficulty level, and generate a custom exam in seconds. Practice exactly what you need to focus on.
            </p>

            {/* CTA Button: Solid Primary Blue */}
            <div className="mt-6">
              <Link
                href={ROUTES.auth.register}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#1E40AF]"
              >
                <span>Try It Now</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          {/* Right Column: UI Mockup (Filter Card inside browser-like frame) */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            {/* Floating Flat Badge on top right corner: ⚡ Instant Exam */}
            <div className="absolute -top-3.5 -right-2 z-10 flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-800 shadow-sm">
              <Zap className="h-3.5 w-3.5 fill-current text-[#F59E0B]" />
              <span>Instant Exam</span>
            </div>

            {/* Browser-like frame container */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" aria-hidden />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" aria-hidden />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" aria-hidden />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Exam Generator Console</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  SSC / HSC
                </span>
              </div>

              {/* Filter Card Body */}
              <div className="mt-5 space-y-4">
                
                {/* Field 1: Subject */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Subject
                  </label>
                  <div className="mt-1.5 flex items-center justify-between rounded-md border border-slate-300 bg-slate-50/50 p-2 text-sm font-medium text-slate-800">
                    <span>Mathematics</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Field 2: Topic */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Topic
                  </label>
                  <div className="mt-1.5 flex items-center justify-between rounded-md border border-slate-300 bg-slate-50/50 p-2 text-sm font-medium text-slate-800">
                    <span>Algebra</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Field 3: Difficulty */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Difficulty
                  </label>
                  <div className="mt-1.5 flex items-center justify-between rounded-md border border-slate-300 bg-slate-50/50 p-2 text-sm font-medium text-slate-800">
                    <span className="font-semibold text-red-600">Hard</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Exam Settings Summary */}
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <span>Questions: <strong className="text-slate-800">25 MCQs + 3 CQs</strong></span>
                  <span>Time Limit: <strong className="text-slate-800">45 Mins</strong></span>
                </div>

                {/* Button: Solid Amber (#F59E0B) */}
                <button
                  type="button"
                  className="w-full rounded-xl bg-[#F59E0B] py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#D97706]"
                >
                  Generate Exam
                </button>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

