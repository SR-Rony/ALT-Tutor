"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminModal } from "@/components/admin/shared/admin-modal";
import { Button } from "@/components/ui/button";
import {
  applyLatexSnippet,
  MATH_EXAMPLES,
  MATH_SYMBOL_GROUPS,
  stripWrappedLatex,
} from "@/lib/math-snippets";
import { getKatexParseError, renderKatex } from "@/lib/tiptap-math";
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
  const [activeGroup, setActiveGroup] = useState(MATH_SYMBOL_GROUPS[0]?.name ?? "Structure");

  useEffect(() => {
    if (!open) return;
    setLatex(initialLatex);
    setDisplay(initialDisplay);
    setActiveGroup(MATH_SYMBOL_GROUPS[0]?.name ?? "Structure");
    const id = window.setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }, 40);
    return () => window.clearTimeout(id);
  }, [open, initialLatex, initialDisplay]);

  const parsed = useMemo(() => stripWrappedLatex(latex), [latex]);
  const parseError = useMemo(
    () => (parsed.latex ? getKatexParseError(parsed.latex, display) : null),
    [parsed.latex, display]
  );
  const previewHtml = useMemo(() => {
    if (!parsed.latex || parseError) return "";
    return renderKatex(parsed.latex, display);
  }, [parsed.latex, display, parseError]);

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
    const next = stripWrappedLatex(latex);
    if (!next.latex || getKatexParseError(next.latex, next.display ?? display)) return;
    onInsert(next.latex, next.display ?? display);
    onClose();
  };

  const groupItems =
    MATH_SYMBOL_GROUPS.find((g) => g.name === activeGroup)?.items ?? MATH_SYMBOL_GROUPS[0]?.items ?? [];

  return (
    <AdminModal
      open={open}
      title="Write equation"
      description="Any exam-style equation works here — fractions, sums, matrices, limits, Fourier series, and more. Paste LaTeX or pick symbols."
      onClose={onClose}
      className="sm:max-w-3xl"
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
            <Button
              type="button"
              disabled={!parsed.latex || Boolean(parseError)}
              onClick={submit}
            >
              Insert equation
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {MATH_SYMBOL_GROUPS.map((group) => (
            <button
              key={group.name}
              type="button"
              onClick={() => setActiveGroup(group.name)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                activeGroup === group.name
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-muted/40 text-muted-foreground hover:text-foreground"
              )}
            >
              {group.name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {groupItems.map((item) => (
            <button
              key={`${activeGroup}-${item.label}-${item.snippet}`}
              type="button"
              title={item.title ?? item.label}
              onClick={() => insertSnippet(item.snippet)}
              className="rounded-lg border border-border bg-muted/40 px-2 py-1 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-primary-muted"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Ready examples
          </p>
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
                {example.name}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Equation (LaTeX)
          </span>
          <textarea
            ref={textareaRef}
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              if (!text) return;
              const wrapped = stripWrappedLatex(text);
              if (wrapped.display != null || text.trim() !== wrapped.latex) {
                e.preventDefault();
                setLatex(wrapped.latex);
                if (wrapped.display != null) setDisplay(wrapped.display);
              }
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            rows={7}
            spellCheck={false}
            placeholder={
              "(x + a)^{n} = \\sum_{k=0}^{n} \\binom{n}{k} x^{k} a^{n-k}"
            }
            className="min-h-[9rem] w-full resize-y rounded-xl border border-border bg-card px-3 py-2 font-mono text-sm leading-relaxed text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Tip: paste from ChatGPT / Word with <code className="rounded bg-muted px-1">$...$</code>{" "}
            or <code className="rounded bg-muted px-1">$$...$$</code> — wrappers are removed
            automatically. Ctrl+Enter to insert.
          </p>
        </label>

        <div className="rounded-xl border border-border bg-muted/20 px-3 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Preview
          </p>
          {parseError ? (
            <p className="rounded-lg border border-[#fecdca] bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]">
              {parseError}
            </p>
          ) : previewHtml ? (
            <div
              className={cn(
                "overflow-x-auto text-foreground [&_.katex]:text-[1.15em]",
                display && "text-center [&_.katex-display]:my-0"
              )}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Type LaTeX, pick a symbol, or load an example to preview here.
            </p>
          )}
        </div>
      </div>
    </AdminModal>
  );
}
