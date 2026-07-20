"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import { siteConfig } from "@/config";
import { ROUTES } from "@/constants";
import { SecureVideoPlayer, VideoModal } from "@/components/shared";
import { aboutDemoVideo } from "@/components/public/about";
import { Button } from "@/components/ui/button";
import { aboutSection } from "./data/home.data";

export function HomeAboutSection() {
  const prefersReducedMotion = useReducedMotion();
  const [videoOpen, setVideoOpen] = useState(false);
  const { media } = aboutSection;

  const openVideo = useCallback(() => setVideoOpen(true), []);
  const closeVideo = useCallback(() => setVideoOpen(false), []);

  return (
    <>
      <VideoModal open={videoOpen} title={aboutDemoVideo.title} onClose={closeVideo}>
        <SecureVideoPlayer title={aboutDemoVideo.title} directUrl={aboutDemoVideo.url} rounded={false} />
      </VideoModal>

      <section className="relative w-full overflow-x-clip bg-[#f7f9fc]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-[#1877f2]/8 blur-3xl" />
          <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-[#ef3239]/8 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
            {/* Media card */}
            <motion.div
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 20 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, amount: 0.3 },
                    transition: { duration: 0.5 },
                  })}
              className="relative order-1"
            >
              <div
                aria-hidden
                className="absolute -bottom-4 -left-4 hidden h-28 w-40 opacity-[0.08] sm:block"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='160' height='112' viewBox='0 0 160 112' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 90V40L80 20L140 40V90' stroke='%231a2b5e' stroke-width='3'/%3E%3Crect x='40' y='55' width='18' height='18' stroke='%231a2b5e' stroke-width='2'/%3E%3Crect x='102' y='55' width='18' height='18' stroke='%231a2b5e' stroke-width='2'/%3E%3Crect x='70' y='70' width='20' height='20' stroke='%231a2b5e' stroke-width='2'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "contain",
                }}
              />

              <div className="group relative overflow-hidden rounded-2xl shadow-[0_24px_60px_-24px_rgba(26,43,94,0.35)] sm:rounded-[1.5rem]">
                <div className="relative aspect-[16/11] w-full sm:aspect-[5/3.6]">
                  <Image
                    src={media.src}
                    alt={media.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    priority={false}
                  />

                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(110deg,rgba(11,31,77,0.72)_0%,rgba(11,31,77,0.35)_45%,rgba(239,50,57,0.2)_100%)]"
                  />

                  <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
                    <Image
                      src="/logo.jpeg"
                      alt={siteConfig.name}
                      width={120}
                      height={36}
                      className="h-8 w-auto rounded-md object-contain shadow-md sm:h-9"
                    />
                  </div>

                  <div className="absolute inset-y-0 left-0 flex w-[72%] flex-col justify-center px-4 sm:w-[60%] sm:px-6 lg:px-7">
                    <p className="text-lg font-extrabold leading-tight text-white drop-shadow-sm sm:text-2xl lg:text-[1.65rem]">
                      {media.headline}
                    </p>
                    <p className="mt-2 max-w-xs text-[11px] font-medium leading-relaxed text-white/90 sm:mt-3 sm:text-sm">
                      {media.subtext}
                    </p>
                    <div className="mt-4 sm:mt-5">
                      <Image
                        src="/logo.jpeg"
                        alt={siteConfig.name}
                        width={100}
                        height={30}
                        className="h-7 w-auto rounded object-contain sm:h-8"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={openVideo}
                    aria-label="Watch Alt Tutor demo video"
                    className="absolute left-1/2 top-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#1877f2] shadow-[0_12px_32px_-8px_rgba(15,23,42,0.4)] transition-all duration-300 hover:scale-110 hover:bg-white hover:text-[#ef3239] sm:h-16 sm:w-16"
                  >
                    <Play className="h-6 w-6 fill-current sm:h-7 sm:w-7" aria-hidden />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Text + CTA */}
            <motion.div
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 20 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, amount: 0.3 },
                    transition: { duration: 0.5, delay: 0.08 },
                  })}
              className="order-2 text-center lg:text-left"
            >
              <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-[#1a2b5e] sm:text-3xl lg:text-[2.15rem] xl:text-[2.35rem]">
                Everyone learns with{" "}
                <span className="bg-gradient-to-r from-[#3b8dee] via-[#ff6b35] to-[#ef3239] bg-clip-text text-transparent">
                  Alt Tutor
                </span>
                . Everyone wins.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#58688b] sm:mt-5 sm:text-base lg:mx-0 lg:text-[1.05rem] lg:leading-7">
                {aboutSection.description}
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:mt-8 sm:flex-row lg:justify-start">
                <Button asChild variant="default" size="pillLg">
                  <Link href={ROUTES.about}>
                    <span>{aboutSection.cta}</span>
                  </Link>
                </Button>
                <Button variant="secondary" size="pillLg" onClick={openVideo}>
                  <span className="inline-flex items-center gap-2">
                    <Play className="h-4 w-4 fill-current" aria-hidden />
                    Watch Demo
                  </span>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
