"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  Play,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Volume2,
  X,
  XCircle,
} from "lucide-react";
import { ROUTES } from "@/constants";

export function HomeMarketplaceSection() {
  const [activeTab, setActiveTab] = useState<"mcq" | "written">("mcq");
  
  // MCQ state
  const [selectedMcqAnswer, setSelectedMcqAnswer] = useState<string | null>(null);
  const [isMcqBookmarked, setIsMcqBookmarked] = useState(false);
  const [isMcqCompleted, setIsMcqCompleted] = useState(false);
  
  // Written state
  const [isWrittenBookmarked, setIsWrittenBookmarked] = useState(false);
  const [isWrittenCompleted, setIsWrittenCompleted] = useState(false);
  const [showWrittenAnswerDraft, setShowWrittenAnswerDraft] = useState(false);

  // Modals state
  const [activeModal, setActiveModal] = useState<"scheme" | "video" | "notes" | null>(null);

  const resetMcq = () => {
    setSelectedMcqAnswer(null);
  };

  return (
    <section id="question-bank" className="w-full border-t border-slate-200 bg-[#F8FAFC] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-[#1D4ED8]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive Question Bank Showcase</span>
          </div>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Real Exam Practice: MCQ &amp; Written Questions
          </h2>
          <p className="mt-3 text-base text-slate-500 sm:text-lg">
            Experience our actual Question Bank interface. Test interactive MCQs with instant feedback, or practice full structured written questions with official mark schemes and video explanations.
          </p>

          {/* Interactive Mode Tabs */}
          <div className="mt-8 inline-flex rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => {
                setActiveTab("mcq");
                setActiveModal(null);
              }}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                activeTab === "mcq"
                  ? "bg-[#1D4ED8] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Interactive MCQ (Paper 1)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("written");
                setActiveModal(null);
              }}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                activeTab === "written"
                  ? "bg-[#1D4ED8] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Structured Written (Paper 2 &amp; 4)</span>
            </button>
          </div>
        </div>

        {/* Main Interactive Showcase Card */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
          
          {/* Top Breadcrumb / Study Set Context Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-semibold text-slate-900">Cambridge Physics AS Level 9702</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">
                {activeTab === "mcq" ? "1.1 Physical Quantities & Units" : "3.1 Gravitational Fields & Mechanics"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#1D4ED8]">
                {activeTab === "mcq" ? "9 Practice Questions in this Set" : "12 Theory Questions in this Set"}
              </span>
              <Link
                href="/subjects/cambridge-physics-as-level-9702/questionbank"
                className="inline-flex items-center gap-1 font-semibold text-[#1D4ED8] hover:underline"
              >
                <span>Open Full Study Set</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Question Body & Side Action Bar Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px]">
            
            {/* Left: Question Content */}
            <div className="p-6 sm:p-8">
              
              {/* Question 1: MCQ TAB */}
              {activeTab === "mcq" && (
                <div>
                  {/* Meta Badges Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        Calculator
                      </span>
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#1D4ED8]">
                        Paper 11 - MCQ
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        [1 Mark]
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <span>Easy</span>
                        <span className="flex gap-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                        </span>
                      </div>
                    </div>

                    <span className="font-mono text-xs text-slate-400">
                      [s15_11_Q1]
                    </span>
                  </div>

                  {/* Question Prompt */}
                  <div className="mt-5">
                    <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                      Question 1
                    </h3>
                    <p className="mt-2 text-base leading-relaxed text-slate-800">
                      Which of the following is an SI base unit?
                    </p>
                  </div>

                  {/* MCQ Options List */}
                  <div className="mt-6 space-y-2.5">
                    {[
                      { letter: "A", text: "current", isCorrect: false },
                      { letter: "B", text: "gram", isCorrect: false },
                      { letter: "C", text: "kelvin", isCorrect: true },
                      { letter: "D", text: "volt", isCorrect: false },
                    ].map((opt) => {
                      const isSelected = selectedMcqAnswer === opt.letter;
                      const hasAnswered = selectedMcqAnswer !== null;

                      let rowStyle = "border-slate-200 bg-white text-slate-800 hover:border-[#1D4ED8] hover:bg-blue-50/30";
                      if (hasAnswered) {
                        if (opt.isCorrect) {
                          rowStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold";
                        } else if (isSelected && !opt.isCorrect) {
                          rowStyle = "border-rose-400 bg-rose-50 text-rose-900";
                        } else {
                          rowStyle = "border-slate-200 bg-slate-50/50 text-slate-400 opacity-60";
                        }
                      }

                      return (
                        <div
                          key={opt.letter}
                          onClick={() => !hasAnswered && setSelectedMcqAnswer(opt.letter)}
                          className={`flex items-center justify-between rounded-xl border p-3.5 text-sm transition-all cursor-pointer ${rowStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white font-mono text-xs font-bold text-slate-700 shadow-xs">
                              {opt.letter}
                            </span>
                            <span className="text-sm font-medium">{opt.text}</span>
                          </div>

                          {hasAnswered && opt.isCorrect && (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Correct Base Unit</span>
                            </span>
                          )}

                          {hasAnswered && isSelected && !opt.isCorrect && (
                            <span className="flex items-center gap-1 text-xs font-bold text-rose-600">
                              <XCircle className="h-4 w-4" />
                              <span>Incorrect</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Answer Selector Buttons (Matching Screenshot 3: [ A ] [ B ] [ C ] [ D ]) */}
                  <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        Choose an answer:
                      </span>
                      {selectedMcqAnswer && (
                        <button
                          type="button"
                          onClick={resetMcq}
                          className="text-xs font-semibold text-[#1D4ED8] hover:underline"
                        >
                          Reset / Try Again
                        </button>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-3">
                      {["A", "B", "C", "D"].map((letter) => {
                        const isSelected = selectedMcqAnswer === letter;
                        const isCorrect = letter === "C";
                        const hasAnswered = selectedMcqAnswer !== null;

                        let btnStyle = "border-slate-300 bg-white text-slate-700 hover:border-[#1D4ED8] hover:text-[#1D4ED8] hover:bg-blue-50/50";
                        if (hasAnswered) {
                          if (isCorrect) {
                            btnStyle = "border-emerald-500 bg-emerald-500 text-white font-bold shadow-sm";
                          } else if (isSelected && !isCorrect) {
                            btnStyle = "border-rose-500 bg-rose-500 text-white font-bold shadow-sm";
                          } else {
                            btnStyle = "border-slate-200 bg-white text-slate-300 opacity-50";
                          }
                        }

                        return (
                          <button
                            key={letter}
                            type="button"
                            onClick={() => setSelectedMcqAnswer(letter)}
                            className={`flex h-11 items-center justify-center rounded-lg border text-sm font-bold transition-all shadow-xs ${btnStyle}`}
                          >
                            <span>{letter}</span>
                            {hasAnswered && isCorrect && <Check className="ml-1.5 h-3.5 w-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Immediate Explanation Feedback Box when answered */}
                  {selectedMcqAnswer && (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-slate-700">
                      <div className="flex items-center justify-between font-bold text-[#1D4ED8] pb-1 border-b border-blue-100">
                        <span>Explanation &amp; Concept Check</span>
                        <span className="font-mono text-[10px] text-slate-500">Cambridge Syllabus Guidance</span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-700">
                        <strong>C is correct:</strong> Kelvin (K) is one of the 7 SI base units (for thermodynamic temperature).
                      </p>
                      <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-slate-600">
                        <li><strong>Current</strong> is a physical quantity, not a unit (its SI base unit is the Ampere, A).</li>
                        <li><strong>Gram</strong> is a prefix submultiple; the SI base unit of mass is kilogram (kg).</li>
                        <li><strong>Volt</strong> is a derived unit (1 V = 1 W/A = 1 kg·m²·s⁻³·A⁻¹).</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Question 2: WRITTEN TAB (Matching Screenshot 4) */}
              {activeTab === "written" && (
                <div>
                  {/* Meta Badges Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        Calculator
                      </span>
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#1D4ED8]">
                        Paper 22 - Theory
                      </span>
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-[#F59E0B] border border-amber-200">
                        Maximum Mark: 10
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
                        <span>Medium</span>
                        <span className="flex gap-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                        </span>
                      </div>
                    </div>

                    <span className="font-mono text-xs text-slate-400">
                      [s17_v42_Q1]
                    </span>
                  </div>

                  {/* Question Content */}
                  <div className="mt-5 space-y-6">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                        Question 1
                      </h3>
                      <div className="mt-2 text-xs font-semibold text-slate-500">
                        [Maximum mark: 10]
                      </div>
                    </div>

                    {/* Part (a) */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-slate-800">
                          <strong>(a)</strong> State Newton&apos;s law of gravitation.
                        </p>
                        <span className="shrink-0 rounded bg-white px-2 py-0.5 font-mono text-xs font-bold text-[#1D4ED8] border border-slate-200">
                          [2 Marks]
                        </span>
                      </div>

                      {/* Mock Paper Ruled Lines */}
                      <div className="mt-3 space-y-3 pt-2">
                        <div className="h-0.5 w-full border-b border-dashed border-slate-300" />
                        <div className="h-0.5 w-full border-b border-dashed border-slate-300" />
                      </div>
                    </div>

                    {/* Part (b) */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium leading-relaxed text-slate-800">
                          <strong>(b)</strong> The planet Jupiter and one of its moons, Io, may be considered to be uniform spheres that are isolated in space. Jupiter has radius <span className="font-mono font-semibold">R</span> and mean density <span className="font-mono font-semibold">&rho;</span>. Io has mass <span className="font-mono font-semibold">m</span> and is in a circular orbit about Jupiter with radius <span className="font-mono font-semibold">nR</span>.
                        </p>
                        <span className="shrink-0 rounded bg-white px-2 py-0.5 font-mono text-xs font-bold text-[#1D4ED8] border border-slate-200 ml-2">
                          [8 Marks]
                        </span>
                      </div>

                      {/* Diagram Container */}
                      <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-5 text-center">
                        <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-2 border-dashed border-blue-300 bg-blue-50/30">
                          {/* Jupiter Center Sphere */}
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-center text-xs font-bold text-white shadow-md">
                            Jupiter<br />(R, &rho;)
                          </div>
                          {/* Io Orbiting Moon */}
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1">
                            <div className="h-5 w-5 rounded-full bg-[#F59E0B] border-2 border-white shadow-sm" />
                            <span className="font-mono text-[10px] font-bold text-slate-700">Io (m)</span>
                          </div>
                          <span className="absolute bottom-2 font-mono text-[11px] text-slate-500">
                            Orbit radius = nR
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                          Fig. 8.1: Orbital mechanics simulation of Io orbiting Jupiter
                        </p>
                      </div>

                      <p className="mt-4 text-sm font-medium text-slate-800">
                        Show that the time <span className="font-mono font-semibold">T</span> for Io to complete one orbit is related to the mean density <span className="font-mono font-semibold">&rho;</span> of Jupiter by the expression:
                      </p>

                      <div className="mt-3 flex justify-center">
                        <div className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 font-mono text-base font-bold text-slate-900 shadow-xs">
                          &rho; T&sup2; = (3&pi; n&sup3;) / G
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowWrittenAnswerDraft(!showWrittenAnswerDraft)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8] hover:underline"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>{showWrittenAnswerDraft ? "Hide Student Solution" : "View Worked Solution Proof"}</span>
                        </button>
                        <span className="text-xs text-slate-400">G = gravitational constant</span>
                      </div>

                      {showWrittenAnswerDraft && (
                        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/70 p-3.5 text-xs font-mono text-slate-700 space-y-1.5">
                          <p><strong>Step 1:</strong> Gravitational force = Centripetal force ⇒ G·M·m / (nR)&sup2; = m·&omega;&sup2;·(nR)</p>
                          <p><strong>Step 2:</strong> Substitute &omega; = 2&pi;/T ⇒ G·M / (n&sup2;R&sup2;) = 4&pi;&sup2;nR / T&sup2; ⇒ G·M·T&sup2; = 4&pi;&sup2;n&sup3;R&sup3;</p>
                          <p><strong>Step 3:</strong> Mass of Jupiter in terms of density: M = &rho;·V = &rho;·(4/3 &pi; R&sup3;)</p>
                          <p><strong>Step 4:</strong> G·[&rho;·(4/3 &pi; R&sup3;)]·T&sup2; = 4&pi;&sup2;n&sup3;R&sup3; ⇒ &rho;·T&sup2; = (3&pi; n&sup3;) / G (Q.E.D.)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right: Side Action Bar (Exactly matching Screenshot 3 & 4) */}
            <div className="border-t border-slate-200 bg-slate-50/50 p-4 lg:border-t-0 lg:border-l lg:p-5 flex flex-col justify-between">
              
              <div className="space-y-2">
                {/* Bookmark & Checkmark status bar */}
                <div className="flex items-center justify-center divide-x divide-slate-200 border-b border-slate-200 pb-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === "mcq") setIsMcqBookmarked(!isMcqBookmarked);
                      else setIsWrittenBookmarked(!isWrittenBookmarked);
                    }}
                    className={`px-3 py-1 text-xs font-semibold transition-colors flex items-center gap-1 ${
                      (activeTab === "mcq" ? isMcqBookmarked : isWrittenBookmarked)
                        ? "text-[#1D4ED8]"
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                    title="Bookmark Question"
                  >
                    <Bookmark className="h-4 w-4" />
                    <span>Bookmark</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === "mcq") setIsMcqCompleted(!isMcqCompleted);
                      else setIsWrittenCompleted(!isWrittenCompleted);
                    }}
                    className={`px-3 py-1 text-xs font-semibold transition-colors flex items-center gap-1 ${
                      (activeTab === "mcq" ? isMcqCompleted : isWrittenCompleted)
                        ? "text-emerald-600"
                        : "text-slate-400 hover:text-emerald-600"
                    }`}
                    title="Mark as completed"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{(activeTab === "mcq" ? isMcqCompleted : isWrittenCompleted) ? "Done" : "Complete"}</span>
                  </button>
                </div>

                {/* Mark Scheme Button */}
                <button
                  type="button"
                  onClick={() => setActiveModal("scheme")}
                  className="flex h-10 w-full items-center justify-between rounded-lg bg-blue-50 px-3.5 text-xs font-bold text-[#1D4ED8] transition-colors hover:bg-blue-100"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Mark Scheme</span>
                  </div>
                  <span className="rounded bg-white px-1.5 py-0.5 text-[10px] text-[#1D4ED8] border border-blue-200">
                    Official
                  </span>
                </button>

                {/* Video Solutions Button */}
                <button
                  type="button"
                  onClick={() => setActiveModal("video")}
                  className="flex h-10 w-full items-center justify-between rounded-lg bg-blue-50 px-3.5 text-xs font-bold text-[#1D4ED8] transition-colors hover:bg-blue-100"
                >
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    <span>Video Solutions</span>
                  </div>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1D4ED8] text-[10px] font-bold text-white">
                    1
                  </span>
                </button>

                {/* Notes Button */}
                <button
                  type="button"
                  onClick={() => setActiveModal("notes")}
                  className="flex h-10 w-full items-center justify-between rounded-lg bg-slate-100 px-3.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Revision Notes</span>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
                </button>
              </div>

              {/* Bottom Quick Links in Side Bar */}
              <div className="mt-6 border-t border-slate-200 pt-4 space-y-2">
                <Link
                  href="/subjects/cambridge-physics-as-level-9702/questionbank"
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  <span>Physics 9702 Bank</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </Link>

                <Link
                  href={ROUTES.courses}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                >
                  <span>All Curricula</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              </div>

            </div>

          </div>

          {/* Bottom Banner inside Card */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-[#1D4ED8]">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Ready to practice more questions like this?
                </p>
                <p className="text-[11px] text-slate-500">
                  Access 50,000+ topic-sorted questions with step mark schemes &amp; HD video walkthroughs.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/subjects/cambridge-physics-as-level-9702/questionbank"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#1E40AF]"
              >
                <span>Open Physics Question Bank</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* MARK SCHEME MODAL */}
      {activeModal === "scheme" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
                  Official Mark Scheme
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {activeTab === "mcq" ? "Question 1 (Paper 11 - MCQ)" : "Question 1 (Paper 22 - Theory • 10 Marks)"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs font-mono">
              {activeTab === "mcq" ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-slate-700">
                  <p className="font-bold text-[#1D4ED8] text-sm">Key Answer: C (kelvin)</p>
                  <p><strong>[1 Mark]</strong> Awarded for selecting option C.</p>
                  <div className="mt-2 border-t border-slate-200 pt-2 space-y-1 text-slate-600">
                    <p>• Kelvin (K) is the SI base unit of thermodynamic temperature.</p>
                    <p>• Electric current has base unit Ampere (A).</p>
                    <p>• Mass has base unit kilogram (kg), not gram.</p>
                    <p>• Volt is a derived unit: 1 V = 1 W/A = 1 kg·m²·s⁻³·A⁻¹.</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-slate-700">
                  <div>
                    <p className="font-bold text-[#1D4ED8] text-xs">Part (a) [2 Marks]</p>
                    <p className="mt-1"><strong>[M1]</strong> Force of attraction between two point masses is directly proportional to product of masses and inversely proportional to square of separation.</p>
                    <p><strong>[A1]</strong> Specifically stating point masses or spherical uniform mass distribution.</p>
                  </div>

                  <div className="border-t border-slate-200 pt-2">
                    <p className="font-bold text-[#1D4ED8] text-xs">Part (b) [8 Marks]</p>
                    <p className="mt-1"><strong>[M1]</strong> GMm / (nR)² = m·&omega;²·(nR) [Gravitational force = Centripetal force]</p>
                    <p><strong>[M1]</strong> &omega; = 2&pi; / T ⇒ GM / (n²R²) = 4&pi;²·nR / T²</p>
                    <p><strong>[A1]</strong> GM·T² = 4&pi;²·n³R³</p>
                    <p><strong>[M1]</strong> Density formula: &rho; = M / V = M / (4/3 &pi; R³)</p>
                    <p><strong>[A1]</strong> M = 4/3 &pi; &rho; R³</p>
                    <p><strong>[A1]</strong> G·(4/3 &pi; &rho; R³)·T² = 4&pi;²·n³R³ ⇒ &rho;·T² = 3&pi;·n³ / G (complete algebraic proof)</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-xl bg-[#1D4ED8] px-5 py-2 text-xs font-bold text-white hover:bg-[#1E40AF]"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO SOLUTIONS MODAL */}
      {activeModal === "video" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
                  Video Walkthrough (Teacher Explanation)
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {activeTab === "mcq" ? "Question 1: SI Units & Prefixes" : "Question 1: Gravitation & Orbital Density"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Viewport Mockup */}
            <div className="relative aspect-video w-full bg-slate-950 flex flex-col justify-between p-4">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>{activeTab === "mcq" ? "[s15_11_Q1] Step-by-Step" : "[s17_v42_Q1] Full CQ Derivation"}</span>
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-blue-400">1080p HD</span>
              </div>

              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1D4ED8] text-white shadow-lg">
                  <Play className="h-8 w-8 fill-current pl-1" />
                </div>
                <p className="mt-3 text-sm font-semibold text-white">Video Solution Active</p>
                <p className="text-xs text-slate-400">Duration: 3m 45s • Cambridge Senior Examiner</p>
              </div>

              {/* Progress Bar & Controls */}
              <div className="space-y-2">
                <div className="relative h-1.5 w-full rounded-full bg-slate-800">
                  <div className="absolute left-0 top-0 h-full w-[40%] rounded-full bg-[#1D4ED8]" />
                  <div className="absolute left-[40%] top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow" />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-3">
                    <Play className="h-3.5 w-3.5 fill-current text-white" />
                    <RotateCcw className="h-3.5 w-3.5" />
                    <Volume2 className="h-3.5 w-3.5" />
                    <span className="font-mono text-[11px] text-slate-400">01:30 / 03:45</span>
                  </div>
                  <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-300">1.0x</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 rounded-b-2xl">
              <span className="text-xs text-slate-500">
                100% video coverage for every question in the Question Bank.
              </span>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF]"
              >
                Close Video
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVISION NOTES MODAL */}
      {activeModal === "notes" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#1D4ED8]" />
                <h3 className="text-base font-bold text-slate-900">
                  Revision Notes &amp; Formula Sheet
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-700">
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
                <p className="font-bold text-[#1D4ED8] mb-1.5">7 Fundamental SI Base Quantities &amp; Units:</p>
                <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-700">
                  <li>Length: metre (m)</li>
                  <li>Mass: kilogram (kg) [Note: kg, not gram]</li>
                  <li>Time: second (s)</li>
                  <li>Electric Current: ampere (A)</li>
                  <li>Thermodynamic Temperature: kelvin (K)</li>
                  <li>Amount of Substance: mole (mol)</li>
                  <li>Luminous Intensity: candela (cd)</li>
                </ul>
              </div>

              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5">
                <p className="font-bold text-amber-800 mb-1.5">Gravitation &amp; Orbit Equations:</p>
                <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-slate-700">
                  <li>Newton&apos;s Law: F = G·M·m / r&sup2;</li>
                  <li>Centripetal acceleration: a = &omega;&sup2;r = v&sup2;/r</li>
                  <li>Angular frequency: &omega; = 2&pi; / T</li>
                  <li>Volume of a uniform sphere: V = 4/3 &pi; R&sup3;</li>
                </ul>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-xl bg-[#1D4ED8] px-5 py-2 text-xs font-bold text-white hover:bg-[#1E40AF]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
