const YOUTUBE_EMBED_PARAMS = {
  modestbranding: "1",
  rel: "0",
  iv_load_policy: "3",
  /** Native YouTube chrome off — we use a custom secure player UI */
  controls: "0",
  fs: "0",
  disablekb: "1",
  playsinline: "1",
  cc_load_policy: "0",
  enablejsapi: "1",
  showinfo: "0",
} as const;

/** Parse YouTube `t` / `start` values like `156`, `156s`, `2m36s`. */
export function parseYoutubeStartSeconds(raw: string | null | undefined): number | null {
  if (!raw?.trim()) return null;
  const value = raw.trim().toLowerCase();
  if (/^\d+$/.test(value)) return Number.parseInt(value, 10);
  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!match) return null;
  const hours = Number.parseInt(match[1] || "0", 10);
  const minutes = Number.parseInt(match[2] || "0", 10);
  const seconds = Number.parseInt(match[3] || "0", 10);
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : null;
}

function isYoutubeHost(hostname: string): boolean {
  const host = hostname.replace(/^www\./, "").toLowerCase();
  return (
    host === "youtu.be" ||
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com"
  );
}

export function extractYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }
    if (isYoutubeHost(host)) {
      const id = parsed.searchParams.get("v");
      if (id) return id;
      const parts = parsed.pathname.split("/").filter(Boolean);
      const embedIndex = parts.indexOf("embed");
      if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1]!;
      if (parts[0] === "shorts" && parts[1]) return parts[1]!;
      if (parts[0] === "live" && parts[1]) return parts[1]!;
    }
    return null;
  } catch {
    return null;
  }
}

export function extractYoutubeStartSeconds(url: string): number | null {
  try {
    const parsed = new URL(url);
    const fromStart = parseYoutubeStartSeconds(parsed.searchParams.get("start"));
    if (fromStart != null) return fromStart;
    return parseYoutubeStartSeconds(parsed.searchParams.get("t"));
  } catch {
    return null;
  }
}

export function buildSecureYoutubeEmbedUrl(
  videoId: string,
  options?: { origin?: string; startSeconds?: number | null }
): string {
  const params = new URLSearchParams({ ...YOUTUBE_EMBED_PARAMS });
  if (options?.origin) params.set("origin", options.origin);
  if (options?.startSeconds != null && options.startSeconds > 0) {
    params.set("start", String(Math.floor(options.startSeconds)));
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function toSecureYoutubeEmbedUrl(url: string, origin?: string): string | null {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) return null;
  return buildSecureYoutubeEmbedUrl(videoId, {
    origin,
    startSeconds: extractYoutubeStartSeconds(url),
  });
}

export function normalizeYoutubeEmbedSrc(embedUrl: string, origin?: string): string {
  const videoId = extractYoutubeVideoId(embedUrl);
  if (!videoId) return embedUrl;
  return buildSecureYoutubeEmbedUrl(videoId, {
    origin,
    startSeconds: extractYoutubeStartSeconds(embedUrl),
  });
}
