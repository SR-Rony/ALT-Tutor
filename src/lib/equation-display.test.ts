import { describe, expect, it } from "vitest";
import { slashEquationToLatex, tryParseSlashEquation } from "@/lib/equation-display";

describe("equation-display", () => {
  it("parses Cambridge-style slash equations", () => {
    expect(tryParseSlashEquation("acceleration = force / mass")).toBe(
      slashEquationToLatex("acceleration", "force", "mass")
    );
    expect(tryParseSlashEquation("velocity = displacement / time")).toBe(
      slashEquationToLatex("velocity", "displacement", "time")
    );
  });

  it("rejects non-equation text", () => {
    expect(tryParseSlashEquation("diameter of a cylinder")).toBeNull();
    expect(tryParseSlashEquation("a / b")).toBeNull();
  });
});
