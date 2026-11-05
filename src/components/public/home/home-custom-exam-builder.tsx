"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  HelpCircle,
  Loader2,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import { ROUTES } from "@/constants";

const SUBJECT_TOPICS: Record<string, string[]> = {
  Mathematics: ["Algebra & Quadratic Equations", "Trigonometry & Heights", "Calculus & Derivatives", "Coordinate Geometry"],
  Physics: ["Force & Laws of Motion", "Work, Power & Energy", "Gravitation & Planetary Laws", "Current Electricity"],
  Chemistry: ["Chemical Equilibrium & Le Chatelier", "Periodic Table & Trends", "Organic Functional Groups", "Electrochemistry"],
  Biology: ["Cell Division & Mitosis", "Genetics & Heredity", "Plant Physiology", "Human Circulatory System"],
  ICT: ["Number Systems & Logic Gates", "Web Design & HTML Basics", "C Programming Fundamentals", "Database Management (DBMS)"],
};

export function HomeCustomExamBuilder() {
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const topics = SUBJECT_TOPICS[selectedSubject] || SUBJECT_TOPICS.Mathematics;
  const [selectedTopic, setSelectedTopic] = useState(topics[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("Hard");
  const [selectedDuration, setSelectedDuration] = useState("30 Mins (20 Qs)");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<null | {
    id: string;
    subject: string;
    topic: string;
    difficulty: string;
    duration: string;
    questionsCount: number;
    sampleQuestion: string;
  }>(null);

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    const newTopics = SUBJECT_TOPICS[subject] || [];
    if (newTopics.length > 0) {
      setSelectedTopic(newTopics[0]);
    }
  };

  const handleGenerateExam = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedExam({
        id: `MOCK-${selectedSubject.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        subject: selectedSubject,
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        duration: selectedDuration,
        questionsCount: 20,
        sampleQuestion: `Q1: In ${selectedTopic}, solve for the principal value under standard board examination constraints and verify your step-by-step reasoning.`,
      });
    }, 450);
  };

  return (
    <section id="custom-exam" className="w-full border-t border-slate-200 bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
          
          {/* Left Column: Text */}
          <div className="max-w-xl text-left">
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
              Custom Exams
            </span>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Build Your Own Exam.
            </h2>

            <p className="mt-4 text-base leading-relaxed text-slate-500">
              Choose your topic, select the difficulty level, and generate a custom exam in seconds. Practice exactly what you need to focus on.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={ROUTES.auth.register}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-800"
              >
                <span>Try It Now</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <button
                type="button"
                onClick={handleGenerateExam}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
              >
                <Zap className="h-4 w-4 text-[#F59E0B]" />
                <span>Test Generate Sample</span>
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Filter Card */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            {/* Floating Flat Badge on top right corner */}
            <div className="absolute -top-3.5 -right-2 z-10 flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-800 shadow-sm">
              <Zap className="h-3.5 w-3.5 fill-current text-[#F59E0B]" />
              <span>⚡ Instant Exam</span>
            </div>

            {/* Browser-like frame container */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" aria-hidden />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" aria-hidden />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-200" aria-hidden />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Exam Generator Console</span>
                </div>
                <span className="text-[11px] font-semibold text-[#1D4ED8]">
                  Live Interactive
                </span>
              </div>

              {/* Filter Card Body */}
              <div className="mt-5 space-y-4">
                
                {/* Field 1: Subject Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Subject
                  </label>
                  <div className="relative mt-1.5">
                    <select
                      value={selectedSubject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 pr-8 text-sm font-medium text-slate-900 outline-none transition focus:border-[#1D4ED8] focus:bg-white focus:ring-2 focus:ring-blue-100"
                    >
                      {Object.keys(SUBJECT_TOPICS).map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Field 2: Topic Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Topic
                  </label>
                  <div className="relative mt-1.5">
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 pr-8 text-sm font-medium text-slate-900 outline-none transition focus:border-[#1D4ED8] focus:bg-white focus:ring-2 focus:ring-blue-100"
                    >
                      {topics.map((top) => (
                        <option key={top} value={top}>
                          {top}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Field 3: Difficulty Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Difficulty Level
                  </label>
                  <div className="relative mt-1.5">
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 pr-8 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#1D4ED8] focus:bg-white focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="Easy">Easy (Foundation Questions)</option>
                      <option value="Medium">Medium (Standard Board Level)</option>
                      <option value="Hard">Hard (Advanced Problem Solving)</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Field 4: Duration Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Exam Duration
                  </label>
                  <div className="relative mt-1.5">
                    <select
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 pr-8 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#1D4ED8] focus:bg-white focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="15 Mins (10 Qs)">15 Mins (10 Questions)</option>
                      <option value="30 Mins (20 Qs)">30 Mins (20 Questions)</option>
                      <option value="45 Mins (30 Qs)">45 Mins (30 Questions)</option>
                      <option value="60 Mins (40 Qs)">60 Mins (40 Questions)</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Exam Settings Summary */}
                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                  <span>Questions: <strong className="text-slate-900">20 Qs</strong></span>
                  <span>Duration: <strong className="text-slate-900">{selectedDuration}</strong></span>
                  <span>Mark Scheme: <strong className="text-[#1D4ED8]">Instant</strong></span>
                </div>

                {/* Button: Solid Amber (#F59E0B) */}
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerateExam}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#F59E0B] py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-600 active:scale-[0.99] disabled:opacity-75"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating Custom Paper...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 fill-current" />
                      <span>Generate Exam</span>
                    </>
                  )}
                </button>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Generated Exam Preview Modal */}
      {generatedExam ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Exam Ready: {generatedExam.id}</h3>
                  <p className="text-xs text-slate-500">{generatedExam.subject} • {generatedExam.topic}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGeneratedExam(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold text-[#1D4ED8]">
                  {generatedExam.subject}
                </span>
                <span className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                  {generatedExam.difficulty}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  30 Mins
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
                  20 Questions
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sample Paper Preview</p>
                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-800">
                  {generatedExam.sampleQuestion}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  + 19 more board-standard questions curated from our verified question bank.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setGeneratedExam(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Change Settings
              </button>
              <Link
                href={ROUTES.auth.register}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D4ED8] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-800"
              >
                <span>Start Timed Exam</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
