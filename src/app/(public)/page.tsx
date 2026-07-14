import Link from "next/link";
import { GraduationCap, LayoutDashboard, ShieldCheck } from "lucide-react";
import { ROUTES } from "@/constants";
import { HomeHero, HomeStatsSection } from "@/components/public/home";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const roles = [
  {
    title: "Students",
    description: "Enroll in courses, track progress, earn certificates, and join live sessions.",
    icon: GraduationCap,
    href: ROUTES.auth.login,
    cta: "Start learning",
  },
  {
    title: "Teachers",
    description: "Create courses, manage learners, run live classes, and monitor performance.",
    icon: LayoutDashboard,
    href: ROUTES.auth.login,
    cta: "Teach on platform",
  },
  {
    title: "Admins",
    description: "Oversee users, content, support tickets, and platform-wide analytics.",
    icon: ShieldCheck,
    href: ROUTES.auth.login,
    cta: "Manage platform",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeStatsSection />

      <section className="border-t border-border bg-section">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Built for every role in your institution
            </h2>
            <p className="mt-3 text-muted-foreground">
              One platform with dedicated dashboards for students, teachers, and administrators.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map(({ title, description, icon: Icon, href, cta }) => (
              <Card key={title} interactive className="border-border">
                <CardHeader className="space-y-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15">
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link href={href}>{cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
