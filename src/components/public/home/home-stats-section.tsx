import { BarChart3, BookOpen, GraduationCap, Users, type LucideIcon } from "lucide-react";
import { homeStats } from "./data/home.data";

const statIcons: Record<(typeof homeStats)[number]["icon"], LucideIcon> = {
  users: Users,
  book: BookOpen,
  graduation: GraduationCap,
  chart: BarChart3,
};

export function HomeStatsSection() {
  return (
    <section className="border-b border-border bg-section-muted">
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 lg:py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {homeStats.map((stat) => {
            const Icon = statIcons[stat.icon];
            return (
              <article
                key={stat.label}
                className="card-interactive group rounded-2xl border border-border bg-card p-6 text-center shadow-[0_8px_30px_rgba(26,26,46,0.04)] sm:text-left"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary transition-transform duration-300 group-hover:scale-110 sm:mx-0">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <p className="mt-4 text-3xl font-extrabold tracking-tight text-gradient-brand sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-sm font-medium text-muted-foreground">{stat.label}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
