export type MathSnippet = {
  label: string;
  snippet: string;
  title?: string;
};

/** $0 = selection / first cursor, $1 = next empty field. */
export function applyLatexSnippet(
  value: string,
  start: number,
  end: number,
  snippet: string
): { value: string; cursor: number } {
  const selected = value.slice(start, end);
  let out = "";
  let cursor = start;
  let cursorSet = false;
  for (let i = 0; i < snippet.length; i += 1) {
    const next = snippet[i + 1];
    if (snippet[i] === "$" && next && /\d/.test(next)) {
      const piece = next === "0" ? selected : "";
      if (!cursorSet) {
        cursor = start + out.length + piece.length;
        cursorSet = true;
      }
      out += piece;
      i += 1;
      continue;
    }
    out += snippet[i];
  }
  if (!cursorSet) cursor = start + out.length;
  return {
    value: value.slice(0, start) + out + value.slice(end),
    cursor,
  };
}

export function stripWrappedLatex(raw: string): { latex: string; display?: boolean } {
  const trimmed = raw.trim();
  if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length >= 4) {
    return { latex: trimmed.slice(2, -2).trim(), display: true };
  }
  if (trimmed.startsWith("$") && trimmed.endsWith("$") && trimmed.length >= 2) {
    return { latex: trimmed.slice(1, -1).trim(), display: false };
  }
  return { latex: trimmed };
}

export const MATH_SYMBOLS: MathSnippet[] = [
  { label: "a/b", snippet: "\\dfrac{$0}{$1}", title: "Fraction" },
  { label: "x²", snippet: "{$0}^{$1}", title: "Superscript" },
  { label: "xₙ", snippet: "{$0}_{$1}", title: "Subscript" },
  { label: "√", snippet: "\\sqrt{$0}", title: "Square root" },
  { label: "Σ", snippet: "\\sum_{$0}^{$1}", title: "Summation" },
  { label: "nCk", snippet: "\\binom{$0}{$1}", title: "Binomial" },
  { label: "∫", snippet: "\\int_{$0}^{$1}", title: "Integral" },
  { label: "()", snippet: "\\left($0\\right)", title: "Brackets" },
  { label: "π", snippet: "\\pi", title: "Pi" },
  { label: "∞", snippet: "\\infty", title: "Infinity" },
  { label: "θ", snippet: "\\theta", title: "Theta" },
  { label: "±", snippet: "\\pm", title: "Plus-minus" },
  { label: "×", snippet: "\\times", title: "Times" },
  { label: "cos", snippet: "\\cos", title: "Cosine" },
  { label: "sin", snippet: "\\sin", title: "Sine" },
];

export const MATH_EXAMPLES: { name: string; latex: string }[] = [
  {
    name: "Binomial",
    latex: "(x + a)^{n} = \\sum_{k=0}^{n} \\binom{n}{k} x^{k} a^{n-k}",
  },
  {
    name: "Fourier",
    latex:
      "f(x) = a_{0} + \\sum_{n=1}^{\\infty}\\left(a_{n}\\cos\\frac{n\\pi x}{L} + b_{n}\\sin\\frac{n\\pi x}{L}\\right)",
  },
  {
    name: "Fraction",
    latex: "a = \\dfrac{F}{m}",
  },
];
