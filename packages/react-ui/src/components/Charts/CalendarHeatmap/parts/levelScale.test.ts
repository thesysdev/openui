import { describe, expect, it } from "vitest";
import { contributionLevel } from "./levelScale";

describe("contributionLevel", () => {
  // Brief: 0→0, 1→1, 2→2, 3→3, 4→4, 99→4 (default thresholds [1,2,3,4]).
  it("maps default thresholds to GitHub levels 0..4", () => {
    expect(contributionLevel(0)).toBe(0);
    expect(contributionLevel(1)).toBe(1);
    expect(contributionLevel(2)).toBe(2);
    expect(contributionLevel(3)).toBe(3);
    expect(contributionLevel(4)).toBe(4);
    expect(contributionLevel(99)).toBe(4);
  });

  it("treats negatives and fractions below the first threshold as level 0", () => {
    expect(contributionLevel(-5)).toBe(0);
    expect(contributionLevel(0.5)).toBe(0);
  });

  // Brief: custom thresholds [10,20,30,40]: 15→1, 40→4.
  it("honors custom thresholds", () => {
    const thresholds = [10, 20, 30, 40] as const;
    expect(contributionLevel(15, thresholds)).toBe(1);
    expect(contributionLevel(40, thresholds)).toBe(4);
    expect(contributionLevel(9, thresholds)).toBe(0);
    expect(contributionLevel(29, thresholds)).toBe(2);
    expect(contributionLevel(30, thresholds)).toBe(3);
    expect(contributionLevel(1000, thresholds)).toBe(4);
  });
});
