"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";
import { looksLikeHtml } from "@/lib/rich-text";
import { hydrateKatexHtml } from "@/lib/tiptap-math";
import { cn } from "@/utils";

type RichTextContentProps = {
  html: string | null | undefined;
  className?: string;
  as?: "div" | "span" | "p";
};

export function RichTextContent({ html, className, as: Tag = "div" }: RichTextContentProps) {
  const rendered = useMemo(() => {
    if (!html?.trim()) return null;
    if (!looksLikeHtml(html)) return { kind: "plain" as const, text: html };
    const clean = DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ADD_TAGS: ["img", "span", "sup", "sub"],
      ADD_ATTR: ["src", "alt", "title", "class", "data-latex", "width", "height"],
    });
    const withMath = hydrateKatexHtml(clean);
    return { kind: "html" as const, html: withMath };
  }, [html]);

  if (!rendered) return null;

  if (rendered.kind === "plain") {
    return <Tag className={cn("whitespace-pre-line", className)}>{rendered.text}</Tag>;
  }

  return (
    <Tag
      className={cn("rich-text-content", className)}
      dangerouslySetInnerHTML={{ __html: rendered.html }}
    />
  );
}
