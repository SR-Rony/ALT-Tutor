"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type VideoModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function VideoModal({ open, title, onClose, children }: VideoModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close video"
        className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-modal-title"
        className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#dce4f0] bg-white shadow-[0_24px_80px_-20px_rgba(15,23,42,0.45)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#eef2f8] px-4 py-3 sm:px-5 sm:py-4">
          <h2 id="video-modal-title" className="line-clamp-2 pr-2 text-base font-bold text-[#1a2b5e] sm:text-lg">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-2 text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#1a2b5e]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="bg-black">{children}</div>
      </div>
    </div>
  );
}
