import { homeStats } from "./data/home.data";

export function HomeStatsSection() {
  return (
    <section aria-hidden className="border-b border-border bg-section-muted pt-16 md:pt-20 lg:pt-24">
      <div className="mx-auto max-w-7xl px-4 pb-14 md:px-6 lg:pb-16">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
          {homeStats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl border border-border bg-card p-6 text-center shadow-[0_8px_30px_rgba(26,26,46,0.04)] lg:hidden"
            >
              <p
                className="text-2xl font-extrabold tracking-tight sm:text-3xl"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
              <p className="mt-1.5 text-sm font-medium text-muted-foreground">{stat.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
