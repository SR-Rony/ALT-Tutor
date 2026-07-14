"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { ROUTES } from "@/constants";
import { cn } from "@/utils";
import { animatedLessons } from "./data/home.data";

type LessonItem = (typeof animatedLessons.items)[number];

function LessonCard({ item }: { item: LessonItem }) {
  return (
    <Link
      href={ROUTES.courses}
      className="group flex h-full w-[min(78vw,17.5rem)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_-12px_rgba(26,43,94,0.14)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-14px_rgba(239,50,57,0.22)] sm:w-[18rem]"
    >
      <div className={cn("relative aspect-[16/11] overflow-hidden bg-gradient-to-br", item.gradient)}>
        {/* Decorative illustration shapes */}
        <div aria-hidden className="absolute inset-0">
          <div className="absolute -left-6 top-4 h-24 w-24 rounded-full bg-white/20 blur-xl" />
          <div className="absolute bottom-2 right-4 h-20 w-20 rotate-12 rounded-2xl bg-white/15" />
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
        </div>

        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#1a2b5e] shadow-md transition-transform duration-300 group-hover:scale-110 sm:h-14 sm:w-14">
            <Play className="h-5 w-5 fill-current sm:h-6 sm:w-6" aria-hidden />
          </span>
        </span>

        <span className="absolute bottom-3 right-3 rounded-md bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1877f2] shadow-sm sm:text-xs">
          {item.badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 py-3.5 sm:px-5 sm:py-4">
        <p className="flex items-center gap-2 text-xs font-medium text-[#64748b] sm:text-sm">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.dot }} aria-hidden />
          {item.subject}
        </p>
        <h3 className="text-sm font-bold leading-snug text-[#1a2b5e] transition-colors duration-300 group-hover:text-[#ef3239] sm:text-base">
          {item.title}
        </h3>
      </div>
    </Link>
  );
}

export function HomeAnimatedLessons() {
  const [activeTab, setActiveTab] = useState<(typeof animatedLessons.tabs)[number]["id"]>("all");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const filtered = useMemo(() => {
    if (activeTab === "all") return animatedLessons.items;
    return animatedLessons.items.filter((item) => item.category === activeTab);
  }, [activeTab]);

  function updateArrows() {
    const el = scrollerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < maxScroll - 8);
  }

  function scrollByCard(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-lesson-card]");
    const amount = (card?.offsetWidth ?? 280) + 16;
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: 0 });
    updateArrows();
  }, [activeTab, filtered.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [filtered.length]);

  return (
    <section className="relative w-full overflow-x-clip bg-white">
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="bg-gradient-to-r from-[#1a2b5e] via-[#ff6b35] to-[#ef3239] bg-clip-text text-2xl font-extrabold tracking-tight text-transparent sm:text-3xl lg:text-4xl">
            {animatedLessons.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#64748b] sm:text-base lg:mt-4 lg:text-lg">
            {animatedLessons.subtitle}
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-8 border-b border-[#e8edf5] sm:mt-10">
          <div
            role="tablist"
            aria-label="Lesson categories"
            className="flex items-center justify-center gap-1 sm:gap-2"
          >
            {animatedLessons.tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative cursor-pointer px-3 py-3 text-sm font-semibold transition-colors duration-300 sm:px-5 sm:text-base",
                    isActive ? "text-[#ef3239]" : "text-[#475569] hover:text-[#1a2b5e]"
                  )}
                >
                  {tab.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-gradient-to-r from-[#3b8dee] via-[#ff6b35] to-[#ef3239] transition-transform duration-300 origin-center",
                      isActive ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Slider panel */}
        <div className="relative mt-8 overflow-hidden rounded-[1.75rem] bg-[linear-gradient(90deg,#fff1f2_0%,#f8faff_45%,#eef6ff_100%)] p-4 sm:mt-10 sm:rounded-[2rem] sm:p-6 lg:p-8">
          <button
            type="button"
            aria-label="Previous lessons"
            disabled={!canPrev}
            onClick={() => scrollByCard(-1)}
            className={cn(
              "absolute left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#e8edf5] bg-white text-[#64748b] shadow-[0_8px_24px_-8px_rgba(26,43,94,0.2)] transition-all duration-300 hover:border-transparent hover:bg-gradient-to-br hover:from-[#3b8dee] hover:via-[#ff6b35] hover:to-[#ef3239] hover:text-white hover:shadow-[0_12px_28px_-10px_rgba(239,50,57,0.45)] sm:left-3 sm:inline-flex lg:left-4",
              !canPrev && "pointer-events-none opacity-40"
            )}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>

          <button
            type="button"
            aria-label="Next lessons"
            disabled={!canNext}
            onClick={() => scrollByCard(1)}
            className={cn(
              "absolute right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#e8edf5] bg-white text-[#64748b] shadow-[0_8px_24px_-8px_rgba(26,43,94,0.2)] transition-all duration-300 hover:border-transparent hover:bg-gradient-to-br hover:from-[#3b8dee] hover:via-[#ff6b35] hover:to-[#ef3239] hover:text-white hover:shadow-[0_12px_28px_-10px_rgba(239,50,57,0.45)] sm:right-3 sm:inline-flex lg:right-4",
              !canNext && "pointer-events-none opacity-40"
            )}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>

          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto scroll-smooth px-1 pb-1 pt-1 scrollbar-none sm:gap-5 sm:px-10 lg:px-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
          >
            {filtered.map((item) => (
              <div key={item.id} data-lesson-card className="snap-start">
                <LessonCard item={item} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
