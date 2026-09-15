import { describe, expect, it } from "vitest";
import { applyLatexSnippet, stripWrappedLatex } from "@/lib/math-snippets";
import { getKatexParseError, renderKatex } from "@/lib/tiptap-math";

describe("math snippets", () => {
  it("inserts a fraction around the cursor", () => {
    expect(applyLatexSnippet("a = ", 4, 4, "\\dfrac{$0}{$1}")).toEqual({
      value: "a = \\dfrac{}{}",
      cursor: 11,
    });
  });

  it("wraps selected text as the first field", () => {
    expect(applyLatexSnippet("force", 0, 5, "\\dfrac{$0}{$1}")).toEqual({
      value: "\\dfrac{force}{}",
      cursor: 12,
    });
  });

  it("unwraps display math delimiters", () => {
    expect(stripWrappedLatex("$$\\sum_i x_i$$")).toEqual({
      latex: "\\sum_i x_i",
      display: true,
    });
  });

  it("unwraps \\( \\) and \\[ \\] wrappers", () => {
    expect(stripWrappedLatex("\\(\\alpha + \\beta\\)")).toEqual({
      latex: "\\alpha + \\beta",
      display: false,
    });
    expect(stripWrappedLatex("\\[E = mc^{2}\\]")).toEqual({
      latex: "E = mc^{2}",
      display: true,
    });
  });
});

describe("katex complex equations", () => {
  it("renders binomial theorem", () => {
    const latex = "(x + a)^{n} = \\sum_{k=0}^{n} \\binom{n}{k} x^{k} a^{n-k}";
    expect(getKatexParseError(latex)).toBeNull();
    expect(renderKatex(latex, true)).toContain("katex");
  });

  it("renders fourier series", () => {
    const latex =
      "f(x) = a_{0} + \\sum_{n=1}^{\\infty}\\left(a_{n}\\cos\\frac{n\\pi x}{L} + b_{n}\\sin\\frac{n\\pi x}{L}\\right)";
    expect(getKatexParseError(latex)).toBeNull();
    expect(renderKatex(latex, true)).toContain("katex");
  });

  it("reports parse errors", () => {
    expect(getKatexParseError("\\sum_{")).toMatch(/Expected|EOF|}/i);
  });
});
