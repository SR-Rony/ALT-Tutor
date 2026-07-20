"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type PublicPageHeroProps = {
  breadcrumb: string;
  eyebrow: string;
  titleLead: string;
  titleHighlight: string;
  description: string;
  children?: ReactNode;
};

export function PublicPageHero({
  breadcrumb,
  eyebrow,
  titleLead,
  titleHighlight,
  description,
  children,
}: PublicPageHeroProps) {
  const prefersReducedMotion = useReducedMotion();

  const fadeIn = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      };

  return (
    <section className="relative overflow-x-clip bg-gradient-to-br from-[#0b1220] via-[#162033] to-[#1e1b4b]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#1877f2]/20 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[#ef3239]/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,141,238,0.18),transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        <nav className="mb-8 text-sm text-white/60 sm:mb-10">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-white/90">{breadcrumb}</span>
        </nav>

        <motion.div {...fadeIn} className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white sm:text-sm">
            {eyebrow}
          </span>

          <h1 className="mt-6 text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-[3.25rem] lg:leading-[1.12]">
            <span className="block text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">{titleLead}</span>
            <span className="mt-2 block bg-gradient-to-r from-[#5ba3ff] via-[#ff8f5a] to-[#ff4d55] bg-clip-text text-transparent sm:mt-3">
              {titleHighlight}
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/85 sm:mt-6 sm:text-base lg:text-lg">
            {description}
          </p>

          {children ? <div className="mt-8 sm:mt-10">{children}</div> : null}
        </motion.div>
      </div>
    </section>
  );
}
