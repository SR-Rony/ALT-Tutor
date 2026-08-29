"use client";

import { useEffect } from "react";

const RELOAD_KEY = "alt_tutor_chunk_reload";

function isChunkLoadFailure(reason: unknown): boolean {
  if (!reason) return false;
  const message =
    typeof reason === "string"
      ? reason
      : reason instanceof Error
        ? `${reason.name} ${reason.message}`
        : String(reason);
  return /ChunkLoadError|Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module|_next\/static\/chunks/i.test(
    message
  );
}

/** One hard reload when a stale/missing Next.js chunk fails after deploy. */
export function ChunkLoadRecovery() {
  useEffect(() => {
    const reloadOnce = () => {
      try {
        if (sessionStorage.getItem(RELOAD_KEY) === "1") return;
        sessionStorage.setItem(RELOAD_KEY, "1");
      } catch {
        // sessionStorage blocked — still attempt a single reload via flag on window
        const w = window as Window & { __altChunkReloaded?: boolean };
        if (w.__altChunkReloaded) return;
        w.__altChunkReloaded = true;
      }
      window.location.reload();
    };

    const onError = (event: ErrorEvent) => {
      if (isChunkLoadFailure(event.error) || isChunkLoadFailure(event.message)) {
        reloadOnce();
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadFailure(event.reason)) {
        reloadOnce();
      }
    };

    // Clear the one-shot flag after a successful settle so future deploys can recover again.
    const clearTimer = window.setTimeout(() => {
      try {
        sessionStorage.removeItem(RELOAD_KEY);
      } catch {
        /* ignore */
      }
    }, 15_000);

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.clearTimeout(clearTimer);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
