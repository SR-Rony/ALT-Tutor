import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/constants";

export function HomeFinalCta() {
  return (
    <section className="w-full bg-[#1D4ED8] py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Heading */}
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Ready to ace your next exam?
          </h2>

          {/* Subtext */}
          <p className="mt-3 text-lg text-blue-100 sm:text-xl">
            Join thousands of students succeeding with Alt Tutor.
          </p>

          {/* CTA Button: Solid Amber (#F59E0B) */}
          <div className="mt-8">
            <Link
              href={ROUTES.auth.register}
              className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-8 py-4 text-base sm:text-lg font-bold text-slate-900 shadow-md transition-colors hover:bg-amber-500"
            >
              <span>Start Practicing Now</span>
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

