"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const RELOAD_KEY = "alt_tutor_chunk_reload";

function isChunkLoadError(error: Error & { digest?: string }) {
  return (
    error.name === "ChunkLoadError" ||
    /Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module|_next\/static\/chunks/i.test(
      error.message
    )
  );
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (!isChunkLoadError(error)) return;
    try {
      if (sessionStorage.getItem(RELOAD_KEY) === "1") return;
      sessionStorage.setItem(RELOAD_KEY, "1");
    } catch {
      return;
    }
    window.location.reload();
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        A required page file failed to load. This often happens right after a new deploy —
        reload the page to get the latest version.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" onClick={() => window.location.reload()}>
          Reload page
        </Button>
        <Button type="button" variant="outline" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
