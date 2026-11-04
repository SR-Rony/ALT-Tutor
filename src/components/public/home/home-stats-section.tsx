import { cn } from "@/utils";

const STATS = [
  {
    value: "10,000+",
    label: "Questions Solved",
  },
  {
    value: "500+",
    label: "Past Papers",
  },
  {
    value: "50+",
    label: "Live Courses",
  },
  {
    value: "5,000+",
    label: "Happy Students",
  },
] as const;

export function HomeStatsSection() {
  return (
    <section className="w-full border-y border-slate-200 bg-[#F8FAFC] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-y-8 lg:grid-cols-4 lg:gap-y-0">
          {STATS.map((stat, idx) => (
            <div
              key={stat.label}
              className={cn(
                "flex flex-col items-center justify-center px-4 text-center sm:px-6",
                // Mobile 2x2: vertical divider between col 1 and col 2
                idx % 2 === 1 ? "border-l border-slate-200 lg:border-l-0" : "",
                // Desktop: vertical dividers between all 4 columns
                idx !== 0 ? "lg:border-l lg:border-slate-200" : ""
              )}
            >
              <p className="text-3xl font-extrabold tracking-tight text-[#1D4ED8] sm:text-4xl lg:text-[2.65rem] leading-none">
                {stat.value}
              </p>
              <p className="mt-2.5 text-xs font-medium text-slate-500 sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
