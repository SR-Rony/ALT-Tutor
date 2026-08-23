"use client";

import { useMemo } from "react";
import { looksLikeHtml } from "@/lib/rich-text";
import { sanitizeRichHtml } from "@/lib/sanitize-rich-html";
import { hydrateKatexHtml } from "@/lib/tiptap-math";
import { cn } from "@/utils";

type RichTextContentProps = {
  html: string | null | undefined;
  className?: string;
  as?: "div" | "span" | "p";
  /** Single-line MCQ options: keep label and text on one baseline. */
  inline?: boolean;
};

export function RichTextContent({
  html,
  className,
  as: Tag = "div",
  inline = false,
}: RichTextContentProps) {
  const rendered = useMemo(() => {
    if (!html?.trim()) return null;
    if (!looksLikeHtml(html)) return { kind: "plain" as const, text: html };
    const clean = sanitizeRichHtml(html);
    const withMath = hydrateKatexHtml(clean);
    return { kind: "html" as const, html: withMath };
  }, [html]);

  if (!rendered) return null;

  const ResolvedTag = (inline ? "span" : Tag) as "div" | "span" | "p";

  if (rendered.kind === "plain") {
    return (
      <ResolvedTag className={cn(inline && "rich-text-content--inline", "whitespace-pre-line", className)}>
        {rendered.text}
      </ResolvedTag>
    );
  }

  return (
    <ResolvedTag
      className={cn("rich-text-content", inline && "rich-text-content--inline", className)}
      dangerouslySetInnerHTML={{ __html: rendered.html }}
    />
  );
}
