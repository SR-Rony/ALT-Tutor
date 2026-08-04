"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Check,
  Expand,
  ExternalLink,
  FileText,
  Maximize2,
  Play,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants";
import { useHomeData } from "@/hooks";
import type { HomePracticeQuestion, HomePracticeTab } from "@/types";
import { cn } from "@/utils";

type SideAction = "mark" | "video" | "ai";

function DifficultyStars({ filled }: { filled: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5 sm:h-4 sm:w-4",
            i < filled ? "fill-[#f59e0b] text-[#f59e0b]" : "fill-none text-[#cbd5e1]"
          )}
        />
      ))}
    </span>
  );
}

function PracticeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_24px_60px_-28px_rgba(26,43,94,0.28)] sm:rounded-3xl">
      <div className="flex items-center justify-between gap-3 border-b border-[#eef2f8] px-4 py-3 sm:px-6">
        <div className="h-7 w-24 animate-pulse rounded-md bg-[#e8edf5]" />
        <div className="h-4 w-28 animate-pulse rounded bg-[#e8edf5]" />
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(12rem,15rem)]">
        <div className="space-y-3 border-b border-[#eef2f8] p-4 sm:p-6 lg:border-b-0 lg:border-r lg:p-8">
          <div className="h-4 w-full animate-pulse rounded bg-[#e8edf5]" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-[#e8edf5]" />
          <div className="mt-4 space-y-2.5">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-[#f1f5f9]" />
            ))}
          </div>
        </div>
        <div className="space-y-2.5 bg-[#f8fafc] p-4 sm:p-5">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-xl bg-[#e8edf5]" />
          ))}
          <div className="mt-4 h-10 animate-pulse rounded-xl bg-[#e8edf5]" />
        </div>
      </div>
    </div>
  );
}

