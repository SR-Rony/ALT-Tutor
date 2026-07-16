"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BookOpen,
  Expand,
  FileText,
  Maximize2,
  Play,
  Sparkles,
  Star,
} from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants";
import { cn } from "@/utils";
import { practiceExamQuestions } from "./data/home.data";

type TabId = (typeof practiceExamQuestions.tabs)[number]["id"];
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

function MaxwellBoltzmannFigure() {
  return (
    <div className="relative mx-auto my-4 w-full max-w-md overflow-hidden rounded-xl border border-[#e8edf5] bg-[#f8fafc] p-4 sm:p-5">
      <svg viewBox="0 0 360 200" className="h-auto w-full" aria-hidden>
        <text x="8" y="20" className="fill-[#64748b]" fontSize="11">
          Number of particles
        </text>
        <line x1="40" y1="20" x2="40" y2="160" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="40" y1="160" x2="340" y2="160" stroke="#94a3b8" strokeWidth="1.5" />
        <path
          d="M40 160 C 80 155, 100 40, 160 50 C 210 58, 240 120, 280 145 C 310 155, 330 158, 340 160"
          fill="none"
          stroke="#1877f2"
          strokeWidth="2.5"
        />
        <path
          d="M180 160 L180 78 C 200 90, 230 130, 260 148 L260 160 Z"
          fill="#ef3239"
          fillOpacity="0.35"
        />
        <path
          d="M260 160 L260 148 C 290 155, 320 158, 340 160 Z"
          fill="#389452"
          fillOpacity="0.4"
        />
        <line x1="180" y1="30" x2="180" y2="160" stroke="#1a1a2e" strokeWidth="1" strokeDasharray="4 3" />
        <text x="168" y="24" className="fill-[#1a1a2e]" fontSize="12" fontWeight="700">
          Ea
        </text>
        <text x="205" y="130" className="fill-[#ef3239]" fontSize="14" fontWeight="700">
          X
        </text>
        <text x="285" y="150" className="fill-[#389452]" fontSize="14" fontWeight="700">
          Y
        </text>
        <text x="160" y="182" className="fill-[#64748b]" fontSize="11">
          Energy
        </text>
      </svg>
      <p className="mt-1 text-center text-[11px] font-medium text-[#64748b]">
        Maxwell–Boltzmann energy distribution
      </p>
    </div>
  );
}

