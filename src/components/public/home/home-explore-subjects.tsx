import Link from "next/link";
import {
  Atom,
  BookOpen,
  Calculator,
  Dna,
  FlaskConical,
  Monitor,
} from "lucide-react";
import { ROUTES } from "@/constants";

const SUBJECTS = [
  {
    name: "Math",
    icon: Calculator,
    href: `${ROUTES.courses}?subject=mathematics`,
  },
  {
    name: "Physics",
    icon: Atom,
    href: `${ROUTES.courses}?subject=physics`,
  },
  {
    name: "Chemistry",
    icon: FlaskConical,
    href: `${ROUTES.courses}?subject=chemistry`,
  },
  {
    name: "Biology",
    icon: Dna,
    href: `${ROUTES.courses}?subject=biology`,
  },
  {
    name: "ICT",
    icon: Monitor,
    href: `${ROUTES.courses}?subject=ict`,
  },
  {
    name: "English",
    icon: BookOpen,
    href: `${ROUTES.courses}?subject=english`,
  },
] as const;

export function HomeExploreSubjects() {
  return (
    <section className="w-full border-t border-slate-200 bg-[#F8FAFC] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Master Every Subject.
          </h2>
          <p className="mt-2 text-base text-slate-500 sm:text-lg">
            Select your curriculum and start practicing.
          </p>
        </div>

        {/* Subjects Grid: 6 columns on desktop, 3 on tablet, 2 on mobile */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {SUBJECTS.map((subject) => {
            const Icon = subject.icon;
            return (
              <Link
                key={subject.name}
                href={subject.href}
                className="group flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-5 text-center transition-all duration-200 hover:border-[#1D4ED8] hover:shadow-sm"
              >
                {/* Subject Icon Container */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-700 transition-colors group-hover:bg-blue-50 group-hover:text-[#1D4ED8]">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>

                {/* Subject Name */}
                <span className="mt-3 text-sm font-semibold text-slate-900 transition-colors group-hover:text-[#1D4ED8] sm:text-base">
                  {subject.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

