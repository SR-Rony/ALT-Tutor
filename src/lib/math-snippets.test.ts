import { describe, expect, it } from "vitest";
import { applyLatexSnippet, stripWrappedLatex } from "@/lib/math-snippets";

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
});
