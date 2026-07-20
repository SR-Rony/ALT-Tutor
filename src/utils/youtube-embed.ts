const YOUTUBE_EMBED_PARAMS = {
  modestbranding: "1",
  rel: "0",
  iv_load_policy: "3",
  controls: "1",
  fs: "0",
  disablekb: "1",
  playsinline: "1",
  cc_load_policy: "0",
  color: "white",
} as const;

export function extractYoutubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return id;
      const parts = parsed.pathname.split("/").filter(Boolean);
      const embedIndex = parts.indexOf("embed");
      if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1]!;
      if (parts[0] === "shorts" && parts[1]) return parts[1]!;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildSecureYoutubeEmbedUrl(videoId: string, origin?: string): string {
  const params = new URLSearchParams({ ...YOUTUBE_EMBED_PARAMS });
  if (origin) params.set("origin", origin);
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function toSecureYoutubeEmbedUrl(url: string, origin?: string): string | null {
  const videoId = extractYoutubeVideoId(url);
  if (!videoId) return null;
  return buildSecureYoutubeEmbedUrl(videoId, origin);
}

export function normalizeYoutubeEmbedSrc(embedUrl: string, origin?: string): string {
  const videoId = extractYoutubeVideoId(embedUrl);
  if (!videoId) return embedUrl;
  return buildSecureYoutubeEmbedUrl(videoId, origin);
}
