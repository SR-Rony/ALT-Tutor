import Link from "next/link";
import {
  ArrowRight,
  Maximize2,
  Play,
  RotateCcw,
  Volume2,
} from "lucide-react";
import { ROUTES } from "@/constants";

export function HomeAnimatedVideoLessons() {
  return (
    <section className="w-full border-t border-slate-200 bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-16">
          
          {/* Left Column: Text */}
          <div className="max-w-xl text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Learn Faster with Animated Videos.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg">
              Watch expert-crafted animated examples from top mentors. Clear explanations for every hard topic to keep you ahead in class.
            </p>
            <div className="mt-6">
              <Link
                href={ROUTES.courses}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-[#1D4ED8] px-6 py-3 font-semibold text-[#1D4ED8] transition-colors hover:bg-blue-50"
              >
                <span>Watch Free Lessons</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          {/* Right Column: 16:9 Video Player Mockup Card */}
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-lg flex flex-col justify-between p-4 sm:p-5">
              
              {/* Top video title bar */}
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="truncate font-medium">
                  Physics • Work, Energy & Power Animation
                </span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                  HD 1080p
                </span>
              </div>

              {/* Large, centered solid Primary Blue circle with white Play icon */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  aria-label="Play animated lesson video"
                  className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[#1D4ED8] text-white shadow-md transition-transform hover:scale-105 active:scale-95"
                >
                  <Play className="h-8 w-8 sm:h-10 sm:w-10 fill-current pl-1" aria-hidden />
                </button>
              </div>

              {/* Bottom control bar (like YouTube controls) with progress bar */}
              <div className="space-y-2.5">
                {/* Progress bar */}
                <div className="relative h-1.5 w-full rounded-full bg-slate-700">
                  {/* Played progress */}
                  <div className="absolute left-0 top-0 h-full w-[38%] rounded-full bg-[#1D4ED8]" />
                  {/* Scrubber head */}
                  <div className="absolute left-[38%] top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-white shadow-sm" />
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-3">
                    <Play className="h-3.5 w-3.5 fill-current cursor-pointer hover:text-white" />
                    <RotateCcw className="h-3.5 w-3.5 cursor-pointer hover:text-white" />
                    <Volume2 className="h-3.5 w-3.5 cursor-pointer hover:text-white" />
                    <span className="text-[11px] font-mono text-slate-400">
                      04:25 / 12:40
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">1.0x</span>
                    <Maximize2 className="h-3.5 w-3.5 cursor-pointer hover:text-white" />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

