"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Volume2,
  X,
} from "lucide-react";
import { ROUTES } from "@/constants";

interface MockQuestion {
  id: string;
  subjectCode: string;
  boardTarget: string;
  chapterTitle: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questionNumber: string;
  prompt: string;
  tokens: string[];
  duration: string;
  solvedCount: string;
  rating: string;
  markScheme: string[];
}

const MOCK_QUESTIONS: MockQuestion[] = [
  {
    id: "math",
    subjectCode: "SSC Higher Math",
    boardTarget: "Dhaka Board Target",
    chapterTitle: "Mathematics — Chapter 1: Sets & Functions",
    difficulty: "Medium",
    questionNumber: "Question 04 (Written • 4 Marks)",
    prompt:
      "Given function f(x) = (2x + 1)/(x - 3), where x ≠ 3. Find the domain of the function, compute the inverse function f⁻¹(x), and evaluate f⁻¹(5).",
    tokens: ["Domain: ℝ \\ {3}", "f⁻¹(x) = (3x + 1)/(x - 2)", "Result = 5.33"],
    duration: "4m 12s",
    solvedCount: "14.8k solved",
    rating: "4.9/5",
    markScheme: [
      "[M1] Condition for real definition: x - 3 ≠ 0 ⇒ Domain = ℝ \\ {3}",
      "[M1] Let y = (2x + 1)/(x - 3) ⇒ xy - 3y = 2x + 1 ⇒ x(y - 2) = 3y + 1",
      "[A1] Express x: f⁻¹(x) = (3x + 1)/(x - 2)",
      "[A1] Evaluate: f⁻¹(5) = (3(5) + 1)/(5 - 2) = 16/3 ≈ 5.33",
    ],
  },
  {
    id: "physics",
    subjectCode: "SSC Physics",
    boardTarget: "Rajshahi Board Target",
    chapterTitle: "Physics — Chapter 3: Force & Laws of Motion",
    difficulty: "Easy",
    questionNumber: "Question 02 (Creative • 4 Marks)",
    prompt:
      "A 1200 kg car traveling at 20 m/s is brought to rest over a distance of 40 m by applying uniform braking force. Find the deceleration and braking force.",
    tokens: ["m = 1200 kg", "a = -5 m/s²", "F = 6000 N"],
    duration: "3m 48s",
    solvedCount: "18.2k solved",
    rating: "4.8/5",
    markScheme: [
      "[M1] Apply v² = u² + 2as ⇒ 0 = (20)² + 2·a·(40)",
      "[A1] Calculate a: 80a = -400 ⇒ a = -5 m/s² (deceleration = 5 m/s²)",
      "[M1] Apply Newton's 2nd Law: F = m · a = 1200 kg · 5 m/s²",
      "[A1] State final braking force: F = 6,000 N",
    ],
  },
  {
    id: "chem",
    subjectCode: "HSC Chemistry",
    boardTarget: "Chittagong Board Target",
    chapterTitle: "Chemistry — Chapter 4: Chemical Equilibrium & Kc / Kp",
    difficulty: "Medium",
    questionNumber: "Question 06 (CQ • 4 Marks)",
    prompt:
      "For the reaction N₂(g) + 3H₂(g) ⇌ 2NH₃(g), derive the relation between Kp and Kc at 400 K and explain the effect of increasing overall system pressure.",
    tokens: ["Δn = -2", "Kp = Kc(RT)⁻²", "Equilibrium Shifts Right"],
    duration: "5m 05s",
    solvedCount: "11.5k solved",
    rating: "4.9/5",
    markScheme: [
      "[M1] Moles difference: Δn = 2 - (1 + 3) = -2",
      "[A1] Equilibrium relation: Kp = Kc · (RT)^(-2) = Kc / (RT)²",
      "[M1] Le Chatelier: High pressure shifts equilibrium to fewer gaseous moles",
      "[A1] Forward reaction favored: NH₃ yield increases",
    ],
  },
  {
    id: "bio",
    subjectCode: "SSC Biology",
    boardTarget: "Comilla Board Target",
    chapterTitle: "Biology — Chapter 2: Cells & Mitotic Division",
    difficulty: "Easy",
    questionNumber: "Question 03 (Creative • 4 Marks)",
    prompt:
      "Explain the defining biological events of Anaphase during Mitosis: chromatid separation, spindle fiber contraction, and typical chromosome shapes (V, L, J, I).",
    tokens: ["Centromere Division", "Spindle Pulling", "Diploid 2n State"],
    duration: "3m 30s",
    solvedCount: "16.4k solved",
    rating: "4.9/5",
    markScheme: [
      "[B1] Centromeres divide, splitting sister chromatids into daughter chromosomes",
      "[B1] Traction spindle fibers contract towards opposite centrosomes",
      "[B1] Chromosomes assume characteristic shapes: V, L, J, and I according to centromere position",
      "[B1] Both poles receive an identical diploid (2n) complement of genetic material",
    ],
  },
];

