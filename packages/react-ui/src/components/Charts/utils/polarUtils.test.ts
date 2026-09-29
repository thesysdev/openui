import { describe, expect, it } from "vitest";
import { formatPercentage, getSliceStyle } from "./polarUtils";

describe("getSliceStyle (pie/radial hover dim)", () => {
  it("returns no styles when nothing is hovered", () => {
    expect(getSliceStyle(0, null)).toEqual({});
    expect(getSliceStyle(3, null)).toEqual({});
  });

  it("highlights the hovered slice with full fill-opacity + brightness", () => {
    expect(getSliceStyle(2, 2)).toEqual({
      fillOpacity: 1,
      filter: "brightness(1.08)",
    });
  });

  it("dims non-hovered slices via fillOpacity (not opacity — see impl comment)", () => {
    expect(getSliceStyle(0, 2)).toEqual({ fillOpacity: 0.4 });
    expect(getSliceStyle(0, 2)).not.toHaveProperty("opacity");
  });
});

describe("formatPercentage (slice labels)", () => {
  it("formats value/total with one decimal place", () => {
    expect(formatPercentage(25, 100)).toBe("25.0%");
    expect(formatPercentage(100, 100)).toBe("100.0%");
  });

  it("rounds to one decimal", () => {
    expect(formatPercentage(1, 3)).toBe("33.3%");
    expect(formatPercentage(2, 3)).toBe("66.7%");
  });

  it("returns 0% (no decimal) when the total is 0 — no NaN/Infinity leak", () => {
    expect(formatPercentage(5, 0)).toBe("0%");
    expect(formatPercentage(0, 0)).toBe("0%");
  });
});
