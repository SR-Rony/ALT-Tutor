"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AudioLines,
  BookOpen,
  CalendarDays,
  ClipboardList,
  MessageCircle,
  PlayCircle,
  Radio,
  Sparkles,
  Video,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { academicProgram } from "./data/home.data";

const featureIcons: Record<(typeof academicProgram.features)[number]["icon"], LucideIcon> = {
  video: Video,
  play: PlayCircle,
  clipboard: ClipboardList,
  radio: Radio,
  book: BookOpen,
  sparkles: Sparkles,
  chart: BarChart3,
};

export function HomeAcademicProgram() {
  const prefersReducedMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<(typeof academicProgram.features)[number]["id"]>(
    academicProgram.features[0].id
  );
  const { preview } = academicProgram;

  return (
    <section className="relative w-full overflow-x-clip bg-[#0b1f4d]">
      {/* Seam-to-seam decorative blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#1877f2]/25 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[#ef3239]/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-[#3b8dee]/15 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
            {academicProgram.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#b8c7e0] sm:text-base lg:mt-4 lg:text-lg">
            {academicProgram.subtitle}
          </p>
        </div>

        <div className="mt-10 grid items-center gap-8 lg:mt-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-10 xl:gap-14">
          {/* Left — feature list */}
          <ul className="order-2 space-y-2.5 lg:order-1 sm:space-y-3">
            {academicProgram.features.map((feature) => {
              const Icon = featureIcons[feature.icon];
              const isActive = activeId === feature.id;

              return (
                <li key={feature.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(feature.id)}
                    onMouseEnter={() => setActiveId(feature.id)}
                    className={cn(
                      "group relative flex w-full cursor-pointer items-center gap-3 rounded-xl p-[2px] text-left transition-transform duration-300",
                      "bg-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]",
                      "hover:bg-gradient-to-r hover:from-[#3b8dee] hover:via-[#ff6b35] hover:to-[#ef3239]",
                      "hover:-translate-y-0.5",
                      isActive && "bg-gradient-to-r from-[#ef3239] via-[#ff4d6d] to-[#ef3239]"
                    )}
                  >
                    <span
                      className={cn(
                        "relative z-10 flex w-full items-center gap-3 overflow-hidden rounded-[10px] bg-white px-4 py-3.5 sm:px-5 sm:py-4",
                        "transition-shadow duration-300"
                      )}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10"
                        style={{ backgroundColor: `${feature.iconColor}18` }}
                      >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: feature.iconColor }} aria-hidden />
                      </span>
                      <span className="text-sm font-semibold text-[#1a2b5e] sm:text-base">
                        {feature.title}
                      </span>
                    </span>

                    {/* Active pointer toward preview */}
                    {isActive ? (
                      <span
                        aria-hidden
                        className="absolute -right-2 top-1/2 z-20 hidden h-0 w-0 -translate-y-1/2 border-y-[8px] border-l-[10px] border-y-transparent border-l-[#ef3239] lg:block"
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Right — preview panel with phone + floating cards */}
          <motion.div
            {...(prefersReducedMotion
              ? {}
              : {
                  initial: { opacity: 0, y: 24 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.5 },
                })}
            className="order-1 lg:order-2"
          >
            <div className="relative mx-auto max-w-lg overflow-hidden rounded-[1.75rem] bg-[#9fd4e0] px-4 pb-8 pt-10 sm:max-w-none sm:rounded-[2rem] sm:px-8 sm:pb-10 sm:pt-12 lg:px-10">
              {/* Soft glow behind phone */}
              <div
                aria-hidden
                className="absolute left-1/2 top-8 h-64 w-48 -translate-x-1/2 rounded-full bg-white/40 blur-2xl"
              />

              {/* Phone mockup */}
              <div className="relative z-10 mx-auto w-[min(100%,14.5rem)] sm:w-[16.5rem]">
                <div className="overflow-hidden rounded-[1.75rem] border-[6px] border-[#1a1a2e] bg-[#1a1a2e] shadow-[0_28px_60px_-20px_rgba(15,23,42,0.55)] sm:rounded-[2rem] sm:border-[7px]">
                  {/* Dynamic island / notch */}
                  <div className="relative bg-gradient-to-b from-[#5b6bdc] via-[#6b7aef] to-[#7b8cff] pt-3">
                    <div className="mx-auto mb-3 flex w-fit items-center gap-1.5 rounded-full bg-[#1a1a2e]/85 px-3 py-1.5 text-[10px] font-medium text-white sm:text-xs">
                      <AudioLines className="h-3 w-3 text-[#60a5fa]" aria-hidden />
                      {preview.teacherName}
                    </div>

                    <div className="relative mx-auto aspect-[3/4] w-full max-w-[12rem] sm:max-w-[13.5rem]">
                      <Image
                        src={preview.teacherImage}
                        alt={preview.teacherName}
                        fill
                        sizes="220px"
                        className="object-contain object-bottom"
                        priority
                      />
                    </div>
                  </div>

                  {/* Bottom chat bar */}
                  <div className="flex items-center justify-between gap-2 bg-white px-3 py-2.5 sm:px-3.5 sm:py-3">
                    <div className="relative inline-flex items-center gap-1.5 rounded-full bg-[#f1f5f9] px-3 py-1.5 text-xs font-semibold text-[#1a2b5e]">
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                      Chat
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef3239] px-1 text-[9px] font-bold text-white">
                        {preview.chatCount}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#64748b] sm:text-xs">
                      {preview.joinedCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating lecture card — bottom left */}
              <div className="absolute bottom-4 left-3 z-20 w-[min(72%,15rem)] rounded-2xl bg-white p-3 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.35)] sm:bottom-6 sm:left-5 sm:w-[17rem] sm:p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#ef3239] sm:text-xs">
                  {preview.lectureCard.label}
                </p>
                <p className="mt-1 line-clamp-2 text-xs font-bold leading-snug text-[#1a2b5e] sm:text-sm">
                  {preview.lectureCard.title}
                </p>
                <p className="mt-1.5 text-[10px] text-[#64748b] sm:text-xs">{preview.lectureCard.time}</p>
                <Button asChild variant="default" size="sm" className="mt-3 w-full rounded-full">
                  <Link href={ROUTES.courses}>{preview.lectureCard.cta}</Link>
                </Button>
              </div>

              {/* Floating side card — middle right */}
              <div className="absolute right-2 top-[42%] z-20 hidden w-36 -translate-y-1/2 rounded-2xl bg-white p-3 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.35)] sm:right-4 sm:block sm:w-40 sm:p-3.5 lg:right-6">
                <div className="relative mb-2 h-16 overflow-hidden rounded-xl bg-gradient-to-br from-[#5b6bdc] to-[#7b8cff] sm:h-[4.5rem]">
                  <Image
                    src={preview.teacherImage}
                    alt=""
                    fill
                    sizes="140px"
                    className="object-contain object-bottom"
                  />
                </div>
                <p className="text-xs font-bold text-[#1a2b5e]">{preview.sideCard.title}</p>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-[#64748b]">
                  <CalendarDays className="h-3 w-3 shrink-0" aria-hidden />
                  {preview.sideCard.date}
                </p>
                <Button asChild variant="default" size="sm" className="mt-2.5 w-full rounded-full text-xs">
                  <Link href={ROUTES.courses}>{preview.sideCard.cta}</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
