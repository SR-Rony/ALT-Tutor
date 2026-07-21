import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/format";
import { buildCsv } from "@/lib/export-csv";
import { isPathAllowedForRole } from "@/lib/role-access";
import { isRichTextEmpty, richTextToPlain, serializeRichText } from "@/lib/rich-text";

describe("formatMoney", () => {
  it("formats whole dollars without cents", () => {
    expect(formatMoney(499)).toBe("$499");
  });

  it("formats fractional amounts with cents", () => {
    expect(formatMoney(12.5)).toBe("$12.50");
  });
});

describe("buildCsv", () => {
  it("escapes commas and quotes", () => {
    expect(buildCsv([["a", 'say "hi"', "x,y"]])).toBe('a,"say ""hi""","x,y"');
  });
});

describe("rich text helpers", () => {
  it("detects empty editor HTML", () => {
    expect(isRichTextEmpty("")).toBe(true);
    expect(isRichTextEmpty("<p></p>")).toBe(true);
    expect(isRichTextEmpty("<p>Hello</p>")).toBe(false);
  });

  it("strips HTML for previews", () => {
    expect(richTextToPlain("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });

  it("serializes optional rich text", () => {
    expect(serializeRichText("<p></p>")).toBe("");
    expect(serializeRichText("Plain text")).toContain("<p>");
  });
});

describe("role path access", () => {
  it("keeps students on /student routes", () => {
    expect(isPathAllowedForRole("student", "/student/assignments")).toBe(true);
    expect(isPathAllowedForRole("student", "/admin/gradebook")).toBe(false);
  });

  it("keeps teachers on /teacher routes", () => {
    expect(isPathAllowedForRole("teacher", "/teacher/grading")).toBe(true);
    expect(isPathAllowedForRole("teacher", "/student/payments")).toBe(false);
  });

  it("keeps admins on /admin routes", () => {
    expect(isPathAllowedForRole("admin", "/admin/exams/mcq")).toBe(true);
    expect(isPathAllowedForRole("admin", "/admin/exams/written")).toBe(true);
    expect(isPathAllowedForRole("admin", "/teacher/assessments")).toBe(false);
  });
});
