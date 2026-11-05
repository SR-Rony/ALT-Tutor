"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { ROUTES } from "@/constants";

const CHAPTERS = [
  { time: "00:00", title: "Introduction & Core Equations", duration: "2m 15s" },
  { time: "02:15", title: "Kinetic vs. Potential Energy in Real Life", duration: "4m 10s" },
  { time: "06:25", title: "Work-Energy Theorem Derivation", duration: "3m 30s" },
  { time: "09:55", title: "Board Exam CQ Solved Step-by-Step", duration: "2m 45s" },
];

export function HomeAnimatedVideoLessons() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  return (
    <section id="video-lessons" className="w-full border-t border-slate-200 bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
          
          {/* Left Column: Text */}
          <div className="max-w-xl text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-[#1D4ED8]">
              <span>HD Visual Explanations</span>
            </div>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Learn Faster with Animated Videos.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg">
              Watch expert-crafted animated examples from top mentors. Clear step-by-step visualizations for complex topics to keep you ahead in class and board exams.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1D4ED8] px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-[#1E40AF]"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Play Sample Lesson</span>
              </button>
              
              <Link
                href={ROUTES.courses}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <span>Browse All Courses</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            {/* Micro feature pills */}
            <div className="mt-8 grid grid-cols-2 gap-3 text-xs font-medium text-slate-600 sm:grid-cols-3">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#1D4ED8]" />
                <span>Full Board Syllabus</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#1D4ED8]" />
                <span>Animated Formulas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#1D4ED8]" />
                <span>100% Free Samples</span>
              </div>
            </div>
          </div>

          {/* Right Column: 16:9 Video Player Mockup Card */}
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div
              onClick={() => setShowModal(true)}
              className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-4 sm:p-5 shadow-lg flex flex-col justify-between transition-all hover:border-[#1D4ED8] hover:shadow-xl"
            >
              {/* Top video title bar */}
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="truncate font-medium text-slate-200">
                  Physics • Work, Energy & Power Animation
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-blue-400">
                  HD 1080p
                </span>
              </div>

              {/* Large, centered solid Primary Blue circle with white Play icon */}
              <div className="flex flex-col items-center justify-center">
                <div
                  aria-label="Play animated lesson video"
                  className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[#1D4ED8] text-white shadow-md transition-transform group-hover:scale-110"
                >
                  <Play className="h-8 w-8 sm:h-10 sm:w-10 fill-current pl-1" aria-hidden />
                </div>
                <span className="mt-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur-sm">
                  Click to Preview (12m 40s)
                </span>
              </div>

              {/* Bottom control bar with progress bar */}
              <div className="space-y-2.5">
                {/* Progress bar */}
                <div className="relative h-1.5 w-full rounded-full bg-slate-800">
                  <div className="absolute left-0 top-0 h-full w-[38%] rounded-full bg-[#1D4ED8]" />
                  <div className="absolute left-[38%] top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow-sm" />
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-3">
                    <Play className="h-3.5 w-3.5 fill-current text-white" />
                    <RotateCcw className="h-3.5 w-3.5" />
                    <Volume2 className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-mono text-slate-400">
                      04:25 / 12:40
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">1.0x</span>
                    <Maximize2 className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Interactive Video Lesson Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
                  Physics Masterclass • Chapter 4
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Work, Energy & Power — Interactive Lesson Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setIsPlaying(false);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player Display */}
            <div className="relative aspect-video w-full bg-slate-950 flex flex-col justify-between p-5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold text-slate-200">
                  {CHAPTERS[activeChapterIndex].title}
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-amber-400">
                  Free Preview
                </span>
              </div>

              {/* Center visual demo */}
              <div className="flex flex-col items-center justify-center text-center">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1D4ED8] text-white shadow-xl hover:bg-[#1E40AF]"
                >
                  {isPlaying ? (
                    <Pause className="h-7 w-7" />
                  ) : (
                    <Play className="h-7 w-7 fill-current pl-1" />
                  )}
                </button>
                <p className="mt-3 text-sm font-semibold text-white">
                  {isPlaying ? "Lesson is Playing..." : "Click to Play Sample"}
                </p>
                <p className="text-xs text-slate-400">
                  Duration: {CHAPTERS[activeChapterIndex].duration} • 1080p HD Video
                </p>
              </div>

              {/* Scrubber & Controls */}
              <div className="space-y-2">
                <div className="relative h-1.5 w-full rounded-full bg-slate-800">
                  <div className="absolute left-0 top-0 h-full w-[55%] rounded-full bg-[#1D4ED8]" />
                  <div className="absolute left-[55%] top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow" />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? (
                        <Pause className="h-4 w-4 text-white" />
                      ) : (
                        <Play className="h-4 w-4 fill-current text-white" />
                      )}
                    </button>
                    <button type="button" onClick={() => setIsMuted(!isMuted)}>
                      {isMuted ? (
                        <VolumeX className="h-4 w-4 text-red-400" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-white" />
                      )}
                    </button>
                    <span className="font-mono text-[11px] text-slate-400">
                      03:45 / 12:40
                    </span>
                  </div>
                  <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                    1080p • 1.0x
                  </span>
                </div>
              </div>
            </div>

            {/* Chapters Tab List */}
            <div className="border-t border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500 mb-2">
                Lesson Chapters
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CHAPTERS.map((ch, idx) => (
                  <button
                    key={ch.title}
                    type="button"
                    onClick={() => setActiveChapterIndex(idx)}
                    className={`flex items-center justify-between rounded-lg border p-2.5 text-left text-xs transition-colors ${
                      activeChapterIndex === idx
                        ? "border-[#1D4ED8] bg-blue-50 font-semibold text-[#1D4ED8]"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate pr-2">{ch.title}</span>
                    <span className="shrink-0 font-mono text-slate-400">{ch.time}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer with Course CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-6 py-3.5 bg-white">
              <span className="text-xs text-slate-500">
                Unlock full chapter questions, quizzes, and note sheets.
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={ROUTES.courses}
                  onClick={() => setShowModal(false)}
                  className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1E40AF]"
                >
                  View Full Course Curriculum
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