function BiodiversityFigure() {
  return (
    <div className="my-4 overflow-hidden rounded-xl border border-[#e8edf5] bg-gradient-to-br from-[#fff7ed] via-[#f0fdf4] to-[#e8f2fe] p-4 sm:p-5">
      <p className="text-center text-xs font-bold uppercase tracking-wide text-[#1a1a2e] sm:text-sm">
        Figure: Biodiversity-related jobs in South Africa
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Tourism", value: "42%", color: "#1877f2" },
          { label: "Conservation", value: "23%", color: "#389452" },
          { label: "Agriculture", value: "21%", color: "#f59e0b" },
          { label: "Research", value: "14%", color: "#ef3239" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-white/90 p-3 text-center shadow-sm">
            <p className="text-lg font-extrabold" style={{ color: item.color }}>
              {item.value}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#64748b]">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomePracticeQuestions() {
  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<TabId>("mathematics");
  const [sideAction, setSideAction] = useState<SideAction>("mark");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const question = practiceExamQuestions.questions[activeTab];

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
          badge: question.videoCount,
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

  const onTabChange = (id: TabId) => {
    setActiveTab(id);
    setSelectedOption(null);
    setSideAction("mark");
  };

  return (
    <section className="relative w-full overflow-x-clip bg-[#e8f2fe]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 h-56 w-56 rounded-full bg-[#1877f2]/10 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-[#ef3239]/8 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#1a1a2e] sm:text-3xl lg:text-4xl">
            {practiceExamQuestions.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#58688b] sm:text-base lg:mt-4">
            {practiceExamQuestions.subtitle}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Subject areas"
          className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:mt-10 sm:gap-3"
        >
          {practiceExamQuestions.tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onMouseEnter={() => onTabChange(tab.id)}
                onFocus={() => onTabChange(tab.id)}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "cursor-pointer rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300 sm:px-5 sm:py-3 sm:text-base",
                  isActive
                    ? "bg-[#1877f2] text-white shadow-[0_10px_28px_-12px_rgba(24,119,242,0.55)]"
                    : "border border-[#dce4f0] bg-white text-[#1a2b5e] hover:border-[#1877f2]/35 hover:text-[#1877f2]"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.28 }}
            className="mt-8 sm:mt-10"
          >
            <div className="overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_24px_60px_-28px_rgba(26,43,94,0.28)] sm:rounded-3xl">
              {/* Toolbar */}
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
                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="text-sm font-semibold text-[#f59e0b]">{question.difficulty}</span>
                    <DifficultyStars filled={question.stars} />
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:hidden">
                  <span className="text-xs font-semibold text-[#f59e0b]">{question.difficulty}</span>
                  <DifficultyStars filled={question.stars} />
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-[#64748b] transition hover:bg-[#e8f2fe] hover:text-[#1877f2]"
                  aria-label="Expand preview"
                >
                  <Maximize2 className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(12rem,15rem)]">
                {/* Question body */}
                <div className="border-b border-[#eef2f8] p-4 sm:p-6 lg:border-b-0 lg:border-r lg:p-8">
                  <p className="text-sm leading-relaxed text-[#1a1a2e] sm:text-base">
                    {question.prompt}
                  </p>

                  {activeTab === "sciences" ? <MaxwellBoltzmannFigure /> : null}
                  {activeTab === "individuals" ? <BiodiversityFigure /> : null}

                  {question.figureLabel && activeTab !== "sciences" && activeTab !== "individuals" ? (
                    <p className="mt-3 text-xs font-semibold text-[#64748b]">{question.figureLabel}</p>
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
                        return (
                          <li key={option.key}>
                            <button
                              type="button"
                              onClick={() => setSelectedOption(option.key)}
                              className={cn(
                                "flex w-full cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-all duration-200 sm:px-4 sm:py-3.5 sm:text-base",
                                isSelected
                                  ? "border-[#1877f2] bg-[#e8f2fe] text-[#1a1a2e] shadow-[0_0_0_3px_rgba(24,119,242,0.12)]"
                                  : "border-[#e8edf5] bg-white text-[#1a2b5e] hover:border-[#1877f2]/40 hover:bg-[#f8fbff]"
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                                  isSelected
                                    ? "bg-[#1877f2] text-white"
                                    : "bg-[#e8f2fe] text-[#1877f2]"
                                )}
                              >
                                {option.key}
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
                </div>

                {/* Side actions */}
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
                        <p>
                          Detailed mark scheme with examiner notes and common mistakes for this
                          question.
                        </p>
                      ) : null}
                      {sideAction === "video" ? (
                        <p>
                          Step-by-step video walkthrough from Alt Tutor mentors — pause, rewind, and
                          re-attempt.
                        </p>
                      ) : null}
                      {sideAction === "ai" ? (
                        <p>
                          Get instant AI feedback on your working and suggested next topics to
                          practise.
                        </p>
                      ) : null}
                    </motion.div>
                  </AnimatePresence>

                  <button
                    type="button"
                    className="mt-auto inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1877f2] transition hover:bg-[#e8f2fe]"
                  >
                    <BookOpen className="h-4 w-4" aria-hidden />
                    {question.bookletLabel}
                    <Expand className="h-3.5 w-3.5 opacity-70" aria-hidden />
                  </button>

                  <Link
                    href={ROUTES.courses}
                    className="inline-flex items-center justify-center rounded-xl bg-[#1877f2] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1466db]"
                  >
                    Try Questionbank
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
