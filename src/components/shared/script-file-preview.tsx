"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadService } from "@/services/upload.service";
import { cn } from "@/utils";

export type ScriptFileKind = "pdf" | "image" | "other";

export function scriptFileKind(url: string): ScriptFileKind {
  const clean = url.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";
  if (clean.endsWith(".pdf")) return "pdf";
  if (/\.(png|jpe?g|gif|webp|bmp)$/i.test(clean)) return "image";
  return "other";
}

/** Prefer Cloudinary image delivery for PDFs (opens inline instead of download). */
function preferInlineDeliveryUrl(url: string) {
  if (!url.includes("res.cloudinary.com")) return url;
  if (url.includes("/raw/upload/") && url.toLowerCase().includes(".pdf")) {
    return url.replace("/raw/upload/", "/image/upload/");
  }
  return url;
}

async function loadInlineBlobUrl(url: string, kind: ScriptFileKind): Promise<string> {
  // The API proxy sets Content-Disposition: inline so the browser previews instead of downloading.
  try {
    const blob = await uploadService.fetchInlineBlob(url);
    const typed =
      kind === "pdf" ? new Blob([await blob.arrayBuffer()], { type: "application/pdf" }) : blob;
    return URL.createObjectURL(typed);
  } catch {
    // Fall through to a direct fetch (may fail on CORS / attachment headers).
  }

  const candidates = [...new Set([preferInlineDeliveryUrl(url), url])];
  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, { mode: "cors" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      const type =
        kind === "pdf" ? "application/pdf" : kind === "image" ? "image/jpeg" : "application/octet-stream";
      return URL.createObjectURL(new Blob([buf], { type }));
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error("Could not load file");
}

export async function openScriptFile(url: string) {
  const kind = scriptFileKind(url);
  // Open synchronously so popup blockers allow it, then point it at the blob once loaded.
  const win = window.open("", "_blank");
  if (win) win.opener = null;
  try {
    const objectUrl = await loadInlineBlobUrl(url, kind);
    if (win) win.location.href = objectUrl;
    else window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
  } catch {
    const fallback = preferInlineDeliveryUrl(url);
    if (win) win.location.href = fallback;
    else window.open(fallback, "_blank", "noopener,noreferrer");
  }
}

/** Inline preview of an uploaded answer / checked script (PDF, image, or a link for other types). */
export function ScriptFilePreview({
  url,
  label,
  actions,
  className,
  headerClassName,
}: {
  url: string;
  label: string;
  /** Extra controls rendered in the header (e.g. a remove button). */
  actions?: ReactNode;
  className?: string;
  headerClassName?: string;
}) {
  const kind = scriptFileKind(url);
  const [pdfSrc, setPdfSrc] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(kind === "pdf");

  useEffect(() => {
    if (kind !== "pdf") return;
    let active = true;
    let objectUrl: string | null = null;
    setPdfLoading(true);
    setPdfError(null);
    setPdfSrc(null);
    void loadInlineBlobUrl(url, "pdf")
      .then((src) => {
        if (!active) {
          URL.revokeObjectURL(src);
          return;
        }
        objectUrl = src;
        setPdfSrc(src);
      })
      .catch(() => {
        if (active) setPdfError("Could not preview this PDF here. Use Open full size.");
      })
      .finally(() => {
        if (active) setPdfLoading(false);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, kind]);

  const openButton = (
    <Button type="button" size="sm" variant="outline" onClick={() => void openScriptFile(url)}>
      Open file
      <ExternalLink className="h-3.5 w-3.5" />
    </Button>
  );

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2",
          headerClassName
        )}
      >
        <p className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-foreground">
          <FileText className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          <span className="truncate">{label}</span>
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void openScriptFile(url)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Open full size
            <ExternalLink className="h-3 w-3" aria-hidden />
          </button>
          {actions}
        </div>
      </div>
      {kind === "pdf" ? (
        pdfLoading ? (
          <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading preview…
          </div>
        ) : pdfSrc ? (
          <iframe
            title={label}
            src={`${pdfSrc}#view=FitH`}
            className="h-[min(70vh,40rem)] w-full bg-muted/30"
          />
        ) : (
          <div className="space-y-2 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">{pdfError || "Preview unavailable."}</p>
            {openButton}
          </div>
        )
      ) : kind === "image" ? (
        <div className="max-h-[min(70vh,40rem)] overflow-y-auto bg-muted/20 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preferInlineDeliveryUrl(url)}
            alt={label}
            className="mx-auto max-w-full rounded-lg border border-border"
          />
        </div>
      ) : (
        <div className="space-y-2 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Preview not available for this file type. Open it in a new tab.
          </p>
          {openButton}
        </div>
      )}
    </div>
  );
}