function PracticeQuestionCard({
  question,
  prefersReducedMotion,
}: {
  question: HomePracticeQuestion;
  prefersReducedMotion: boolean | null;
}) {
  const [sideAction, setSideAction] = useState<SideAction>("mark");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    setSelectedOption(null);
    setSideAction("mark");
  }, [question.id]);

  const sideButtons = useMemo(
    () =>
      [
        {
          id: "mark" as const,
          label: "Mark Scheme",
          icon: FileText,
          badge: null as number | null,
        },
        {
          id: "video" as const,
          label: "Video Solutions",
          icon: Play,
          badge: question.videoCount > 0 ? question.videoCount : null,
        },
        {
          id: "ai" as const,
          label: "AI Feedback",
          icon: Sparkles,
          badge: null as number | null,
        },
      ] as const,
    [question.videoCount]
  );

  const isCorrect =
    selectedOption != null ? selectedOption === question.correctAnswer : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_24px_60px_-28px_rgba(26,43,94,0.28)] sm:rounded-3xl">
      <div className="flex items-center justify-between gap-3 border-b border-[#eef2f8] px-4 py-3 sm:px-6 sm:py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          {question.calculator ? (
            <span className="inline-flex shrink-0 items-center rounded-md bg-[#e8f2fe] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1877f2] sm:text-xs">
              Calculator
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center rounded-md bg-[#fff1ee] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#ef3239] sm:text-xs">
              No calculator
            </span>
          )}
          <div className="hidden min-w-0 items-center gap-2 sm:flex">
            <span className="text-sm font-semibold text-[#f59e0b]">{question.difficulty}</span>
            <DifficultyStars filled={question.stars} />
            <span className="truncate text-xs text-[#94a3b8]">
              {question.subtopicTitle}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          <span className="text-xs font-semibold text-[#f59e0b]">{question.difficulty}</span>
          <DifficultyStars filled={question.stars} />
        </div>
        <Link
          href={question.studyHref}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#64748b] transition hover:bg-[#e8f2fe] hover:text-[#1877f2]"
          aria-label="Open full questionbank study set"
        >
          <Maximize2 className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(12rem,15rem)]">
        <div className="border-b border-[#eef2f8] p-4 sm:p-6 lg:border-b-0 lg:border-r lg:p-8">
          <p className="text-sm leading-relaxed text-[#1a1a2e] sm:text-base">{question.prompt}</p>

          {question.figureLabel ? (
            <p className="mt-3 text-xs font-semibold text-[#64748b]">{question.figureLabel}</p>
          ) : null}

          {question.diagramUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={question.diagramUrl}
              alt="Question diagram"
              className="mt-3 max-h-48 w-auto max-w-full rounded-lg border border-[#e8edf5]"
            />
          ) : null}

          {question.body ? (
            <p className="mt-4 text-sm font-medium leading-relaxed text-[#1a1a2e] sm:text-base">
              {question.body}{" "}
              <span className="font-bold text-[#1877f2]">[{question.marks}]</span>
            </p>
          ) : (
            <p className="mt-3 text-sm font-bold text-[#1877f2]">[{question.marks}]</p>
          )}

          {question.options.length > 0 ? (
            <ul className="mt-5 space-y-2.5">
              {question.options.map((option) => {
                const isSelected = selectedOption === option.key;
                const showResult = selectedOption != null;
                const isAnswer = option.key === question.correctAnswer;
                return (
                  <li key={option.key}>
                    <button
                      type="button"
                      onClick={() => setSelectedOption(option.key)}
                      className={cn(
                        "flex w-full cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-all duration-200 sm:px-4 sm:py-3.5 sm:text-base",
                        showResult && isAnswer
                          ? "border-emerald-500 bg-emerald-50 text-[#1a1a2e] shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
                          : showResult && isSelected && !isAnswer
                            ? "border-[#ef3239] bg-[#fff1ee] text-[#1a1a2e]"
                            : isSelected
                              ? "border-[#1877f2] bg-[#e8f2fe] text-[#1a1a2e] shadow-[0_0_0_3px_rgba(24,119,242,0.12)]"
                              : "border-[#e8edf5] bg-white text-[#1a2b5e] hover:border-[#1877f2]/40 hover:bg-[#f8fbff]"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                          showResult && isAnswer
                            ? "bg-emerald-500 text-white"
                            : showResult && isSelected && !isAnswer
                              ? "bg-[#ef3239] text-white"
                              : isSelected
                                ? "bg-[#1877f2] text-white"
                                : "bg-[#e8f2fe] text-[#1877f2]"
                        )}
                      >
                        {showResult && isAnswer ? (
                          <Check className="h-3.5 w-3.5" aria-hidden />
                        ) : showResult && isSelected && !isAnswer ? (
                          <X className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          option.key
                        )}
                      </span>
                      <span className="pt-0.5 font-medium">{option.text}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-[#dce4f0] bg-[#f8fafc] px-4 py-5 text-sm text-[#58688b]">
              Open-ended response — use Mark Scheme and Video Solutions to check your answer.
            </div>
          )}

          {isCorrect != null ? (
            <p
              className={cn(
                "mt-4 text-sm font-semibold",
                isCorrect ? "text-emerald-600" : "text-[#ef3239]"
              )}
            >
              {isCorrect
                ? "Correct — well done."
                : `Not quite — the answer is ${question.correctAnswer}.`}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2.5 bg-[#f8fafc] p-4 sm:p-5 lg:bg-white">
          {sideButtons.map((btn) => {
            const Icon = btn.icon;
            const isActive = sideAction === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setSideAction(btn.id)}
                className={cn(
                  "relative flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-[#e8f2fe] text-[#1877f2] shadow-sm"
                    : "border border-[#e8edf5] bg-white text-[#1a2b5e] hover:border-[#1877f2]/30 hover:bg-[#e8f2fe]/60 hover:text-[#1877f2]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">{btn.label}</span>
                {btn.badge != null ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1877f2] px-1.5 text-[10px] font-bold text-white">
                    {btn.badge}
                  </span>
                ) : null}
              </button>
            );
          })}

          <AnimatePresence mode="wait">
            <motion.div
              key={sideAction}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="mt-1 rounded-xl border border-[#e8edf5] bg-white p-3.5 text-xs leading-relaxed text-[#58688b] sm:text-sm"
            >
              {sideAction === "mark" ? (
                question.markScheme ? (
                  <p className="whitespace-pre-wrap text-[#1a2b5e]">{question.markScheme}</p>
                ) : (
                  <p>
                    Open this study set for the full examiner mark scheme and common mistakes.
                  </p>
                )
              ) : null}
              {sideAction === "video" ? (
                question.videoUrl ? (
                  <a
                    href={question.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-[#1877f2] hover:underline"
                  >
                    Watch video solution
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                ) : (
                  <p>
                    Video walkthroughs unlock inside the questionbank — open the study set to
                    practise with mentor solutions.
                  </p>
                )
              ) : null}
              {sideAction === "ai" ? (
                <p>
                  Sign in and open the study set for AI feedback on your working and suggested next
                  topics.
                </p>
              ) : null}
            </motion.div>
          </AnimatePresence>

          <Link
            href={ROUTES.subjectResource(question.programSlug, "key-concepts")}
            className="mt-auto inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1877f2] transition hover:bg-[#e8f2fe]"
          >
            <BookOpen className="h-4 w-4" aria-hidden />
            {question.bookletLabel}
            <Expand className="h-3.5 w-3.5 opacity-70" aria-hidden />
          </Link>

          <Link
            href={question.studyHref}
            className="inline-flex items-center justify-center rounded-xl bg-[#1877f2] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1466db]"
          >
            Try Questionbank
          </Link>
        </div>
      </div>
    </div>
  );
}

export function HomePracticeQuestions() {
  const prefersReducedMotion = useReducedMotion();
  const { data, isLoading, isError } = useHomeData();
  const practice = data?.practiceQuestions;

  const tabs: HomePracticeTab[] = practice?.tabs ?? [];
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    if (tabs.length === 0) {
      setActiveTab("");
      return;
    }
    if (!tabs.some((t) => t.id === activeTab)) {
      setActiveTab(tabs[0]!.id);
    }
  }, [tabs, activeTab]);

  const active = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  if (!isLoading && (isError || tabs.length === 0)) {
    return null;
  }

  return (
    <section className="relative w-full overflow-x-clip bg-[#e8f2fe]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 h-56 w-56 rounded-full bg-[#1877f2]/10 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-[#ef3239]/8 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1a1a2e] sm:text-3xl lg:text-4xl">
            {practice?.title ?? "Practice SSC & HSC Exam Style Questions"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#58688b] sm:text-base lg:mt-4">
            {practice?.subtitle ??
              "Thousands of exam-style questions, filtered by topic and difficulty, with detailed mark schemes and video solutions for every question."}
          </p>
        </div>

        {isLoading ? (
          <div className="mt-8 sm:mt-10">
            <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-8 w-24 animate-pulse rounded bg-[#dbe7f8]" />
              ))}
            </div>
            <PracticeCardSkeleton />
          </div>
        ) : active ? (
          <>
            <div
              role="tablist"
              aria-label="Subject areas"
              className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:mt-10 sm:gap-3"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveTab(tab.id)}
                    onFocus={() => setActiveTab(tab.id)}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "group relative cursor-pointer px-3 py-2 text-sm font-semibold transition-colors duration-300 sm:px-4 sm:text-base",
                      isActive
                        ? "text-[#ef3239]"
                        : "text-[#1a2b5e]/75 hover:text-[#ef3239]"
                    )}
                  >
                    {tab.label}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-0 -bottom-0.5 h-0.5 origin-left rounded-full bg-gradient-to-r from-[#3b8dee] via-[#ff6b35] to-[#ef3239] transition-transform duration-300 ease-out",
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      )}
                    />
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active.question.id}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.28 }}
                className="mt-8 sm:mt-10"
              >
                <PracticeQuestionCard
                  question={active.question}
                  prefersReducedMotion={prefersReducedMotion}
                />
              </motion.div>
            </AnimatePresence>
          </>
        ) : null}
      </div>
    </section>
  );
}
