"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  GraduationCap,
  Layers,
  PlayCircle,
  Rocket,
  School,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils";
import {
  heroBadge,
  heroCategories,
  heroDescription,
  heroHeadline,
  heroHighlights,
  heroPreview,
  heroPreviewLessons,
  heroSocialProof,
  homeTrustPartners,
} from "./data/home.data";

const partnerIcons: Record<(typeof homeTrustPartners)[number]["icon"], LucideIcon> = {
  building: Building2,
  briefcase: Briefcase,
  rocket: Rocket,
  school: School,
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const highlightIcons = [Video, Award, Layers, BarChart3] as const;

export function HomeHero() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [query, setQuery] = useState("");

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: "hidden",
        animate: "visible",
        transition: { staggerChildren: 0.08, delayChildren: 0.04 },
      };

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `${ROUTES.courses}?q=${encodeURIComponent(trimmed)}` : ROUTES.courses);
  }

  return (
    <section className="relative -mt-16 flex min-h-[100dvh] items-center overflow-hidden border-b border-border/60 bg-gradient-hero lg:-mt-[4.25rem]">
      {/* Animated gradient blobs — 10MS style */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(24,119,242,0.18)_0%,transparent_70%)] blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-32 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(239,50,57,0.16)_0%,transparent_70%)] blur-3xl"
        animate={{ x: [0, -25, 0], y: [0, 25, 0], scale: [1, 0.9, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(94,55,234,0.08)_0%,transparent_70%)] blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(24,119,242,0.1),transparent_65%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(220,228,240,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(220,228,240,0.4)_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,#000_15%,transparent_100%)]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-12 pt-32 md:px-6 sm:pt-36 lg:pb-16 lg:pt-40">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 xl:gap-16">
          <motion.div {...motionProps} className="max-w-2xl">
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.45 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-muted px-3.5 py-1.5 text-xs font-semibold text-primary sm:text-sm"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {heroBadge}
            </motion.div>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.45 }}
              className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.35rem] xl:text-[3.65rem]"
            >
              {heroHeadline.lead}{" "}
              <span className="text-gradient-brand">
                {heroHeadline.highlight}
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.45 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {heroDescription}
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.45 }}
              className="mt-8 grid gap-3 sm:grid-cols-2"
            >
              {heroHighlights.map((item, index) => {
                const Icon = highlightIcons[index];
                return (
                  <div
                    key={item.title}
                    className="card-interactive flex gap-3 rounded-xl border border-border/80 bg-card/90 p-3.5 backdrop-blur-sm"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            <motion.form
              variants={fadeUp}
              transition={{ duration: 0.45 }}
              onSubmit={handleSearch}
              className="mt-8 rounded-2xl border border-border bg-card p-2 shadow-[0_12px_40px_-16px_rgba(24,119,242,0.12)] sm:flex sm:items-center sm:gap-2"
            >
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  placeholder="Search 1,200+ courses by skill or topic..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-11 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
                  aria-label="Search courses"
                />
              </div>
              <Button type="submit" className="mt-2 h-11 w-full px-6 sm:mt-0 sm:w-auto">
                Search courses
              </Button>
            </motion.form>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.45 }}
              className="mt-4 flex flex-wrap gap-2"
            >
              {heroCategories.map((category) => (
                <Link
                  key={category}
                  href={`${ROUTES.courses}?category=${encodeURIComponent(category)}`}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary-muted hover:text-primary hover:shadow-[0_8px_20px_-10px_rgba(24,119,242,0.2)]"
                >
                  {category}
                </Link>
              ))}
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.45 }}
              className="mt-7 flex flex-wrap items-center gap-3"
            >
              <Button asChild className="h-11 px-6">
                <Link href={ROUTES.courses}>
                  Explore courses
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-11 px-6">
                <Link href={ROUTES.auth.register}>Start for free</Link>
              </Button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.45 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <div className="flex -space-x-2">
                {heroSocialProof.learnerAvatars.map((initials) => (
                  <span
                    key={initials}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-gradient-brand text-[10px] font-bold text-primary-foreground"
                  >
                    {initials}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{heroSocialProof.rating}</span> from{" "}
                  {heroSocialProof.reviewCount} reviews
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.45 }}
              className="mt-8 flex flex-wrap items-center gap-2"
            >
              <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Trusted by
              </span>
              {homeTrustPartners.map((partner) => {
                const Icon = partnerIcons[partner.icon];
                return (
                  <span
                    key={partner.label}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    <Icon className="h-3 w-3 text-primary" aria-hidden />
                    {partner.label}
                  </span>
                );
              })}
            </motion.div>
          </motion.div>

          <motion.div
            {...(prefersReducedMotion
              ? {}
              : {
                  initial: { opacity: 0, x: 28 },
                  animate: { opacity: 1, x: 0 },
                  transition: { duration: 0.55, delay: 0.15 },
                })}
            className="relative mx-auto w-full max-w-lg lg:max-w-none lg:justify-self-end"
          >
            <div className="absolute -inset-4 animate-pulse-glow rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-accent/15 blur-2xl" aria-hidden />

            <motion.div
              className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_28px_70px_-20px_rgba(24,119,242,0.15)]"
              animate={prefersReducedMotion ? {} : { y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="border-b border-border bg-muted/40 px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-primary-foreground">
                      SM
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Sarah&apos;s dashboard</p>
                      <p className="text-xs text-muted-foreground">{heroPreview.instructor}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                    Online
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{heroPreview.trackLabel}</p>
                    <h2 className="mt-1 text-lg font-bold text-foreground sm:text-xl">{heroPreview.trackTitle}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{heroPreview.trackMeta}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <GraduationCap className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-primary/15 bg-primary-muted/50 p-3.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">Course completion</span>
                    <span className="font-bold text-primary">{heroPreview.progress}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-card">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${heroPreview.progress}%` }}
                    />
                  </div>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {heroPreviewLessons.map((lesson) => (
                    <li
                      key={lesson.title}
                      className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3"
                    >
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          lesson.status === "completed" && "bg-emerald-50 text-emerald-600",
                          lesson.status === "in-progress" && "bg-primary/10 text-primary",
                          lesson.status === "locked" && "bg-border/70 text-muted-foreground"
                        )}
                      >
                        {lesson.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                        ) : lesson.status === "in-progress" ? (
                          <PlayCircle className="h-4 w-4" aria-hidden />
                        ) : (
                          <BookOpen className="h-4 w-4" aria-hidden />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {lesson.status === "completed"
                            ? `Completed · ${lesson.duration}`
                            : lesson.status === "in-progress"
                              ? `${lesson.progress}% · ${lesson.duration}`
                              : `Locked · ${lesson.duration}`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Video className="h-4 w-4 text-primary" aria-hidden />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{heroPreview.nextLive}</p>
                      <p className="text-[10px] text-muted-foreground">{heroPreview.learnersOnline} learners enrolled</p>
                    </div>
                  </div>
                  <Button size="sm" className="h-8 px-3 text-xs" asChild>
                    <Link href={ROUTES.courses}>Join</Link>
                  </Button>
                </div>
              </div>
            </motion.div>

            <motion.div
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 14 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.45, delay: 0.4 },
                  })}
              className="absolute -left-3 top-10 hidden w-48 rounded-xl border border-border bg-card p-3.5 shadow-lg card-interactive sm:block lg:-left-12"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                  <Award className="h-4 w-4 text-amber-600" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Certificate issued</p>
                  <p className="text-[10px] text-muted-foreground">JavaScript Fundamentals</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 14 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.45, delay: 0.5 },
                  })}
              className="absolute -right-3 bottom-8 hidden w-52 rounded-xl border border-border bg-card p-3.5 shadow-lg card-interactive sm:block lg:-right-10"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Institution verified</p>
                  <p className="text-[10px] text-muted-foreground">Accredited learning path</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <Users className="h-3 w-3 text-muted-foreground" aria-hidden />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {heroPreview.learnersOnline} active this week
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
