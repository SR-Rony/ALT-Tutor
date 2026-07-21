"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { ROUTES } from "@/constants";
import { useHomeData } from "@/hooks";
import { Button } from "@/components/ui/button";
import type { HomeFeaturedReview } from "@/types";
import { cn } from "@/utils";

const AUTO_MS = 4500;

function useVisibleCount() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setCount(1);
      else if (w < 1024) setCount(2);
      else setCount(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < rating ? "fill-[#f5c842] text-[#f5c842]" : "text-[#d1d5db]"
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

const CARD_ACCENTS = [
  {
    bar: "from-[#1877f2] via-[#38bdf8] to-[#22d3ee]",
    avatar: "from-[#1877f2] to-[#38bdf8]",
    quote: "text-[#1877f2]",
    ring: "hover:border-[#1877f2]/40",
    glow: "hover:shadow-[0_20px_44px_-22px_rgba(24,119,242,0.35)]",
  },
  {
    bar: "from-[#ef3239] via-[#ff6b35] to-[#f59e0b]",
    avatar: "from-[#ef3239] to-[#ff6b35]",
    quote: "text-[#ef3239]",
    ring: "hover:border-[#ef3239]/40",
    glow: "hover:shadow-[0_20px_44px_-22px_rgba(239,50,57,0.32)]",
  },
  {
    bar: "from-[#12b76a] via-[#2dd4bf] to-[#22d3ee]",
    avatar: "from-[#12b76a] to-[#2dd4bf]",
    quote: "text-[#12b76a]",
    ring: "hover:border-[#12b76a]/40",
    glow: "hover:shadow-[0_20px_44px_-22px_rgba(18,183,106,0.32)]",
  },
  {
    bar: "from-[#a855f7] via-[#8b5cf6] to-[#6366f1]",
    avatar: "from-[#a855f7] to-[#6366f1]",
    quote: "text-[#a855f7]",
    ring: "hover:border-[#a855f7]/40",
    glow: "hover:shadow-[0_20px_44px_-22px_rgba(168,85,247,0.32)]",
  },
] as const;

function ReviewCard({ review, index }: { review: HomeFeaturedReview; index: number }) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
  return (
    <article
      className={cn(
        "group relative flex h-full min-h-[15.5rem] flex-col rounded-2xl border border-[#e8eef6] bg-white p-5 pt-6 shadow-[0_12px_36px_-28px_rgba(26,43,94,0.45)] transition duration-300 hover:-translate-y-1 sm:min-h-[16.5rem] sm:p-6 sm:pt-7",
        accent.ring,
        accent.glow
      )}
    >
      {/* Top accent bar — rounded with the card so it never clips */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-1.5 rounded-t-2xl bg-gradient-to-r opacity-80 transition-opacity duration-300 group-hover:opacity-100",
          accent.bar
        )}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-4 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f7f9fc] transition-colors duration-300 group-hover:bg-white",
          accent.quote
        )}
      >
        <Quote className="h-[18px] w-[18px] opacity-40 transition-opacity duration-300 group-hover:opacity-70" />
      </span>

      <RatingStars rating={review.rating} />
      <p className="mt-3 flex-1 pr-8 text-sm leading-relaxed text-[#334155] sm:text-[0.95rem]">
        “{review.comment}”
      </p>
      <div className="mt-5 flex items-center gap-3 border-t border-[#e8eef6] pt-4">
        <span
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-md",
            accent.avatar
          )}
        >
          {review.student.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#1a2b5e]">{review.student.name}</p>
          <Link
            href={ROUTES.courseDetail(review.course.slug)}
            className="truncate text-xs font-medium text-[#1877f2] hover:underline"
          >
            {review.course.title}
          </Link>
        </div>
        <span className="ml-auto hidden shrink-0 rounded-full bg-[#ecfdf3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#067647] sm:inline-flex">
          Verified
        </span>
      </div>
    </article>
  );
}

