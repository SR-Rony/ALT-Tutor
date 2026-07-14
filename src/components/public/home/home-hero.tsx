"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import { ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";
import {
  heroHeadline,
  heroImage,
  heroPrimaryCta,
  heroSecondaryCta,
  heroSubheadline,
  homeStats,
} from "./data/home.data";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export function HomeHero() {
  const prefersReducedMotion = useReducedMotion();

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: "hidden",
        animate: "visible",
        transition: { staggerChildren: 0.1, delayChildren: 0.06 },
      };

  return (
    <section className="relative overflow-x-clip bg-[#f7f9fc]">
      {/* Soft background — Shikho-style */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#eef4fb_0%,#f7f9fc_38%,#ffffff_100%)]" />
        <div className="absolute -left-24 top-8 h-[28rem] w-[28rem] rounded-full bg-[#fef3c7]/55 blur-3xl sm:h-[32rem] sm:w-[32rem]" />
        <div className="absolute right-0 top-0 h-full w-[42%] bg-[linear-gradient(135deg,rgba(24,119,242,0.06)_0%,transparent_55%)]" />
        <div className="absolute bottom-16 left-[38%] h-20 w-20 rotate-12 rounded-2xl bg-[#1877f2]/10" />
        <div className="absolute right-[12%] top-[22%] h-14 w-14 rounded-full border-2 border-[#1877f2]/15 bg-white/50" />
        <div className="absolute bottom-[32%] left-[8%] h-10 w-10 rounded-full bg-[#ef3239]/15" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-8 lg:pt-12">
        <div className="grid items-center gap-6 pb-8 sm:gap-8 sm:pb-12 lg:grid-cols-[1fr_1.05fr] lg:gap-4 lg:pb-14 xl:gap-8">
          {/* Image — top on mobile, right on desktop */}
          <motion.div
            {...(prefersReducedMotion
              ? {}
              : {
                  initial: { opacity: 0, y: 24 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.55, delay: 0.08, ease: "easeOut" },
                })}
            className="relative order-1 mx-auto flex w-full max-w-[17rem] items-end justify-center sm:max-w-md lg:order-2 lg:mx-0 lg:max-w-none lg:justify-end"
          >
            {/* Yellow circle behind person */}
            <div
              aria-hidden
              className="absolute bottom-[8%] left-1/2 h-[min(72vw,18rem)] w-[min(72vw,18rem)] -translate-x-1/2 rounded-full bg-[#fde68a]/70 blur-[1px] sm:h-[26rem] sm:w-[26rem] lg:left-auto lg:right-[8%] lg:h-[28rem] lg:w-[28rem] lg:translate-x-0 xl:right-[12%]"
            />

            {/* Blue accent shape */}
            <div
              aria-hidden
              className="absolute bottom-[18%] right-[6%] hidden h-32 w-32 rotate-12 rounded-[2rem] bg-[#1877f2]/12 lg:block"
            />

            {/* Student PNG — no background box */}
            <div className="relative z-10 w-full max-w-[17rem] sm:max-w-[26rem] lg:max-w-[30rem] xl:max-w-[32rem]">
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
                width={800}
                height={876}
                priority
                sizes="(max-width: 768px) 70vw, 45vw"
                className="h-auto w-full object-contain object-bottom drop-shadow-[0_24px_48px_rgba(26,43,94,0.12)]"
              />
            </div>
          </motion.div>

          {/* Content — below image on mobile, left on desktop */}
          <motion.div
            {...motionProps}
            className="relative z-10 order-2 max-w-xl text-center lg:order-1 lg:max-w-[34rem] lg:pt-8 lg:text-left xl:pt-12"
          >
            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="text-[1.85rem] font-extrabold leading-[1.12] tracking-tight text-[#1a2b5e] sm:text-5xl lg:text-[3.15rem] xl:text-[3.45rem]"
            >
              {heroHeadline.lead}
              <br />
              <span className="text-[#1a2b5e]">{heroHeadline.highlight}</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="mx-auto mt-4 max-w-lg text-sm font-medium leading-relaxed text-[#ef3239] sm:mt-5 sm:text-lg lg:mx-0 lg:mt-6 lg:text-xl"
            >
              {heroSubheadline}
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.5 }}
              className="mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:justify-center lg:mt-10 lg:items-start lg:justify-start"
            >
              <Button asChild variant="default" size="pillLg" className="w-full sm:w-auto">
                <Link href={ROUTES.courses}>{heroPrimaryCta}</Link>
              </Button>
              <Button asChild variant="secondary" size="pillLg" className="w-full sm:w-auto">
                <Link href={ROUTES.courses}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Play className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden />
                  </span>
                  {heroSecondaryCta}
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating stats card — overlaps into next section */}
        <motion.div
          {...(prefersReducedMotion
            ? {}
            : {
                initial: { opacity: 0, y: 32 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.55, delay: 0.38 },
              })}
          className="relative z-20 mx-auto w-full max-w-5xl translate-y-6 sm:translate-y-8 lg:translate-y-10"
        >
          <div className="overflow-hidden rounded-2xl border border-[#e8edf5]/80 bg-white shadow-[0_16px_48px_-12px_rgba(26,43,94,0.14)] sm:rounded-[1.75rem]">
            <div className="grid grid-cols-2 divide-x divide-y divide-[#e8edf5] sm:grid-cols-4 sm:divide-y-0">
              {homeStats.map((stat) => (
                <article
                  key={stat.label}
                  className="flex min-h-[5.75rem] flex-col items-center justify-center px-4 py-5 text-center sm:min-h-[6.5rem] sm:px-5 sm:py-6 lg:min-h-[7rem] lg:py-7"
                >
                  <p
                    className="text-[1.65rem] font-extrabold leading-none tracking-tight sm:text-[1.85rem] lg:text-[2rem]"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-2.5 text-xs font-semibold text-[#1877f2] sm:mt-3 sm:text-sm">{stat.label}</p>
                </article>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Space for stats card overlap into next section */}
      <div aria-hidden className="h-10 sm:h-12 lg:h-14" />
    </section>
  );
}
