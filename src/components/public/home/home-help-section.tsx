"use client";

import Image from "next/image";
import Link from "next/link";
import { Facebook, Phone, Play, Youtube } from "lucide-react";
import { siteConfig } from "@/config";
import { ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";
import { helpSection } from "./data/home.data";

export function HomeHelpSection() {
  const { call, videos, facebook } = helpSection;

  return (
    <section className="relative w-full overflow-x-clip bg-[#0c4558]">
      {/* Seam-to-seam icon watermark pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='2'%3E%3Ccircle cx='24' cy='28' r='8'/%3E%3Cpath d='M16 48h16M20 42v12'/%3E%3Crect x='70' y='18' width='28' height='20' rx='4'/%3E%3Cpath d='M78 28l8 5 8-5'/%3E%3Cpath d='M30 78c8-10 22-10 30 0'/%3E%3Ccircle cx='90' cy='88' r='10'/%3E%3Cpath d='M86 88h8M90 84v8'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "120px 120px",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#2dd4bf]/15 blur-3xl" />
        <div className="absolute -right-16 bottom-6 h-72 w-72 rounded-full bg-[#f59e0b]/12 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:py-16">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-5">
          {/* Call for help — large card */}
          <article className="relative overflow-hidden rounded-[1.5rem] bg-[#fdf4e3] shadow-[0_20px_50px_-24px_rgba(0,0,0,0.45)] sm:rounded-[1.75rem]">
            <div className="grid h-full items-stretch sm:grid-cols-[1.1fr_0.9fr]">
              <div className="flex flex-col justify-center px-5 py-7 sm:px-7 sm:py-8 lg:px-8 lg:py-9">
                <h2 className="text-xl font-extrabold leading-tight tracking-tight text-[#1a2b5e] sm:text-2xl lg:text-[1.75rem]">
                  {call.title}
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#58688b] sm:text-[0.95rem]">
                  {call.description}
                </p>

                <div className="mt-4 flex items-center gap-2.5">
                  <span aria-hidden className="h-8 w-1 shrink-0 rounded-full bg-[#f5c842]" />
                  <p className="text-sm font-semibold text-[#1a2b5e]">{call.hours}</p>
                </div>

                <div className="mt-5">
                  <Button asChild variant="default" size="pillLg" className="min-w-[11rem]">
                    <a href={`tel:${siteConfig.phone}`}>
                      <span className="inline-flex items-center gap-2.5">
                        <Phone className="h-4 w-4" aria-hidden />
                        {siteConfig.phone}
                      </span>
                    </a>
                  </Button>
                  <p className="mt-2.5 text-xs text-[#8b95a8]">{call.note}</p>
                </div>
              </div>

              <div className="relative hidden min-h-[14rem] sm:block">
                <Image
                  src={call.image}
                  alt={call.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 40vw, 320px"
                  className="object-contain object-bottom"
                  priority={false}
                />
              </div>
            </div>

            {/* Mobile image */}
            <div className="relative mx-auto h-48 w-40 sm:hidden">
              <Image
                src={call.image}
                alt={call.imageAlt}
                fill
                sizes="160px"
                className="object-contain object-bottom"
              />
            </div>
          </article>

          {/* Right stacked cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:gap-5">
            {/* Free video library */}
            <article className="group relative flex min-h-[9.5rem] items-center overflow-hidden rounded-[1.5rem] bg-[#ffe8e4] p-5 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:-translate-y-0.5 sm:rounded-[1.75rem] sm:p-6">
              <div className="relative z-10 max-w-[65%]">
                <h3 className="text-lg font-extrabold tracking-tight text-[#1a2b5e] sm:text-xl">
                  {videos.title}
                </h3>
                <Link
                  href={videos.href || ROUTES.courses}
                  className="mt-3 inline-flex cursor-pointer items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#ef3239] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-[#3b8dee] hover:via-[#ff6b35] hover:to-[#ef3239] hover:text-white hover:shadow-[0_10px_24px_-10px_rgba(239,50,57,0.45)]"
                >
                  {videos.cta}
                </Link>
              </div>

              <div
                aria-hidden
                className="absolute right-4 top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-2xl bg-[#ff0033] text-white shadow-[0_12px_28px_-8px_rgba(255,0,51,0.55)] transition-transform duration-300 group-hover:scale-105 sm:right-5 sm:h-[4.5rem] sm:w-[4.5rem]"
              >
                <Play className="h-7 w-7 fill-white sm:h-8 sm:w-8" />
              </div>
              <Youtube
                aria-hidden
                className="absolute right-3 top-3 h-5 w-5 text-[#ef3239]/50 sm:right-4 sm:top-4"
              />
            </article>

            {/* Facebook group */}
            <article className="group relative flex min-h-[9.5rem] items-center overflow-hidden rounded-[1.5rem] bg-[#e8f0ff] p-5 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:-translate-y-0.5 sm:rounded-[1.75rem] sm:p-6">
              <div className="relative z-10 max-w-[65%]">
                <h3 className="text-lg font-extrabold tracking-tight text-[#1a2b5e] sm:text-xl">
                  {facebook.title}
                </h3>
                <a
                  href={facebook.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex cursor-pointer items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1877f2] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-[#3b8dee] hover:via-[#ff6b35] hover:to-[#ef3239] hover:text-white hover:shadow-[0_10px_24px_-10px_rgba(239,50,57,0.45)]"
                >
                  {facebook.cta}
                </a>
              </div>

              <div
                aria-hidden
                className="absolute right-4 top-1/2 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-2xl bg-[#1877f2] text-white shadow-[0_12px_28px_-8px_rgba(24,119,242,0.5)] transition-transform duration-300 group-hover:scale-105 sm:right-5 sm:h-[4.5rem] sm:w-[4.5rem]"
              >
                <Facebook className="h-8 w-8 fill-white sm:h-9 sm:w-9" />
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
