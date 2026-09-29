import { scaleBand, scalePoint } from "d3-scale";
import { describe, expect, it } from "vitest";
import { findBandIndex, findNearestDataIndex } from "./mouseUtils";

describe("findNearestDataIndex (point-scale hover → data index)", () => {
  // domain of 4 over [0, 300] → points at x = 0, 100, 200, 300
  const xScale = scalePoint<string>().domain(["a", "b", "c", "d"]).range([0, 300]);

  it("picks the point with the smallest |mouseX − pointX|", () => {
    expect(findNearestDataIndex(xScale, 0)).toBe(0);
    expect(findNearestDataIndex(xScale, 149)).toBe(1);
    expect(findNearestDataIndex(xScale, 151)).toBe(2);
    expect(findNearestDataIndex(xScale, 300)).toBe(3);
  });

  it("breaks exact ties toward the lower index (strict < keeps the first hit)", () => {
    // x = 50 is exactly halfway between points 0 (x=0) and 1 (x=100)
    expect(findNearestDataIndex(xScale, 50)).toBe(0);
    expect(findNearestDataIndex(xScale, 250)).toBe(2);
  });

  it("clamps to the nearest end when the mouse is outside the range", () => {
    expect(findNearestDataIndex(xScale, -500)).toBe(0);
    expect(findNearestDataIndex(xScale, 9999)).toBe(3);
  });

  it("returns 0 for an empty domain", () => {
    const empty = scalePoint<string>().domain([]).range([0, 300]);
    expect(findNearestDataIndex(empty, 150)).toBe(0);
  });
});

describe("findBandIndex (band-scale hover → band index)", () => {
  // n=4, paddingInner=0, paddingOuter=0.5 over [0, 500]:
  // step = 500 / (4 + 2·0.5) = 100, outer gutter = 0.5·step = 50px,
  // so bands occupy [50,150) [150,250) [250,350) [350,450).
  const xScale = scaleBand<string>().domain(["a", "b", "c", "d"]).range([0, 500]).paddingOuter(0.5);

  it("subtracts the paddingOuter offset before dividing by step", () => {
    // Without the offset, floor(120 / 100) = 1 — the offset math is load-bearing.
    expect(findBandIndex(xScale, 120)).toBe(0);
    expect(findBandIndex(xScale, 50)).toBe(0);
    expect(findBandIndex(xScale, 150)).toBe(1);
    expect(findBandIndex(xScale, 349)).toBe(2);
    expect(findBandIndex(xScale, 350)).toBe(3);
  });

  it("clamps to [0, n-1] in the outer gutters and beyond the range", () => {
    expect(findBandIndex(xScale, 0)).toBe(0); // left gutter
    expect(findBandIndex(xScale, -999)).toBe(0);
    expect(findBandIndex(xScale, 460)).toBe(3); // right gutter
    expect(findBandIndex(xScale, 9999)).toBe(3);
  });

  it("guards step === 0 (degenerate zero-width range) by returning 0", () => {
    const degenerate = scaleBand<string>().domain(["a", "b"]).range([0, 0]);
    expect(degenerate.step()).toBe(0);
    expect(findBandIndex(degenerate, 123)).toBe(0);
  });
});
