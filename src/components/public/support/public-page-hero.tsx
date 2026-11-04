"use client";

import Link from "next/link";
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
  return (
    <section className="relative w-full border-b border-slate-200 bg-[#F8FAFC]">
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <nav className="mb-6 text-xs font-medium text-slate-500 sm:mb-8">
          <Link href="/" className="transition hover:text-[#1D4ED8]">
            Home
          </Link>
          <span className="mx-2 text-slate-400">/</span>
          <span className="font-semibold text-slate-800">{breadcrumb}</span>
        </nav>

        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
            {eyebrow}
          </span>

          <h1 className="mt-4 text-3xl font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            <span className="block">{titleLead}</span>
            <span className="mt-2 block text-[#1D4ED8] sm:mt-3">
              {titleHighlight}
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            {description}
          </p>

          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
