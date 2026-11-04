import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "This platform helped me increase my Math grade from B to A+. The video solutions are a lifesaver whenever I get stuck on tricky board questions.",
    name: "Tanvir Ahmed",
    batch: "SSC Batch 2025",
    initials: "TA",
  },
  {
    quote:
      "The custom exam builder allowed me to test myself chapter by chapter. The immediate mark scheme and step hints made revision so much faster!",
    name: "Nusrat Jahan",
    batch: "HSC Batch 2025",
    initials: "NJ",
  },
  {
    quote:
      "Buying individual past paper questions without being forced into an expensive subscription saved me so much money. Alt Tutor is unmatched.",
    name: "Sabbir Hossain",
    batch: "SSC Batch 2025",
    initials: "SH",
  },
] as const;

export function HomeTestimonials() {
  return (
    <section className="w-full border-t border-slate-200 bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            What Our Students Say
          </h2>
          <p className="mt-2 text-base text-slate-500 sm:text-lg mb-12">
            Real feedback from learners who study with Alt Tutor.
          </p>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.name}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm transition-all duration-200 hover:border-[#1D4ED8] hover:shadow-md"
            >
              <div>
                {/* 5 Solid Amber Star Icons (#F59E0B) */}
                <div className="flex items-center gap-1 text-[#F59E0B]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="mt-4 text-sm leading-relaxed text-slate-700 italic sm:text-base">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              {/* Bottom Row: Avatar, Student Name, Batch */}
              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                {/* Solid initial block in Primary Blue (#1D4ED8) */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1D4ED8] text-sm font-bold text-white shadow-sm">
                  {item.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.batch}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

