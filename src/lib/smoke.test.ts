import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/format";
import { buildCsv } from "@/lib/export-csv";
import { isPathAllowedForRole } from "@/lib/role-access";

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
    expect(isPathAllowedForRole("admin", "/admin/mcq-exams")).toBe(true);
    expect(isPathAllowedForRole("admin", "/teacher/assessments")).toBe(false);
  });
});
