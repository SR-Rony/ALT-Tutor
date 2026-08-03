"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import { lessonService, type LessonPlayUrl } from "@/services/lesson.service";
import { cn } from "@/utils";
import {
  extractYoutubeStartSeconds,
  extractYoutubeVideoId,
  toSecureYoutubeEmbedUrl,
} from "@/utils/youtube-embed";

type YtPlayer = {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
  destroy: () => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  getPlayerState: () => number;
  setPlaybackRate?: (rate: number) => void;
  getPlaybackRate?: () => number;
};

type YtPlayerConstructor = new (
  element: string | HTMLElement,
  config: {
    width?: string | number;
    height?: string | number;
    videoId: string;
    playerVars?: Record<string, string | number>;
    events?: {
      onReady?: (event: { target: YtPlayer }) => void;
      onStateChange?: (event: { data: number; target: YtPlayer }) => void;
    };
  }
) => YtPlayer;

declare global {
  interface Window {
    YT?: {
      Player: YtPlayerConstructor;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;

let youtubeApiPromise: Promise<void> | null = null;

function loadYoutubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
    if (window.YT?.Player) resolve();
  });

  return youtubeApiPromise;
}

function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const seconds = Math.floor(totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

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
            "absolute whitespace-nowrap text-sm font-bold tracking-wide text-white/35 mix-blend-soft-light sm:text-base",
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

function ControlBtn({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white/95 transition hover:bg-white/10 disabled:opacity-40",
        className
      )}
    >
      {children}
    </button>
  );
}

type BottomBarProps = {
  title: string;
  ready: boolean;
  playing: boolean;
  current: number;
  duration: number;
  muted: boolean;
  volume: number;
  rate: number;
  settingsOpen: boolean;
  isFullscreen: boolean;
  onTogglePlay: () => void;
  onSeekBy: (delta: number) => void;
  onSeekTo: (seconds: number) => void;
  onToggleMute: () => void;
  onVolume: (volume: number) => void;
  onToggleSettings: () => void;
  onRate: (rate: number) => void;
  onToggleFullscreen: () => void;
};

/** Reference-style bar under the video stage (always visible). */
function BottomControlBar({
  title,
  ready,
  playing,
  current,
  duration,
  muted,
  volume,
  rate,
  settingsOpen,
  isFullscreen,
  onTogglePlay,
  onSeekBy,
  onSeekTo,
  onToggleMute,
  onVolume,
  onToggleSettings,
  onRate,
  onToggleFullscreen,
}: BottomBarProps) {
  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div className="relative border-t border-white/10 bg-[#1a1f2e] px-2.5 py-2.5 sm:px-3.5 sm:py-3">
      {/* Progress */}
      <div className="group relative mb-2.5 h-[3px] cursor-pointer rounded-full bg-white/25">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white"
          style={{ width: `${progress}%` }}
        />
        <div
          className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow opacity-0 transition group-hover:opacity-100"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
        <input
          type="range"
          min={0}
          max={Math.max(duration, 0.1)}
          step={0.1}
          value={Math.min(current, duration || 0)}
          disabled={!ready || duration <= 0}
          onChange={(event) => onSeekTo(Number(event.target.value))}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          aria-label="Seek"
        />
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1">
        <ControlBtn label={playing ? "Pause" : "Play"} onClick={onTogglePlay} disabled={!ready}>
          {playing ? (
            <Pause className="h-[18px] w-[18px] fill-current" />
          ) : (
            <Play className="ml-0.5 h-[18px] w-[18px] fill-current" />
          )}
        </ControlBtn>

        <ControlBtn label="Back 5 seconds" onClick={() => onSeekBy(-5)} disabled={!ready}>
          <ChevronsLeft className="h-5 w-5" />
        </ControlBtn>
        <ControlBtn label="Forward 5 seconds" onClick={() => onSeekBy(5)} disabled={!ready}>
          <ChevronsRight className="h-5 w-5" />
        </ControlBtn>

        <ControlBtn label={muted ? "Unmute" : "Mute"} onClick={onToggleMute}>
          {muted || volume === 0 ? <VolumeX className="h-[18px] w-[18px]" /> : <Volume2 className="h-[18px] w-[18px]" />}
        </ControlBtn>
        <input
          type="range"
          min={0}
          max={100}
          value={muted ? 0 : volume}
          onChange={(event) => onVolume(Number(event.target.value))}
          className="mx-1 hidden h-1 w-16 cursor-pointer accent-teal-400 sm:block sm:w-20"
          aria-label="Volume"
        />

        <span className="ml-1 shrink-0 text-[11px] font-medium tabular-nums text-white/80 sm:text-xs">
          {formatTime(current)} / {formatTime(duration)}
        </span>

        <span className="ml-auto hidden max-w-[10rem] truncate text-xs font-medium text-white/70 md:inline lg:max-w-[14rem]">
          {title}
        </span>

        <div className="relative ml-1 sm:ml-2">
          <ControlBtn label="Settings" onClick={onToggleSettings}>
            <Settings className="h-[18px] w-[18px]" />
          </ControlBtn>
          {settingsOpen ? (
            <div className="absolute bottom-11 right-0 z-20 min-w-[7.5rem] overflow-hidden rounded-lg border border-white/10 bg-[#252b3b] py-1 shadow-xl">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/45">
                Speed
              </p>
              {PLAYBACK_RATES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onRate(value)}
                  className={cn(
                    "flex w-full items-center px-3 py-1.5 text-left text-xs text-white/90 hover:bg-white/10",
                    rate === value && "bg-white/10 font-semibold text-teal-300"
                  )}
                >
                  {value === 1 ? "Normal" : `${value}x`}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <ControlBtn
          label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? <Minimize2 className="h-[18px] w-[18px]" /> : <Maximize2 className="h-[18px] w-[18px]" />}
        </ControlBtn>
      </div>
    </div>
  );
}

