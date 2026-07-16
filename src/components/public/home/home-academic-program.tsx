"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronRight,
  ClipboardList,
  FileText,
  Layers,
  Lightbulb,
  PenLine,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/utils";
import { academicProgram } from "./data/home.data";

const featureIcons: Record<(typeof academicProgram.features)[number]["icon"], LucideIcon> = {
  clipboard: ClipboardList,
  file: FileText,
  pen: PenLine,
  lightbulb: Lightbulb,
  target: Target,
  layers: Layers,
  zap: Zap,
};

export function HomeAcademicProgram() {
  const prefersReducedMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<(typeof academicProgram.features)[number]["id"]>(
    academicProgram.features[0].id
  );

  const activeFeature = useMemo(
    () => academicProgram.features.find((f) => f.id === activeId) ?? academicProgram.features[0],
    [activeId]
  );

  const ActiveIcon = featureIcons[activeFeature.icon];

  return (
    <section className="relative w-full overflow-x-clip bg-[#0b1f4d]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#1877f2]/25 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[#ef3239]/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-[#3b8dee]/15 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
            {academicProgram.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#b8c7e0] sm:text-base lg:mt-4 lg:text-lg">
            {academicProgram.subtitle}
          </p>
        </div>

        <div className="mt-10 grid items-stretch gap-8 lg:mt-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] lg:gap-10 xl:gap-14">
          <ul className="order-2 space-y-2 lg:order-1 sm:space-y-2.5">
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
                    <span className="relative z-10 flex w-full items-center gap-3 overflow-hidden rounded-[10px] bg-white px-4 py-3 sm:px-5 sm:py-3.5">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10"
                        style={{ backgroundColor: `${feature.iconColor}18` }}
                      >
                        <Icon
                          className="h-4 w-4 sm:h-5 sm:w-5"
                          style={{ color: feature.iconColor }}
                          aria-hidden
                        />
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-semibold text-[#1a2b5e] sm:text-base">
                        {feature.title}
                      </span>
                      {isActive ? (
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#ef3239]" aria-hidden />
                      ) : null}
                    </span>

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
            <div
              className="relative flex h-full min-h-[22rem] flex-col overflow-hidden rounded-[1.75rem] px-5 py-6 transition-[background-color] duration-300 ease-out sm:min-h-[26rem] sm:rounded-[2rem] sm:px-8 sm:py-8 lg:px-10"
              style={{
                backgroundColor: `color-mix(in srgb, ${activeFeature.iconColor} 22%, white)`,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="flex flex-1 flex-col"
                >
                  <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    {activeFeature.previewCards.map((card) => (
                      <div
                        key={`${activeFeature.id}-${card.code}-${card.title}`}
                        className="rounded-2xl bg-white p-4 shadow-[0_12px_28px_-16px_rgba(15,23,42,0.35)] sm:p-5"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${activeFeature.iconColor}18` }}
                          >
                            <ActiveIcon
                              className="h-4 w-4"
                              style={{ color: activeFeature.iconColor }}
                              aria-hidden
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#64748b]">{card.code}</p>
                            <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-[#1a2b5e]">
                              {card.title}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e8edf5]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${card.progress}%`,
                              backgroundColor: activeFeature.iconColor,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 border-t border-[#1a2b5e]/10 pt-5 sm:mt-8 sm:pt-6">
                    <h3 className="text-xl font-extrabold text-[#1a1a2e] sm:text-2xl">
                      {activeFeature.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#4a5568] sm:text-base">
                      {activeFeature.description}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
