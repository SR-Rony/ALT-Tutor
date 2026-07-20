"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { lessonService, type LessonPlayUrl } from "@/services/lesson.service";
import { cn } from "@/utils";
import { normalizeYoutubeEmbedSrc, toSecureYoutubeEmbedUrl } from "@/utils/youtube-embed";

function resolveDirectPlayback(url: string): LessonPlayUrl {
  const origin = typeof window !== "undefined" ? window.location.origin : undefined;
  const embedUrl = toSecureYoutubeEmbedUrl(url, origin);
  if (embedUrl) return { kind: "youtube", embedUrl };
  return {
    kind: "video",
    url,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

function VideoWatermark({ label }: { label: string }) {
  const tiles = useMemo(() => [0, 1, 2, 3, 4], []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden select-none"
      aria-hidden
    >
      {tiles.map((index) => (
        <span
          key={index}
          className={cn(
            "absolute whitespace-nowrap text-sm font-bold tracking-wide text-white/45 mix-blend-soft-light sm:text-base",
            index === 0 && "animate-watermark-drift left-[8%] top-[18%]",
            index === 1 && "animate-watermark-drift-slow left-[42%] top-[48%] [animation-delay:-6s]",
            index === 2 && "animate-watermark-drift-reverse left-[22%] top-[72%] [animation-delay:-11s]",
            index === 3 && "animate-watermark-drift left-[68%] top-[28%] [animation-delay:-4s]",
            index === 4 && "animate-watermark-drift-slow left-[55%] top-[82%] [animation-delay:-14s]"
          )}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function YoutubeChromeMask() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30" aria-hidden>
      {/* Top-left title/channel link — does not cover center controls */}
      <div className="pointer-events-auto absolute left-0 top-0 h-10 w-[min(55%,20rem)] bg-gradient-to-b from-black/90 to-transparent" />
      {/* Bottom-right YouTube logo + "More videos" */}
      <div className="pointer-events-auto absolute bottom-0 right-0 h-11 w-36 bg-gradient-to-tl from-black via-black/90 to-transparent" />
      {/* Bottom-left copy-link icon */}
      <div className="pointer-events-auto absolute bottom-0 left-0 h-9 w-14 bg-gradient-to-tr from-black via-black/90 to-transparent" />
    </div>
  );
}

type SecureVideoPlayerProps = {
  title: string;
  lessonId?: string;
  /** Promo / legacy fallback when no lesson stream API is used */
  directUrl?: string | null;
  watermarkText?: string | null;
  className?: string;
  rounded?: boolean;
};

export function SecureVideoPlayer({
  title,
  lessonId,
  directUrl,
  watermarkText,
  className,
  rounded = false,
}: SecureVideoPlayerProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playback, setPlayback] = useState<LessonPlayUrl | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(lessonId || directUrl));

  const blockContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  const blockDrag = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const blockShortcuts = useCallback((event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();
      if (key === "s" || key === "u" || key === "p" || key === "c") {
        event.preventDefault();
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPlayback() {
      if (!lessonId && !directUrl) {
        setLoading(false);
        setPlayback(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const next = lessonId
          ? await lessonService.getPlayUrl(lessonId)
          : resolveDirectPlayback(directUrl!);
        if (!cancelled) setPlayback(next);
      } catch {
        if (!cancelled) {
          setError("Unable to load protected video. Please refresh and try again.");
          setPlayback(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPlayback();

    return () => {
      cancelled = true;
    };
  }, [directUrl, lessonId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const preventSave = (event: Event) => event.preventDefault();
    video.addEventListener("contextmenu", preventSave);
    return () => video.removeEventListener("contextmenu", preventSave);
  }, [playback?.kind]);

  const youtubeEmbedSrc = useMemo(() => {
    if (playback?.kind !== "youtube") return null;
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    return normalizeYoutubeEmbedSrc(playback.embedUrl, origin);
  }, [playback]);

  if (loading) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center bg-black",
          rounded && "rounded-xl",
          className
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-white/80" aria-hidden />
        <span className="sr-only">Loading protected video</span>
      </div>
    );
  }

  if (error || !playback) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center bg-[#0f172a] px-6 text-center text-sm text-white/80",
          rounded && "rounded-xl",
          className
        )}
      >
        {error ?? "Video is not available."}
      </div>
    );
  }

  const shellClass = cn(
    "relative aspect-video w-full overflow-hidden bg-black select-none",
    rounded && "rounded-xl",
    className
  );

  if (playback.kind === "youtube") {
    if (!youtubeEmbedSrc) {
      return (
        <div
          className={cn(
            "flex aspect-video w-full items-center justify-center bg-[#0f172a] px-6 text-center text-sm text-white/80",
            rounded && "rounded-xl",
            className
          )}
        >
          Video is not available.
        </div>
      );
    }

    return (
      <div
        ref={shellRef}
        className={shellClass}
        onContextMenu={blockContextMenu}
        onDragStart={blockDrag}
        onKeyDown={blockShortcuts}
        tabIndex={-1}
      >
        <iframe
            src={youtubeEmbedSrc}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            loading="lazy"
          />
        <YoutubeChromeMask />
        {watermarkText ? <VideoWatermark label={watermarkText} /> : null}
      </div>
    );
  }

  const videoPlayback = playback as Extract<LessonPlayUrl, { kind: "video" }>;

  return (
    <div
      ref={shellRef}
      className={shellClass}
      onContextMenu={blockContextMenu}
      onDragStart={blockDrag}
      onKeyDown={blockShortcuts}
      tabIndex={-1}
    >
      <video
        ref={videoRef}
        key={videoPlayback.url}
        src={videoPlayback.url}
        title={title}
        controls
        controlsList="nodownload noremoteplayback noplaybackrate"
        disablePictureInPicture
        playsInline
        className="h-full w-full object-contain"
        onDragStart={blockDrag}
      />
      {watermarkText ? <VideoWatermark label={watermarkText} /> : null}
    </div>
  );
}