export function HomeHero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showMarkScheme, setShowMarkScheme] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);

  const paginate = useCallback(
    (newDirection: number) => {
      setShowMarkScheme(false);
      setCurrentIndex((prev) => {
        const next = prev + newDirection;
        if (next < 0) return MOCK_QUESTIONS.length - 1;
        if (next >= MOCK_QUESTIONS.length) return 0;
        return next;
      });
    },
    []
  );

  const goToSlide = (index: number) => {
    setShowMarkScheme(false);
    setCurrentIndex(index);
  };

  // Auto-slide questions every 5 seconds (paused when user hovers over card)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      paginate(1);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, paginate]);

  const activeQuestion = MOCK_QUESTIONS[currentIndex];

  return (
    <section id="hero" className="relative w-full border-b border-slate-200 bg-[#F8FAFC]">
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20 xl:py-24">
        {/* Two-Column Grid: Left Text, Right Visual Interactive Mockup */}
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12 xl:gap-16">
          
          {/* Left Column: Text & CTAs */}
          <div className="max-w-2xl text-left">
            {/* Small Badge on top: Trusted by SSC & HSC Students */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-[#1D4ED8] sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-[#1D4ED8]" aria-hidden />
              <span>Trusted by SSC & HSC Students</span>
            </div>

            {/* Main Headline: Clean, bold academic font, slate-900, strictly NO gradients */}
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] xl:text-[3.65rem] leading-[1.15]">
              Master SSC & HSC.
              <br />
              Ace Every Exam.
            </h1>

            {/* Sub-headline */}
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:text-xl">
              Your all-in-one digital school. Practice from a massive Question Bank, solve Past Papers, take custom Practice Exams, and master Key Concepts.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              {/* Primary Button: Solid Blue #1D4ED8 */}
              <Link
                href={ROUTES.auth.register}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#1E40AF]"
              >
                <span>Start Free Practice</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>

              {/* Secondary Button: Outline/Solid Gray */}
              <Link
                href="#question-bank"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-base font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
              >
                <span>Explore Features</span>
              </Link>
            </div>

            {/* Trust highlights */}
            <div className="mt-8 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#1D4ED8]" aria-hidden />
                Chapter-wise topic questions
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#1D4ED8]" aria-hidden />
                Board-aligned video solutions
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#1D4ED8]" aria-hidden />
                Instant mark schemes
              </span>
            </div>
          </div>

          {/* Right Column: Premium CSS/HTML Mockup Card with Sliding Questions */}
          <div
            className="relative mx-auto w-full max-w-xl lg:max-w-none"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Floating Flat Badge 1: Top-Right (🎯 Question Bank) */}
            <div className="absolute -top-4 -right-2 z-20 hidden sm:flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg shadow-slate-200/50">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-base">
                🎯
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Question Bank</p>
                <p className="text-[11px] text-slate-500">50,000+ Topic Questions</p>
              </div>
            </div>

            {/* Floating Flat Badge 2: Bottom-Left (📝 Practice Exam) */}
            <div className="absolute -bottom-4 -left-2 z-20 hidden sm:flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg shadow-slate-200/50">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-base">
                📝
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">Practice Exam</p>
                <p className="text-[11px] text-slate-500">Timed Board Simulations</p>
              </div>
            </div>

            {/* Main Mockup Card Container */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6">
              
              {/* Window Frame Header with Next/Prev Slider Controls */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-slate-200" aria-hidden />
                  <span className="h-3 w-3 rounded-full bg-slate-200" aria-hidden />
                  <span className="h-3 w-3 rounded-full bg-slate-200" aria-hidden />
                </div>
                
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                  <span className="text-xs font-medium text-slate-500">
                    Alt Tutor Question Bank • SSC / HSC
                  </span>
                </div>

                {/* Question Slide Controls */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1 hidden sm:inline">
                    {currentIndex + 1} / {MOCK_QUESTIONS.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => paginate(-1)}
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#1D4ED8]"
                    aria-label="Previous question"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => paginate(1)}
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#1D4ED8]"
                    aria-label="Next question"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Mockup Card Sliding Body */}
              <div className="relative mt-4 min-h-[300px]">
                <div key={activeQuestion.id} className="space-y-4">
                  {/* Subject & Chapter Title with Difficulty and Action Badges */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
                            {activeQuestion.subjectCode}
                          </span>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-500">{activeQuestion.boardTarget}</span>
                        </div>
                        <h3 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                          {activeQuestion.chapterTitle}
                        </h3>
                      </div>

                      {/* Badges: Difficulty & "Buy Question" */}
                      <div className="flex items-center gap-2">
                        {activeQuestion.difficulty === "Easy" ? (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            Easy
                          </span>
                        ) : (
                          <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-[#F59E0B]">
                            Medium
                          </span>
                        )}
                        {/* Interactive Buy Question Badge using Secondary Accent Warm Amber #F59E0B */}
                        <button
                          type="button"
                          onClick={() => setShowBuyModal(true)}
                          className="inline-flex items-center gap-1 rounded-md bg-[#F59E0B] px-2.5 py-0.5 text-xs font-bold text-slate-900 shadow-sm transition-colors hover:bg-amber-400"
                        >
                          <Lock className="h-3 w-3" aria-hidden />
                          <span>Buy Question</span>
                        </button>
                      </div>
                    </div>

                    {/* Question Prompt Preview Box */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>{activeQuestion.questionNumber}</span>
                        <span className="text-[#1D4ED8]">{activeQuestion.boardTarget}</span>
                      </div>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-800">
                        {activeQuestion.prompt}
                      </p>

                      {/* Formula / Working pill badges */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {activeQuestion.tokens.map((token, idx) => (
                          <span
                            key={idx}
                            className={`rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] ${
                              idx === activeQuestion.tokens.length - 1
                                ? "font-semibold text-[#1D4ED8]"
                                : "text-slate-700"
                            }`}
                          >
                            {token}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Mark Scheme Reveal */}
                    {showMarkScheme && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                          <span className="font-bold text-[#1D4ED8]">
                            Official Mark Scheme & Steps (4 Marks)
                          </span>
                          <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] text-slate-500 border border-blue-100">
                            Board Verified
                          </span>
                        </div>
                        <ul className="mt-2.5 space-y-1.5 font-mono text-slate-700">
                          {activeQuestion.markScheme.map((step, sIdx) => (
                            <li key={sIdx} className="flex items-start gap-2">
                              <span className="text-[#1D4ED8] font-bold">✓</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Video Solution Play Button & Solutions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        {/* Play button for video solutions (Solid Blue #1D4ED8) */}
                        <button
                          type="button"
                          onClick={() => setShowVideoModal(true)}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#1D4ED8] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#1E40AF]"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
                          <span>Watch Solution ({activeQuestion.duration})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowMarkScheme(!showMarkScheme)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                            showMarkScheme
                              ? "border-[#1D4ED8] bg-blue-50 text-[#1D4ED8]"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <Sparkles className="h-3.5 w-3.5 text-[#F59E0B]" aria-hidden />
                          <span>{showMarkScheme ? "Hide Scheme" : "Mark Scheme"}</span>
                        </button>
                      </div>

                      {/* Student stats & Rating */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <div className="flex items-center text-[#F59E0B]">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-current" aria-hidden />
                          ))}
                        </div>
                        <span className="font-semibold text-slate-700">{activeQuestion.rating}</span>
                        <span>({activeQuestion.solvedCount})</span>
                      </div>
                    </div>
                  </div>
                </div>

              {/* Slide Indicator Dots at bottom of card */}
              <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3">
                {MOCK_QUESTIONS.map((q, idx) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => goToSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      idx === currentIndex
                        ? "w-6 bg-[#1D4ED8]"
                        : "w-2 bg-slate-200 hover:bg-slate-300"
                    }`}
                    aria-label={`Go to question ${idx + 1}`}
                  />
                ))}
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Video Solution Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
                  {activeQuestion.subjectCode} • Video Masterclass
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {activeQuestion.chapterTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Simulated Video Player */}
            <div className="relative aspect-video w-full bg-slate-950 flex flex-col justify-between p-4">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-medium text-slate-200">
                  {activeQuestion.questionNumber} — Step-by-Step Breakdown
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-blue-400">
                  1080p HD
                </span>
              </div>

              {/* Center animated visual */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1D4ED8] text-white shadow-lg">
                  <Play className="h-8 w-8 fill-current pl-1" />
                </div>
                <p className="mt-3 text-sm font-semibold text-white">
                  Full Video Solution Playing
                </p>
                <p className="text-xs text-slate-400">
                  Explained by Expert Mentor • {activeQuestion.duration}
                </p>
              </div>

              {/* Progress & Controls */}
              <div className="space-y-2">
                <div className="relative h-1.5 w-full rounded-full bg-slate-800">
                  <div className="absolute left-0 top-0 h-full w-[45%] rounded-full bg-[#1D4ED8]" />
                  <div className="absolute left-[45%] top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow-sm" />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-3">
                    <Play className="h-3.5 w-3.5 fill-current text-white" />
                    <RotateCcw className="h-3.5 w-3.5 cursor-pointer hover:text-white" />
                    <Volume2 className="h-3.5 w-3.5 cursor-pointer hover:text-white" />
                    <span className="font-mono text-[11px] text-slate-400">
                      01:42 / {activeQuestion.duration}
                    </span>
                  </div>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                    Speed 1.0x
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-5 py-3.5 bg-slate-50 rounded-b-2xl">
              <span className="text-xs text-slate-500">
                Over 14,000+ students used this solution to prepare for board exams.
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={ROUTES.courses}
                  className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF]"
                  onClick={() => setShowVideoModal(false)}
                >
                  Explore All Video Courses
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buy Question Instant Purchase Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-[#F59E0B]">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Unlock Premium Question
                  </h3>
                  <p className="text-xs text-slate-500">
                    Instant access to complete written solution & video
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBuyModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-[#1D4ED8]">
                {activeQuestion.subjectCode}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {activeQuestion.chapterTitle}
              </p>
              <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                {activeQuestion.prompt}
              </p>

              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-xs">
                <span className="text-slate-500">Price per solution:</span>
                <span className="font-bold text-[#F59E0B]">5 Credits (৳5)</span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  alert(`Successfully unlocked question: ${activeQuestion.chapterTitle}!`);
                  setShowBuyModal(false);
                }}
                className="flex-1 rounded-xl bg-[#1D4ED8] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1E40AF]"
              >
                Confirm Unlock (5 Credits)
              </button>
              <Link
                href={ROUTES.auth.register}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Get Free Account
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
