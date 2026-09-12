"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { Button } from "@/components/ui/button";
import {
  applyLatexSnippet,
  MATH_EXAMPLES,
  MATH_SYMBOLS,
  stripWrappedLatex,
} from "@/lib/math-snippets";
import { renderKatex } from "@/lib/tiptap-math";
import { cn } from "@/utils";

type MathEquationDialogProps = {
  open: boolean;
  initialLatex?: string;
  initialDisplay?: boolean;
  onClose: () => void;
  onInsert: (latex: string, display: boolean) => void;
};

export function MathEquationDialog({
  open,
  initialLatex = "",
  initialDisplay = true,
  onClose,
  onInsert,
}: MathEquationDialogProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [latex, setLatex] = useState(initialLatex);
  const [display, setDisplay] = useState(initialDisplay);

  useEffect(() => {
    if (!open) return;
    setLatex(initialLatex);
    setDisplay(initialDisplay);
    const id = window.setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }, 40);
    return () => window.clearTimeout(id);
  }, [open, initialLatex, initialDisplay]);

  const previewHtml = useMemo(() => {
    const trimmed = stripWrappedLatex(latex).latex;
    if (!trimmed) return "";
    return renderKatex(trimmed, display);
  }, [latex, display]);

  const insertSnippet = (snippet: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? latex.length;
    const end = el?.selectionEnd ?? latex.length;
    const next = applyLatexSnippet(latex, start, end, snippet);
    setLatex(next.value);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(next.cursor, next.cursor);
    });
  };

  const submit = () => {
    const parsed = stripWrappedLatex(latex);
    const nextLatex = parsed.latex;
    if (!nextLatex) return;
    onInsert(nextLatex, parsed.display ?? display);
    onClose();
  };

  return (
    <AdminModal
      open={open}
      title="Write equation"
      description="Insert a centred exam-style equation. Use the buttons if you don’t want to type LaTeX."
      onClose={onClose}
      className="sm:max-w-2xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-lg border border-border p-0.5 text-xs font-semibold">
            <button
              type="button"
              className={cn(
                "rounded-md px-2.5 py-1.5 transition",
                display ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setDisplay(true)}
            >
              Display (centered)
            </button>
            <button
              type="button"
              className={cn(
                "rounded-md px-2.5 py-1.5 transition",
                !display ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setDisplay(false)}
            >
              Inline
            </button>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" disabled={!stripWrappedLatex(latex).latex} onClick={submit}>
              Insert equation
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {MATH_SYMBOLS.map((item) => (
            <button
              key={item.label}
              type="button"
              title={item.title ?? item.label}
              onClick={() => insertSnippet(item.snippet)}
              className="rounded-lg border border-border bg-muted/40 px-2 py-1 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-primary-muted"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {MATH_EXAMPLES.map((example) => (
            <button
              key={example.name}
              type="button"
              onClick={() => {
                setLatex(example.latex);
                setDisplay(true);
              }}
              className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              {example.name} example
            </button>
          ))}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Equation
          </span>
          <textarea
            ref={textareaRef}
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            rows={4}
            spellCheck={false}
            placeholder="(x + a)^{n} = \sum_{k=0}^{n} \binom{n}{k} x^{k} a^{n-k}"
            className="w-full resize-y rounded-xl border border-border bg-card px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
        </label>

        <div className="rounded-xl border border-border bg-muted/20 px-3 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Preview
          </p>
          {previewHtml ? (
            <div
              className={cn("overflow-x-auto text-foreground", display && "text-center")}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Type or pick a symbol to see the equation here.</p>
          )}
        </div>
      </div>
    </AdminModal>
  );
}
