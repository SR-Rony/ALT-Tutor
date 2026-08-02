"use client";

import { ExternalLink, PlayCircle } from "lucide-react";
import { cn } from "@/utils";

export const STUDY_QUESTION_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

export function paperDisplayLabel(paper?: string | null) {
  if (!paper) return "Paper";
  const match = String(paper).toUpperCase().match(/PAPER_?(\d+)/);
  const n = match ? match[1] : "1";
  return `Paper ${n}`;
}

function difficultyMeta(d: string) {
  const key = d.toUpperCase();
  if (key === "HARD") return { label: "Hard", color: "text-accent", filled: 4, total: 4 };
  if (key === "MEDIUM") return { label: "Medium", color: "text-[#f59e0b]", filled: 2, total: 4 };
  return { label: "Easy", color: "text-accent-green", filled: 1, total: 4 };
}

function keyDot(label: string) {
  if (label === "Hard") return "bg-accent";
  if (label === "Medium") return "bg-[#f59e0b]";
  return "bg-accent-green";
}

export function DifficultyDots({ difficulty }: { difficulty: string }) {
  const meta = difficultyMeta(difficulty);
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-semibold", meta.color)}>
      {meta.label}
      <span className="inline-flex gap-1">
        {Array.from({ length: meta.total }).map((_, i) => (
          <span
            key={i}
            className={cn("h-2 w-2 rounded-full", i < meta.filled ? keyDot(meta.label) : "bg-border")}
          />
        ))}
      </span>
    </span>
  );
}

export function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
      if (parts[0] === "shorts" && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function VideoEmbed({ url }: { url: string }) {
  const yt = youtubeEmbedUrl(url);
  if (yt) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-sm">
        <iframe
          src={yt}
          title="Video solution"
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  const lower = url.toLowerCase();
  if (/\.(mp4|webm|ogg)(\?|$)/.test(lower)) {
    return (
      <video
        controls
        className="aspect-video w-full rounded-xl border border-border bg-black shadow-sm"
        src={url}
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
      <PlayCircle className="mx-auto mb-2 h-8 w-8 text-primary" />
      <p className="text-sm text-muted-foreground">Inline preview is unavailable for this link.</p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        Watch video <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
