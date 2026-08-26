import { describe, expect, it } from "vitest";
import { compareNaturalTitle, leadingSerialNumber } from "@/utils/natural-sort";

describe("natural-sort", () => {
  it("orders titles 1…10…11 not 1, 10, 11, 2", () => {
    const titles = [
      "1 Physical Quantities and Units",
      "10 D.C. circuits",
      "11 Particle physics",
      "2 Kinematics",
      "3 Dynamics",
    ];
    const sorted = [...titles].sort(compareNaturalTitle);
    expect(sorted.map((t) => leadingSerialNumber(t))).toEqual([1, 2, 3, 10, 11]);
  });
});
