"use client";

import { Button } from "@/components/ui/button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
