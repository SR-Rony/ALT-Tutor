"use client";

import { useMemo } from "react";
import { enhanceSlashEquationsHtml } from "@/lib/equation-display";
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

function replaceNuclideSyntax(text: string): string {
  return text.replace(/\^\{(\d{1,3})\}_\{(\d{1,3})\}([A-Za-z]+)/g, "<sup>$1</sup><sub>$2</sub>$3");
}

export function RichTextContent({
  html,
  className,
  as: Tag = "div",
  inline = false,
}: RichTextContentProps) {
  const rendered = useMemo(() => {
    if (!html?.trim()) return null;
    const normalizedHtml = replaceNuclideSyntax(html);
    if (!looksLikeHtml(normalizedHtml)) {
      const enhanced = enhanceSlashEquationsHtml(normalizedHtml);
      if (enhanced !== normalizedHtml && enhanced.includes("qb-math")) {
        return { kind: "html" as const, html: enhanced };
      }
      return { kind: "plain" as const, text: normalizedHtml };
    }
    const clean = sanitizeRichHtml(normalizedHtml);
    const withStoredMath = hydrateKatexHtml(clean);
    const withEquations = enhanceSlashEquationsHtml(withStoredMath);
    return { kind: "html" as const, html: withEquations };
  }, [html]);

  if (!rendered) return null;

  const ResolvedTag = (inline ? "span" : Tag) as "div" | "span" | "p";

  if (rendered.kind === "plain") {
    return (
      <ResolvedTag
        className={cn(
          "rich-text-content",
          inline && "rich-text-content--inline",
          "whitespace-pre-wrap break-words",
          className
        )}
      >
        {rendered.text}
      </ResolvedTag>
    );
  }

  return (
    <ResolvedTag
      className={cn(
        "rich-text-content whitespace-pre-wrap",
        inline && "rich-text-content--inline",
        className
      )}
      dangerouslySetInnerHTML={{ __html: rendered.html }}
    />
  );
}
