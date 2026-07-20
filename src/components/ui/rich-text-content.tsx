"use client";

import DOMPurify from "dompurify";
import { looksLikeHtml } from "@/lib/rich-text";
import { cn } from "@/utils";

type RichTextContentProps = {
  html: string | null | undefined;
  className?: string;
  as?: "div" | "span" | "p";
};

export function RichTextContent({ html, className, as: Tag = "div" }: RichTextContentProps) {
  if (!html?.trim()) return null;

  if (!looksLikeHtml(html)) {
    return <Tag className={cn("whitespace-pre-line", className)}>{html}</Tag>;
  }

  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  return (
    <Tag
      className={cn("rich-text-content", className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
