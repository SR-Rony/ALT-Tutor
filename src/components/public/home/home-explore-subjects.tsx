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
    name: "Mathematics",
    count: "2,450+ Questions",
    icon: Calculator,
    href: `${ROUTES.courses}?search=math`,
  },
  {
    name: "Physics",
    count: "1,820+ Questions",
    icon: Atom,
    href: `${ROUTES.courses}?search=physics`,
  },
  {
    name: "Chemistry",
    count: "1,640+ Questions",
    icon: FlaskConical,
    href: `${ROUTES.courses}?search=chem`,
  },
  {
    name: "Biology",
    count: "1,290+ Questions",
    icon: Dna,
    href: `${ROUTES.courses}?search=biology`,
  },
  {
    name: "ICT",
    count: "980+ Questions",
    icon: Monitor,
    href: `${ROUTES.courses}?search=ict`,
  },
  {
    name: "English",
    count: "1,150+ Questions",
    icon: BookOpen,
    href: `${ROUTES.courses}?search=english`,
  },
] as const;

export function HomeExploreSubjects() {
  return (
    <section id="subjects" className="w-full border-t border-slate-200 bg-[#F8FAFC] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Master Every Subject.
          </h2>
          <p className="mt-2 text-base text-slate-500 sm:text-lg">
            Choose your subject to explore chapter-wise questions, video lessons, and mock exams.
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
                className="group flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-5 text-center transition-all duration-200 hover:border-[#1D4ED8] hover:shadow-md"
              >
                {/* Subject Icon Container */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-700 transition-colors group-hover:bg-blue-50 group-hover:text-[#1D4ED8]">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>

                {/* Subject Name */}
                <span className="mt-3 text-sm font-semibold text-slate-900 transition-colors group-hover:text-[#1D4ED8] sm:text-base">
                  {subject.name}
                </span>

                {/* Count badge */}
                <span className="mt-1 text-xs text-slate-400 group-hover:text-slate-600">
                  {subject.count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
