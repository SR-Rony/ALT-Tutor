"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { photoGallery } from "./data/home.data";

const galleryImages = [...photoGallery.images, ...photoGallery.images];

export function HomePhotoGallery() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative w-full overflow-x-clip bg-white py-14 sm:py-16 lg:py-20">
      {/* Title stays centered in container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-[#1a2b5e] sm:text-3xl lg:text-4xl">
          {photoGallery.titleLead}{" "}
          <span className="bg-gradient-to-r from-[#3b8dee] via-[#ff6b35] to-[#ef3239] bg-clip-text text-transparent">
            {photoGallery.titleHighlight}
          </span>
        </h2>
      </div>

      {/* Full-bleed auto slider — outside container */}
      <div className="group/gallery relative mt-8 w-full sm:mt-10 lg:mt-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent sm:w-16 lg:w-24"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent sm:w-16 lg:w-24"
        />

        <div className="overflow-hidden">
          <div
            className={
              prefersReducedMotion
                ? "flex w-max gap-3 px-4 sm:gap-4 sm:px-6 lg:gap-5"
                : "flex w-max gap-3 px-4 sm:gap-4 sm:px-6 lg:gap-5 animate-gallery-marquee group-hover/gallery:[animation-play-state:paused]"
            }
          >
            {galleryImages.map((image, index) => (
              <figure
                key={`${image.id}-${index}`}
                className="group relative aspect-[4/5] w-[42vw] max-w-[11.5rem] shrink-0 overflow-hidden rounded-2xl bg-[#eef2f9] shadow-[0_10px_28px_-14px_rgba(26,43,94,0.2)] transition-transform duration-300 hover:-translate-y-1 sm:w-[11.5rem] md:w-[12.5rem] lg:w-[13rem] xl:w-[13.75rem]"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 640px) 42vw, 220px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1f4d]/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
