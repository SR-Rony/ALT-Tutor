import { describe, expect, it } from "vitest";
import { applyLatexSnippet, MATH_EXAMPLES, stripWrappedLatex } from "@/lib/math-snippets";
import { getKatexParseError, normalizeEquationLatex, renderKatex } from "@/lib/tiptap-math";

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

describe("normalizeEquationLatex", () => {
  it("turns quoted words into upright text with spaces", () => {
    expect(
      normalizeEquationLatex('\\dfrac{"total energy output" }{"total energy input" }\\times100')
    ).toBe("\\dfrac{\\text{total energy output} }{\\text{total energy input} }\\times100");
  });

  it("turns unquoted multi-word runs and long words into text", () => {
    expect(normalizeEquationLatex("\\dfrac{useful energy output}{time} \\times 100%")).toBe(
      "\\dfrac{\\text{useful energy output}}{\\text{time}} \\times 100\\%"
    );
    expect(normalizeEquationLatex("work = force \\times distance")).toBe(
      "\\text{work} = \\text{force} \\times \\text{distance}"
    );
  });

  it("keeps variables, commands and existing text groups untouched", () => {
    expect(normalizeEquationLatex("F = ma")).toBe("F = ma");
    expect(normalizeEquationLatex("E_{k} = \\frac{1}{2} m v^{2}")).toBe("E_{k} = \\frac{1}{2} m v^{2}");
    expect(normalizeEquationLatex("v = \\text{total distance} \\, \\mathrm{m s^{-1}}")).toBe(
      "v = \\text{total distance} \\, \\mathrm{m s^{-1}}"
    );
    expect(normalizeEquationLatex("50\\% \\;")).toBe("50\\% \\;");
    for (const example of MATH_EXAMPLES) {
      expect(normalizeEquationLatex(example.latex)).toBe(example.latex);
    }
  });
});