type SecureVideoPlayerProps = {
  title: string;
  lessonId?: string;
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
  const ytHostRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<YtPlayer | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [playback, setPlayback] = useState<LessonPlayUrl | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(lessonId || directUrl));
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [rate, setRate] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const startSeconds = useMemo(() => {
    if (!directUrl) {
      if (playback?.kind === "youtube") return extractYoutubeStartSeconds(playback.embedUrl) ?? 0;
      return 0;
    }
    return extractYoutubeStartSeconds(directUrl) ?? 0;
  }, [directUrl, playback]);

  const youtubeMeta = useMemo(() => {
    if (playback?.kind !== "youtube") return null;
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    const videoId =
      extractYoutubeVideoId(playback.embedUrl) ||
      (directUrl ? extractYoutubeVideoId(directUrl) : null);
    return { videoId, origin };
  }, [playback, directUrl]);

  const blockContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  const blockDrag = useCallback((event: React.DragEvent) => {
    event.preventDefault();
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
      setReady(false);
      setPlaying(false);
      setEnded(false);
      setCurrent(0);
      setDuration(0);

      try {
        const next = lessonId
          ? await lessonService.getPlayUrl(lessonId)
          : resolveDirectPlayback(directUrl!);
        if (!cancelled) {
          if (next.kind === "youtube") {
            const id = extractYoutubeVideoId(next.embedUrl);
            if (!id) {
              setError("This lesson video link is invalid. Ask your teacher to update it.");
              setPlayback(null);
              return;
            }
          }
          setPlayback(next);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            typeof err === "object" && err && "message" in err
              ? String((err as { message?: string }).message || "")
              : "";
          setError(
            message.includes("enrolled") || message.includes("expired")
              ? message
              : message.includes("No playable")
                ? "No video is set on this lesson yet."
                : "Unable to load protected video. Please refresh and try again."
          );
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
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const close = () => setSettingsOpen(false);
    const timer = window.setTimeout(() => {
      window.addEventListener("click", close);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("click", close);
    };
  }, [settingsOpen]);

  useEffect(() => {
    if (loading || playback?.kind !== "youtube" || !youtubeMeta?.videoId) return;
    const host = ytHostRef.current;
    if (!host) return;

    let cancelled = false;
    setReady(false);

    void loadYoutubeIframeApi().then(() => {
      if (cancelled || !window.YT?.Player || !ytHostRef.current) return;
      try {
        ytPlayerRef.current?.destroy();
      } catch {
        // ignore
      }
      ytHostRef.current.replaceChildren();
      const mount = document.createElement("div");
      mount.className = "h-full w-full";
      ytHostRef.current.appendChild(mount);

      ytPlayerRef.current = new window.YT.Player(mount, {
        width: "100%",
        height: "100%",
        videoId: youtubeMeta.videoId!,
        playerVars: {
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          controls: 0,
          fs: 0,
          disablekb: 1,
          playsinline: 1,
          cc_load_policy: 0,
          enablejsapi: 1,
          origin: youtubeMeta.origin || window.location.origin,
          start: startSeconds,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            try {
              event.target.setVolume(volume);
              if (muted) event.target.mute();
              event.target.setPlaybackRate?.(rate);
              setDuration(event.target.getDuration() || 0);
              setCurrent(event.target.getCurrentTime() || startSeconds);
            } catch {
              // ignore
            }
            setReady(true);
          },
          onStateChange: (event) => {
            if (cancelled) return;
            const state = event.data;
            const YT = window.YT?.PlayerState;
            if (!YT) return;
            setPlaying(state === YT.PLAYING);
            setEnded(state === YT.ENDED);
            if (state === YT.PLAYING || state === YT.PAUSED) {
              try {
                setDuration(event.target.getDuration() || 0);
                setCurrent(event.target.getCurrentTime() || 0);
              } catch {
                // ignore
              }
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      try {
        ytPlayerRef.current?.destroy();
      } catch {
        // ignore
      }
      ytPlayerRef.current = null;
      host.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, playback?.kind, youtubeMeta?.videoId, youtubeMeta?.origin, startSeconds]);

  useEffect(() => {
    if (playback?.kind !== "youtube") return;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const player = ytPlayerRef.current;
      if (!player || !ready) return;
      try {
        setCurrent(player.getCurrentTime() || 0);
        const d = player.getDuration() || 0;
        if (d > 0) setDuration(d);
      } catch {
        // ignore
      }
    }, 250);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [playback?.kind, ready]);

  const togglePlay = useCallback(() => {
    if (playback?.kind === "youtube") {
      const player = ytPlayerRef.current;
      if (!player || !ready) return;
      if (ended) {
        player.seekTo(startSeconds, true);
        player.playVideo();
        setEnded(false);
        return;
      }
      if (playing) player.pauseVideo();
      else player.playVideo();
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (ended) {
      video.currentTime = 0;
      void video.play();
      setEnded(false);
      return;
    }
    if (video.paused) void video.play();
    else video.pause();
  }, [playback?.kind, ready, ended, playing, startSeconds]);

  const seekBy = useCallback(
    (delta: number) => {
      if (playback?.kind === "youtube") {
        const player = ytPlayerRef.current;
        if (!player || !ready) return;
        const next = Math.min(
          Math.max(0, (player.getCurrentTime() || 0) + delta),
          Math.max(0, (player.getDuration() || 0) - 0.25)
        );
        player.seekTo(next, true);
        setCurrent(next);
        setEnded(false);
        return;
      }
      const video = videoRef.current;
      if (!video) return;
      const d = Number.isFinite(video.duration) ? video.duration : 0;
      video.currentTime = Math.min(Math.max(0, video.currentTime + delta), d);
      setCurrent(video.currentTime);
      setEnded(false);
    },
    [playback?.kind, ready]
  );

  const seekTo = useCallback(
    (seconds: number) => {
      if (playback?.kind === "youtube") {
        const player = ytPlayerRef.current;
        if (!player || !ready) return;
        player.seekTo(seconds, true);
        setCurrent(seconds);
        setEnded(false);
        return;
      }
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = seconds;
      setCurrent(seconds);
      setEnded(false);
    },
    [playback?.kind, ready]
  );

  const toggleMute = useCallback(() => {
    if (playback?.kind === "youtube") {
      const player = ytPlayerRef.current;
      if (!player) return;
      if (player.isMuted() || volume === 0) {
        player.unMute();
        if (volume === 0) {
          player.setVolume(50);
          setVolume(50);
        }
        setMuted(false);
      } else {
        player.mute();
        setMuted(true);
      }
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, [playback?.kind, volume]);

  const changeVolume = useCallback(
    (next: number) => {
      setVolume(next);
      setMuted(next === 0);
      if (playback?.kind === "youtube") {
        const player = ytPlayerRef.current;
        if (!player) return;
        player.setVolume(next);
        if (next === 0) player.mute();
        else player.unMute();
        return;
      }
      const video = videoRef.current;
      if (!video) return;
      video.volume = next / 100;
      video.muted = next === 0;
    },
    [playback?.kind]
  );

  const changeRate = useCallback(
    (next: number) => {
      setRate(next);
      setSettingsOpen(false);
      if (playback?.kind === "youtube") {
        ytPlayerRef.current?.setPlaybackRate?.(next);
        return;
      }
      const video = videoRef.current;
      if (video) video.playbackRate = next;
    },
    [playback?.kind]
  );

  const replay = useCallback(() => {
    seekTo(startSeconds);
    if (playback?.kind === "youtube") ytPlayerRef.current?.playVideo();
    else void videoRef.current?.play();
    setEnded(false);
  }, [seekTo, startSeconds, playback?.kind]);

  const toggleFullscreen = useCallback(() => {
    const shell = shellRef.current;
    if (!shell) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shell.requestFullscreen().catch(() => undefined);
  }, []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();
        if (key === "s" || key === "u" || key === "p" || key === "c") event.preventDefault();
        return;
      }
      if (event.key === " " || event.key === "k") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        seekBy(-5);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        seekBy(5);
      } else if (event.key === "m") {
        event.preventDefault();
        toggleMute();
      } else if (event.key === "f") {
        event.preventDefault();
        toggleFullscreen();
      }
    },
    [togglePlay, seekBy, toggleMute, toggleFullscreen]
  );

  if (loading) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center bg-[#0b1220]",
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
          "flex aspect-video w-full items-center justify-center bg-[#0b1220] px-6 text-center text-sm text-white/80",
          rounded && "rounded-xl",
          className
        )}
      >
        {error ?? "Video is not available."}
      </div>
    );
  }

  if (playback.kind === "youtube" && !youtubeMeta?.videoId) {
    return (
      <div
        className={cn(
          "flex aspect-video w-full items-center justify-center bg-[#0b1220] px-6 text-center text-sm text-white/80",
          rounded && "rounded-xl",
          className
        )}
      >
        Video is not available.
      </div>
    );
  }

  const bottomBar = (
    <BottomControlBar
      title={title}
      ready={ready}
      playing={playing}
      current={current}
      duration={duration}
      muted={muted}
      volume={volume}
      rate={rate}
      settingsOpen={settingsOpen}
      isFullscreen={isFullscreen}
      onTogglePlay={togglePlay}
      onSeekBy={seekBy}
      onSeekTo={seekTo}
      onToggleMute={toggleMute}
      onVolume={changeVolume}
      onToggleSettings={() => setSettingsOpen((open) => !open)}
      onRate={changeRate}
      onToggleFullscreen={toggleFullscreen}
    />
  );

  const stageOverlays = (
    <>
      {/* Block YouTube UI / More videos whenever not playing */}
      {!playing || ended ? (
        <div className="absolute inset-0 z-30 bg-black/55" aria-hidden />
      ) : null}

      {ended ? (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-black/90">
          <p className="text-sm font-semibold text-white/90">End of video</p>
          <button
            type="button"
            onClick={replay}
            className="inline-flex items-center gap-2 rounded-md bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Replay
          </button>
        </div>
      ) : null}

      {!ended && ready ? (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 z-[35] flex items-center justify-center"
          aria-label={playing ? "Pause video" : "Play video"}
        >
          {!playing ? (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/30 backdrop-blur-sm transition hover:bg-black/60 sm:h-16 sm:w-16">
              <Play className="ml-0.5 h-7 w-7 fill-current sm:h-8 sm:w-8" aria-hidden />
            </span>
          ) : null}
        </button>
      ) : null}

      {!ready ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0b1220]">
          <Loader2 className="h-8 w-8 animate-spin text-white/80" aria-hidden />
        </div>
      ) : null}

      {watermarkText ? <VideoWatermark label={watermarkText} /> : null}
    </>
  );

  return (
    <div
      ref={shellRef}
      className={cn(
        "flex w-full flex-col overflow-hidden bg-black select-none shadow-[0_16px_48px_rgba(15,23,42,0.28)] ring-1 ring-black/10",
        rounded && "rounded-xl",
        isFullscreen && "h-full",
        className
      )}
      onContextMenu={blockContextMenu}
      onDragStart={blockDrag}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="application"
      aria-label={title}
    >
      <div className={cn("relative w-full bg-black", isFullscreen ? "min-h-0 flex-1" : "aspect-video")}>
        {playback.kind === "youtube" ? (
          <div
            ref={ytHostRef}
            className="pointer-events-none absolute inset-0 h-full w-full [&_iframe]:pointer-events-none [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full"
            aria-hidden
          />
        ) : (
          <video
            ref={videoRef}
            key={(playback as Extract<LessonPlayUrl, { kind: "video" }>).url}
            src={(playback as Extract<LessonPlayUrl, { kind: "video" }>).url}
            title={title}
            controls={false}
            controlsList="nodownload noremoteplayback noplaybackrate"
            disablePictureInPicture
            playsInline
            className="h-full w-full object-contain"
            onDragStart={blockDrag}
            onLoadedMetadata={() => {
              const video = videoRef.current;
              if (!video) return;
              setDuration(video.duration || 0);
              video.volume = volume / 100;
              video.muted = muted;
              video.playbackRate = rate;
              setReady(true);
            }}
            onTimeUpdate={() => setCurrent(videoRef.current?.currentTime || 0)}
            onPlay={() => {
              setPlaying(true);
              setEnded(false);
            }}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              setPlaying(false);
              setEnded(true);
            }}
          />
        )}
        {stageOverlays}
      </div>
      {bottomBar}
    </div>
  );
}
