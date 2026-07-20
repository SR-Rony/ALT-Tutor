"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  HeartHandshake,
  Play,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { siteConfig } from "@/config";
import { ROUTES } from "@/constants";
import { SecureVideoPlayer, VideoModal } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { useCallback, useState } from "react";
import { aboutDemoVideo, aboutPageContent } from "./data/about.data";

const valueIcons = {
  excellence: GraduationCap,
  access: Users,
  practice: Target,
  trust: HeartHandshake,
} as const;

export function AboutPage() {
  const prefersReducedMotion = useReducedMotion();
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const content = aboutPageContent;

  const openVideo = useCallback(() => setVideoModalOpen(true), []);
  const closeVideo = useCallback(() => setVideoModalOpen(false), []);

  const fadeIn = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.5 },
      };

  return (
    <>
      <VideoModal open={videoModalOpen} title={aboutDemoVideo.title} onClose={closeVideo}>
        <SecureVideoPlayer title={aboutDemoVideo.title} directUrl={aboutDemoVideo.url} rounded={false} />
      </VideoModal>

      {/* Hero */}
      <section className="relative overflow-x-clip bg-gradient-to-br from-[#0b1220] via-[#162033] to-[#1e1b4b]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#1877f2]/20 blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[#ef3239]/15 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3b8dee]/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,141,238,0.18),transparent_60%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
          <nav className="mb-8 text-sm text-white/60 sm:mb-10">
            <Link href={ROUTES.home} className="transition hover:text-white">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-white/90">About</span>
          </nav>

          <motion.div {...fadeIn} className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white sm:text-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#ff6b35]" aria-hidden />
              {content.hero.eyebrow}
            </span>

            <h1 className="mt-6 text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-[3.25rem] lg:leading-[1.12]">
              <span className="block text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
                {content.hero.titleLead}
              </span>
              <span className="mt-2 block bg-gradient-to-r from-[#5ba3ff] via-[#ff8f5a] to-[#ff4d55] bg-clip-text text-transparent drop-shadow-sm sm:mt-3">
                {content.hero.titleHighlight}
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/85 sm:mt-6 sm:text-base lg:text-lg">
              {content.hero.description}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row">
              <Button variant="default" size="pillLg" onClick={openVideo}>
                <span className="inline-flex items-center gap-2">
                  <Play className="h-4 w-4 fill-current" aria-hidden />
                  Watch Demo Video
                </span>
              </Button>
              <Button
                asChild
                variant="secondary"
                size="pillLg"
                className="border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/15"
              >
                <Link href={ROUTES.courses}>{content.cta.primary}</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            {...fadeIn}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] backdrop-blur-md sm:mt-14"
          >
            <div className="grid grid-cols-2 divide-x divide-y divide-white/10 sm:grid-cols-4 sm:divide-y-0">
              {content.stats.map((stat) => (
                <article key={stat.label} className="flex flex-col items-center px-4 py-6 text-center sm:py-7">
                  <p className="text-2xl font-extrabold sm:text-[1.75rem]" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-white/70 sm:text-sm">{stat.label}</p>
                </article>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Story video */}
      <section id="story-video" className="relative scroll-mt-24 bg-[#f7f9fc] py-14 sm:py-16 lg:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-20 h-48 w-48 rounded-full bg-[#1877f2]/8 blur-3xl" />
          <div className="absolute -right-10 bottom-10 h-40 w-40 rounded-full bg-[#ef3239]/8 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fadeIn} className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#1a2b5e] sm:text-3xl lg:text-4xl">
              {content.story.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#58688b] sm:text-base lg:text-lg">
              {content.story.subtitle}
            </p>
          </motion.div>

          <motion.div
            {...fadeIn}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mx-auto mt-10 max-w-4xl"
          >
            <div className="overflow-hidden rounded-2xl shadow-[0_24px_60px_-24px_rgba(26,43,94,0.35)] ring-1 ring-[#dce4f0]">
              <SecureVideoPlayer title={aboutDemoVideo.title} directUrl={aboutDemoVideo.url} rounded={false} />
            </div>
            <p className="mt-4 text-center text-sm text-[#58688b] sm:text-base">{aboutDemoVideo.caption}</p>
          </motion.div>
        </div>
      </section>

      {/* Mission & vision */}
      <section className="bg-white py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            {[content.mission, content.vision].map((block, index) => (
              <motion.article
                key={block.title}
                {...fadeIn}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="relative overflow-hidden rounded-2xl border border-[#e8edf5] bg-gradient-to-br from-white to-[#f8faff] p-7 shadow-[0_12px_40px_-20px_rgba(26,43,94,0.15)] sm:p-8"
              >
                <div
                  aria-hidden
                  className={cn(
                    "absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl",
                    index === 0 ? "bg-[#ef3239]/10" : "bg-[#1877f2]/10"
                  )}
                />
                <div className="relative flex items-start gap-4">
                  <span
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md",
                      index === 0 ? "bg-gradient-to-br from-[#ef3239] to-[#ff6b35]" : "bg-gradient-to-br from-[#1877f2] to-[#3b8dee]"
                    )}
                  >
                    {index === 0 ? <Target className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
                  </span>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#1a2b5e] sm:text-2xl">{block.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#58688b] sm:text-base">{block.body}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative overflow-x-clip bg-[#0b1f4d] py-14 sm:py-16 lg:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#1877f2]/25 blur-3xl" />
          <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[#ef3239]/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fadeIn} className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
              What we stand for
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#b8c7e0] sm:text-base">
              Four principles guide everything we build at {siteConfig.name}.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:gap-6">
            {content.values.map((value, index) => {
              const Icon = valueIcons[value.id as keyof typeof valueIcons] ?? Sparkles;
              return (
                <motion.article
                  key={value.id}
                  {...fadeIn}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="group rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.09] sm:p-7"
                >
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"
                    style={{ color: value.color }}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-white sm:text-xl">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#b8c7e0]">{value.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Journey / pillars */}
      <section className="bg-[#f7f9fc] py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fadeIn} className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#1a2b5e] sm:text-3xl lg:text-4xl">
              The Alt Tutor way
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#58688b] sm:text-base">
              A simple path from confusion to confidence — designed for how Bangladeshi students actually study.
            </p>
          </motion.div>

          <div className="mt-10 space-y-4 lg:mt-12">
            {content.pillars.map((pillar, index) => (
              <motion.article
                key={pillar.step}
                {...fadeIn}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className="flex flex-col gap-4 rounded-2xl border border-[#e8edf5] bg-white p-6 shadow-[0_8px_30px_-16px_rgba(26,43,94,0.12)] sm:flex-row sm:items-center sm:gap-6 sm:p-7"
              >
                <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3b8dee] via-[#ff6b35] to-[#ef3239] text-lg font-extrabold text-white shadow-md">
                  {pillar.step}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[#1a2b5e] sm:text-xl">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#58688b] sm:text-base">{pillar.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            {...fadeIn}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3b8dee] via-[#ff6b35] to-[#ef3239] px-6 py-12 text-center text-white shadow-[0_24px_60px_-20px_rgba(239,50,57,0.45)] sm:px-10 sm:py-14"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15),transparent_45%)]" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-2xl font-extrabold sm:text-3xl">{content.cta.title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/90 sm:text-base">{content.cta.description}</p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="pillLg" className="bg-white text-[#1a2b5e] hover:bg-white/90">
                  <Link href={ROUTES.courses}>{content.cta.primary}</Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  size="pillLg"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                >
                  <Link href={ROUTES.contact}>{content.cta.secondary}</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
