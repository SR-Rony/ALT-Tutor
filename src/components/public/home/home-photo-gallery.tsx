"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/utils";
import { photoGallery } from "./data/home.data";

type GalleryImage = (typeof photoGallery.images)[number];

function GalleryCard({ image }: { image: GalleryImage }) {
  return (
    <figure className="group relative aspect-[4/5] w-[42vw] max-w-[11.5rem] shrink-0 overflow-hidden rounded-2xl bg-[#eef2f9] shadow-[0_10px_28px_-14px_rgba(26,43,94,0.2)] transition-transform duration-300 hover:-translate-y-1 sm:w-[11.5rem] md:w-[12.5rem] lg:w-[13rem] xl:w-[13.75rem]">
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
  );
}

function GalleryTrack({ images }: { images: readonly GalleryImage[] }) {
  return (
    <div className="flex gap-3 sm:gap-4 lg:gap-5">
      {images.map((image) => (
        <GalleryCard key={image.id} image={image} />
      ))}
    </div>
  );
}

function GalleryRow({
  images,
  direction,
  prefersReducedMotion,
}: {
  images: readonly GalleryImage[];
  direction: "ltr" | "rtl";
  prefersReducedMotion: boolean | null;
}) {
  // Enough unique images for a smooth long track on each row
  const rowImages = images.length >= 6 ? images : [...images, ...images, ...images];

  return (
    <div className="overflow-hidden">
      <div
        className={cn(
          "flex w-max",
          !prefersReducedMotion &&
            (direction === "rtl"
              ? "animate-gallery-marquee group-hover/gallery:[animation-play-state:paused]"
              : "animate-gallery-marquee-reverse group-hover/gallery:[animation-play-state:paused]")
        )}
      >
        {/* Two identical halves — exact 50% loop, no padding on the track */}
        <div className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4 lg:gap-5 lg:pr-5">
          <GalleryTrack images={rowImages} />
        </div>
        <div className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4 lg:gap-5 lg:pr-5" aria-hidden>
          <GalleryTrack images={rowImages} />
        </div>
      </div>
    </div>
  );
}

export function HomePhotoGallery() {
  const prefersReducedMotion = useReducedMotion();

  // Use full set on both rows (different order) so each track is long & seamless
  const topRow = photoGallery.images;
  const bottomRow = [...photoGallery.images].reverse();

  return (
    <section className="relative w-full overflow-x-clip bg-white py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-[#1a2b5e] sm:text-3xl lg:text-4xl">
          {photoGallery.titleLead}{" "}
          <span className="bg-gradient-to-r from-[#3b8dee] via-[#ff6b35] to-[#ef3239] bg-clip-text text-transparent">
            {photoGallery.titleHighlight}
          </span>
        </h2>
      </div>

      <div className="group/gallery relative mt-8 w-full space-y-3 sm:mt-10 sm:space-y-4 lg:mt-12 lg:space-y-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent sm:w-16 lg:w-24"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent sm:w-16 lg:w-24"
        />

        <GalleryRow images={topRow} direction="rtl" prefersReducedMotion={prefersReducedMotion} />
        <GalleryRow images={bottomRow} direction="ltr" prefersReducedMotion={prefersReducedMotion} />
      </div>
    </section>
  );
}
