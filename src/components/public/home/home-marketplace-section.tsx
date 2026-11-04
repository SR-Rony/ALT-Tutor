import Link from "next/link";
import { ArrowRight, Check, Eye, Lock, Sparkles } from "lucide-react";
import { ROUTES } from "@/constants";

export function HomeMarketplaceSection() {
  return (
    <section className="w-full border-t border-slate-200 bg-[#F8FAFC] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
          
          {/* Left Column: UI Mockup of a Question Card */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            {/* Browser-like frame container */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" aria-hidden />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" aria-hidden />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" aria-hidden />
                </div>
                <span className="text-xs font-medium text-slate-500">
                  Question Bank • Item #1042
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1D4ED8]">
                  <Sparkles className="h-3 w-3" />
                  Premium
                </span>
              </div>

              {/* Question Card Content */}
              <div className="mt-4 space-y-4">
                {/* Badges: Hard + Subject tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Badge Hard: bg-red-100 text-red-600 */}
                    <span className="rounded-md bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">
                      Hard
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      SSC Higher Math • Algebra
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">CQ • 4 Marks</span>
                </div>

                {/* Question Text */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-medium leading-relaxed text-slate-700">
                    Find the value of <span className="font-mono font-semibold text-slate-900">x</span> in the equation{" "}
                    <span className="font-mono font-semibold text-slate-900">2^(2x+1) - 9(2^x) + 4 = 0</span> and verify all real roots under the domain condition.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span className="rounded bg-white px-2 py-0.5 border border-slate-200">
                      Step-by-step video (4m 45s)
                    </span>
                    <span className="rounded bg-white px-2 py-0.5 border border-slate-200">
                      Full Mark Scheme
                    </span>
                  </div>
                </div>

                {/* Price and Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div>
                    <span className="text-xs text-slate-500">Unlock Price</span>
                    <p className="text-base font-bold text-slate-900 sm:text-lg">
                      5 Credits
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Secondary button: View Solution */}
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                      <span>View Solution</span>
                    </button>

                    {/* Primary Blue Button: Buy Now */}
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D4ED8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1E40AF]"
                    >
                      <Lock className="h-3.5 w-3.5" aria-hidden />
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right Column: Text & Features */}
          <div className="max-w-xl text-left">
            {/* Small badge: Pay-Per-Question */}
            <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-700">
              Pay-Per-Question
            </span>

            {/* Heading */}
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Buy Only What You Need.
            </h2>

            {/* Description */}
            <p className="mt-4 text-base leading-relaxed text-slate-500">
              Don&apos;t want a full subscription? No problem. Browse our Question Bank and purchase individual questions with detailed video solutions using your credits.
            </p>

            {/* Checkmark List */}
            <ul className="mt-6 space-y-3">
              <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1D4ED8]">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                Pick any topic or difficulty
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1D4ED8]">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                Instant access to video solutions
              </li>
              <li className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1D4ED8]">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                No monthly commitment
              </li>
            </ul>

            {/* CTA Button: Solid Primary Blue */}
            <div className="mt-6">
              <Link
                href={ROUTES.courses}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#1E40AF]"
              >
                <span>Browse Question Bank</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

