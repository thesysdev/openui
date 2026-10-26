import { describe, expect, it } from "vitest";
import {
  columnPath,
  columnSpans,
  columnTotals,
  outerSegments,
  packColumns,
  SEGMENT_GAP,
} from "./columnGeometry";

describe("columnSpans", () => {
  it("stands grouped columns on zero, below it when negative", () => {
    expect(columnSpans([[3, -2]], false)).toEqual([
      [
        { from: 0, to: 3 },
        { from: -2, to: 0 },
      ],
    ]);
  });

  it("stacks positives up and negatives down from zero, in series order", () => {
    const [a, b, c] = columnSpans([[5], [-4], [2]], true);
    expect(a![0]).toEqual({ from: 0, to: 5 });
    expect(b![0]).toEqual({ from: -4, to: 0 });
    expect(c![0]).toEqual({ from: 5, to: 7 });
  });

  it("treats missing and non-finite values as zero", () => {
    expect(columnSpans([[Number.NaN, 2], [1]], true)[1]).toEqual([
      { from: 0, to: 1 },
      { from: 2, to: 2 },
    ]);
  });
});

describe("columnTotals / outerSegments", () => {
  it("sums each column's net", () => {
    expect(
      columnTotals([
        [5, 1],
        [-4, 2],
      ]),
    ).toEqual([1, 3]);
  });

  it("finds the last positive and the last negative series per column", () => {
    const { top, bottom } = outerSegments([
      [5, 0],
      [-4, 0],
      [2, -1],
    ]);
    expect([...top]).toEqual([2, -1]);
    expect([...bottom]).toEqual([1, 2]);
  });
});

describe("packColumns", () => {
  // Pixel space: 10px per unit, zero at y = 100.
  const y = (v: number) => 100 - v * 10;

  it("packs a top and bottom per series per column", () => {
    expect([...packColumns(columnSpans([[2, 3]], false), y, false)]).toEqual([80, 100, 70, 100]);
  });

  it("insets stacked segments where they meet, never at zero or the outer end", () => {
    const flat = packColumns(columnSpans([[2], [3], [-1]], true), y, true);
    // First segment: on zero, meets the second at its top.
    expect([flat[0], flat[1]]).toEqual([80 + SEGMENT_GAP, 100]);
    // Second: meets the first at its bottom, ends the stack at its top.
    expect([flat[2], flat[3]]).toEqual([50, 80 - SEGMENT_GAP]);
    // Negative: hangs from zero and ends the stack below.
    expect([flat[4], flat[5]]).toEqual([100, 110]);
  });

  it("collapses a segment too short for its gaps instead of inverting it", () => {
    const flat = packColumns(columnSpans([[1], [0.1], [1]], true), y, true);
    expect(flat[3]! - flat[2]!).toBeGreaterThanOrEqual(0);
  });
});

describe("columnPath", () => {
  it("rounds only the outer end", () => {
    expect(columnPath(0, 10, 0, 20, "top", 4)).toBe("M0,20V4Q0,0 4,0H6Q10,0 10,4V20Z");
    expect(columnPath(0, 10, 0, 20, "bottom", 4)).toBe("M0,0H10V16Q10,20 6,20H4Q0,20 0,16Z");
    expect(columnPath(0, 10, 0, 20, "none", 4)).toBe("M0,0H10V20H0Z");
  });

  it("shrinks the radius to fit a short column", () => {
    expect(columnPath(0, 10, 18, 20, "top", 4)).toBe("M0,20V20Q0,18 2,18H8Q10,18 10,20V20Z");
  });
});
