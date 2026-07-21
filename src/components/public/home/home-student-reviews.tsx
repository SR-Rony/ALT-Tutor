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

function ReviewCard({ review }: { review: HomeFeaturedReview }) {
  return (
    <article className="group relative flex h-full min-h-[15.5rem] flex-col overflow-hidden rounded-2xl border border-[#e8eef6] bg-[#f7f9fc] p-5 shadow-[0_12px_36px_-28px_rgba(26,43,94,0.45)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c7d7f5] hover:bg-white hover:shadow-[0_18px_40px_-24px_rgba(24,119,242,0.28)] sm:min-h-[16.5rem] sm:p-6">
      <Quote
        className="absolute right-4 top-4 h-8 w-8 text-[#1877f2]/15 transition group-hover:text-[#1877f2]/25"
        aria-hidden
      />
      <RatingStars rating={review.rating} />
      <p className="mt-3 flex-1 text-sm leading-relaxed text-[#334155] sm:text-[0.95rem]">
        “{review.comment}”
      </p>
      <div className="mt-5 flex items-center gap-3 border-t border-[#e8eef6] pt-4">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-sm font-bold text-white">
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
      </div>
    </article>
  );
}

export function HomeStudentReviews() {
  const prefersReducedMotion = useReducedMotion();
  const { data, isLoading } = useHomeData();
  const reviews = data?.featuredReviews ?? [];
  const visible = useVisibleCount();

  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(1);

  const pageCount = useMemo(() => {
    if (reviews.length === 0) return 0;
    return Math.max(1, Math.ceil(reviews.length / visible));
  }, [reviews.length, visible]);

  const safePage = pageCount > 0 ? page % pageCount : 0;

  const pageItems = useMemo(() => {
    const start = safePage * visible;
    return reviews.slice(start, start + visible);
  }, [reviews, safePage, visible]);

  const goTo = useCallback(
    (next: number, dir: number) => {
      if (pageCount <= 1) return;
      setDirection(dir);
      setPage(((next % pageCount) + pageCount) % pageCount);
    },
    [pageCount]
  );

  const goNext = useCallback(() => goTo(safePage + 1, 1), [goTo, safePage]);
  const goPrev = useCallback(() => goTo(safePage - 1, -1), [goTo, safePage]);

  useEffect(() => {
    setPage(0);
  }, [visible, reviews.length]);

  useEffect(() => {
    if (prefersReducedMotion || paused || pageCount <= 1 || isLoading) return;
    const id = window.setInterval(() => {
      setDirection(1);
      setPage((p) => (p + 1) % pageCount);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [prefersReducedMotion, paused, pageCount, isLoading]);

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
          {pageCount > 1 ? (
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
            <div className="overflow-hidden px-0 sm:px-8 lg:px-10">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={safePage}
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
                  {pageItems.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {pageCount > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-2">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to review slide ${i + 1}`}
                  aria-current={i === safePage ? "true" : undefined}
                  onClick={() => goTo(i, i > safePage ? 1 : -1)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === safePage
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