export function HomeStudentReviews() {
  const prefersReducedMotion = useReducedMotion();
  const { data, isLoading } = useHomeData();
  const reviews = data?.featuredReviews ?? [];
  const visible = useVisibleCount();

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);

  // Slides advance 1 review at a time; the visible window wraps around the list.
  const stepCount = reviews.length > visible ? reviews.length : reviews.length > 0 ? 1 : 0;

  const safeIndex = stepCount > 0 ? ((index % stepCount) + stepCount) % stepCount : 0;

  const pageItems = useMemo(() => {
    if (reviews.length === 0) return [];
    const count = Math.min(visible, reviews.length);
    return Array.from({ length: count }, (_, i) => reviews[(safeIndex + i) % reviews.length]);
  }, [reviews, safeIndex, visible]);

  const goTo = useCallback(
    (next: number, dir: number) => {
      if (stepCount <= 1) return;
      setDirection(dir);
      setIndex(((next % stepCount) + stepCount) % stepCount);
    },
    [stepCount]
  );

  const goNext = useCallback(() => goTo(safeIndex + 1, 1), [goTo, safeIndex]);
  const goPrev = useCallback(() => goTo(safeIndex - 1, -1), [goTo, safeIndex]);

  useEffect(() => {
    setIndex(0);
  }, [visible, reviews.length]);

  useEffect(() => {
    if (prefersReducedMotion || paused || stepCount <= 1 || isLoading) return;
    const id = window.setInterval(() => {
      setDirection(1);
      setIndex((p) => (p + 1) % stepCount);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [prefersReducedMotion, paused, stepCount, isLoading]);

  if (!isLoading && reviews.length === 0) return null;

  return (
    <section className="relative w-full overflow-x-clip bg-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-8 h-56 w-56 rounded-full bg-[#1877f2]/8 blur-3xl" />
        <div className="absolute -right-16 bottom-4 h-64 w-64 rounded-full bg-[#ef3239]/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
        <motion.div
          {...(prefersReducedMotion
            ? {}
            : {
                initial: { opacity: 0, y: 18 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true, amount: 0.35 },
                transition: { duration: 0.45 },
              })}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ef3239]">
            Student voices
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#1a2b5e] sm:text-3xl lg:text-[2rem]">
            What our students are saying
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#58688b] sm:text-base">
            Real feedback from learners who study with ALT Tutor — clear lessons, better practice,
            stronger results.
          </p>
        </motion.div>

        <div
          className="relative mt-10"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
          }}
        >
          {stepCount > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous reviews"
                onClick={goPrev}
                className="absolute -left-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8eef6] bg-white text-[#1a2b5e] shadow-md transition hover:border-[#ef3239]/30 hover:text-[#ef3239] sm:-left-2 sm:flex lg:-left-3"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Next reviews"
                onClick={goNext}
                className="absolute -right-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8eef6] bg-white text-[#1a2b5e] shadow-md transition hover:border-[#ef3239]/30 hover:text-[#ef3239] sm:-right-2 sm:flex lg:-right-3"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </>
          ) : null}

          {isLoading ? (
            <div
              className={cn(
                "grid gap-4",
                visible === 1 ? "grid-cols-1" : visible === 2 ? "grid-cols-2" : "grid-cols-3"
              )}
            >
              {Array.from({ length: visible }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 animate-pulse rounded-2xl border border-[#e8eef6] bg-[#f7f9fc]"
                />
              ))}
            </div>
          ) : (
            // -my/py keeps room for the hover lift so card top border isn't clipped
            <div className="-my-3 overflow-hidden px-0 py-3 sm:px-8 lg:px-10">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={safeIndex}
                  custom={direction}
                  initial={
                    prefersReducedMotion
                      ? false
                      : { opacity: 0, x: direction > 0 ? 36 : -36 }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  exit={
                    prefersReducedMotion
                      ? undefined
                      : { opacity: 0, x: direction > 0 ? -36 : 36 }
                  }
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className={cn(
                    "grid gap-4",
                    visible === 1
                      ? "grid-cols-1"
                      : visible === 2
                        ? "grid-cols-2"
                        : "grid-cols-3"
                  )}
                >
                  {pageItems.map((review, i) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      index={safeIndex + i}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {stepCount > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: stepCount }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to review slide ${i + 1}`}
                  aria-current={i === safeIndex ? "true" : undefined}
                  onClick={() => goTo(i, i > safeIndex ? 1 : -1)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === safeIndex
                      ? "w-7 bg-[#ef3239]"
                      : "w-2 bg-[#d1d5db] hover:bg-[#ef3239]/50"
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-10 flex justify-center">
          <Button asChild variant="outline" size="pillLg" className="border-[#1a2b5e]/20 text-[#1a2b5e]">
            <Link href={ROUTES.courses}>Explore courses</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
