export type MathSnippet = {
  label: string;
  snippet: string;
  title?: string;
};

export type MathSnippetGroup = {
  name: string;
  items: MathSnippet[];
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

/** Unwrap common math delimiters pasted from Word / ChatGPT / textbooks. */
export function stripWrappedLatex(raw: string): { latex: string; display?: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) return { latex: "" };

  // Remove outer \( \) / \[ \] / $ $ / $$ $$
  if (/^\\\([\s\S]*\\\)$/.test(trimmed)) {
    return { latex: trimmed.slice(2, -2).trim(), display: false };
  }
  if (/^\\\[[\s\S]*\\\]$/.test(trimmed)) {
    return { latex: trimmed.slice(2, -2).trim(), display: true };
  }
  if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length >= 4) {
    return { latex: trimmed.slice(2, -2).trim(), display: true };
  }
  if (
    trimmed.startsWith("$") &&
    trimmed.endsWith("$") &&
    trimmed.length >= 2 &&
    !trimmed.slice(1, -1).includes("$")
  ) {
    return { latex: trimmed.slice(1, -1).trim(), display: false };
  }

  // Strip a single outer \begin{equation}...\end{equation}
  const eqEnv = trimmed.match(
    /^\\begin\{equation\*?\}([\s\S]*)\\end\{equation\*?\}$/
  );
  if (eqEnv) {
    return { latex: eqEnv[1]!.trim(), display: true };
  }

  return { latex: trimmed };
}

export const MATH_SYMBOL_GROUPS: MathSnippetGroup[] = [
  {
    name: "Structure",
    items: [
      { label: "a/b", snippet: "\\dfrac{$0}{$1}", title: "Fraction" },
      { label: "x²", snippet: "{$0}^{$1}", title: "Power / superscript" },
      { label: "xₙ", snippet: "{$0}_{$1}", title: "Subscript" },
      { label: "√", snippet: "\\sqrt{$0}", title: "Square root" },
      { label: "ⁿ√", snippet: "\\sqrt[$1]{$0}", title: "Nth root" },
      { label: "()", snippet: "\\left($0\\right)", title: "Round brackets" },
      { label: "[]", snippet: "\\left[$0\\right]", title: "Square brackets" },
      { label: "{}", snippet: "\\left\\{$0\\right\\}", title: "Curly braces" },
      { label: "|x|", snippet: "\\left|$0\\right|", title: "Absolute value" },
      { label: "⋯", snippet: "\\cdots", title: "Centered dots" },
    ],
  },
  {
    name: "Calculus",
    items: [
      { label: "Σ", snippet: "\\sum_{$0}^{$1}", title: "Summation" },
      { label: "Π", snippet: "\\prod_{$0}^{$1}", title: "Product" },
      { label: "∫", snippet: "\\int_{$0}^{$1}", title: "Integral" },
      { label: "∬", snippet: "\\iint_{$0}", title: "Double integral" },
      { label: "lim", snippet: "\\lim_{$0 \\to $1}", title: "Limit" },
      { label: "d/dx", snippet: "\\dfrac{d}{dx}$0", title: "Derivative" },
      { label: "∂", snippet: "\\dfrac{\\partial $0}{\\partial $1}", title: "Partial derivative" },
      { label: "nCk", snippet: "\\binom{$0}{$1}", title: "Binomial coefficient" },
    ],
  },
  {
    name: "Functions",
    items: [
      { label: "sin", snippet: "\\sin", title: "Sine" },
      { label: "cos", snippet: "\\cos", title: "Cosine" },
      { label: "tan", snippet: "\\tan", title: "Tangent" },
      { label: "log", snippet: "\\log", title: "Logarithm" },
      { label: "ln", snippet: "\\ln", title: "Natural log" },
      { label: "exp", snippet: "\\exp", title: "Exponential" },
      { label: "max", snippet: "\\max", title: "Maximum" },
      { label: "min", snippet: "\\min", title: "Minimum" },
    ],
  },
  {
    name: "Greek",
    items: [
      { label: "α", snippet: "\\alpha", title: "Alpha" },
      { label: "β", snippet: "\\beta", title: "Beta" },
      { label: "γ", snippet: "\\gamma", title: "Gamma" },
      { label: "θ", snippet: "\\theta", title: "Theta" },
      { label: "λ", snippet: "\\lambda", title: "Lambda" },
      { label: "μ", snippet: "\\mu", title: "Mu" },
      { label: "π", snippet: "\\pi", title: "Pi" },
      { label: "σ", snippet: "\\sigma", title: "Sigma" },
      { label: "φ", snippet: "\\phi", title: "Phi" },
      { label: "ω", snippet: "\\omega", title: "Omega" },
      { label: "Δ", snippet: "\\Delta", title: "Delta" },
      { label: "Σ", snippet: "\\Sigma", title: "Capital Sigma" },
    ],
  },
  {
    name: "Operators",
    items: [
      { label: "±", snippet: "\\pm", title: "Plus-minus" },
      { label: "∓", snippet: "\\mp", title: "Minus-plus" },
      { label: "×", snippet: "\\times", title: "Times" },
      { label: "÷", snippet: "\\div", title: "Divide" },
      { label: "·", snippet: "\\cdot", title: "Dot product" },
      { label: "≠", snippet: "\\neq", title: "Not equal" },
      { label: "≈", snippet: "\\approx", title: "Approximately" },
      { label: "≤", snippet: "\\leq", title: "Less or equal" },
      { label: "≥", snippet: "\\geq", title: "Greater or equal" },
      { label: "∞", snippet: "\\infty", title: "Infinity" },
      { label: "→", snippet: "\\to", title: "Arrow" },
      { label: "⇒", snippet: "\\Rightarrow", title: "Implies" },
      { label: "∈", snippet: "\\in", title: "Element of" },
      { label: "vec", snippet: "\\vec{$0}", title: "Vector" },
      { label: "hat", snippet: "\\hat{$0}", title: "Hat" },
      { label: "bar", snippet: "\\bar{$0}", title: "Bar / mean" },
    ],
  },
  {
    name: "Matrices",
    items: [
      {
        label: "2×2",
        snippet: "\\begin{pmatrix} $0 &  \\\\  &  \\end{pmatrix}",
        title: "2×2 matrix",
      },
      {
        label: "cases",
        snippet: "\\begin{cases} $0 \\\\  \\end{cases}",
        title: "Piecewise / cases",
      },
      {
        label: "aligned",
        snippet: "\\begin{aligned} $0 &=  \\\\  &=  \\end{aligned}",
        title: "Aligned multi-line",
      },
    ],
  },
];

/** Flat list kept for any older callers. */
export const MATH_SYMBOLS: MathSnippet[] = MATH_SYMBOL_GROUPS.flatMap((g) => g.items);

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
    name: "Quadratic",
    latex: "x = \\dfrac{-b \\pm \\sqrt{b^{2}-4ac}}{2a}",
  },
  {
    name: "Limit",
    latex: "\\lim_{x \\to 0} \\dfrac{\\sin x}{x} = 1",
  },
  {
    name: "Integral",
    latex: "\\int_{-\\infty}^{\\infty} e^{-x^{2}} \\, dx = \\sqrt{\\pi}",
  },
  {
    name: "Matrix",
    latex: "A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
  },
  {
    name: "Cases",
    latex:
      "f(x) = \\begin{cases} x^{2} & x \\ge 0 \\\\ -x & x < 0 \\end{cases}",
  },
  {
    name: "Fraction",
    latex: "a = \\dfrac{F}{m}",
  },
];
