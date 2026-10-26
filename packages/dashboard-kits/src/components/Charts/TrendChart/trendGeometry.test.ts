import { curveLinear } from "d3-shape";
import { describe, expect, it } from "vitest";
import {
  differencePaths,
  packTrend,
  placeEventLabels,
  spreadLabels,
  unpackTrend,
} from "./trendGeometry";

describe("packTrend / unpackTrend", () => {
  it("round-trips x positions, every series, and the guides", () => {
    const xs = [0, 10, 20];
    const ys = [
      [5, 6, 7],
      [8, 9, 10],
    ];
    const { xs: outX, ys: outY, guides } = unpackTrend(packTrend(xs, ys, [1, 2, 3]), 3, 2);
    expect([...outX]).toEqual(xs);
    expect(outY.map((s) => [...s])).toEqual(ys);
    expect([...guides]).toEqual([1, 2, 3]);
  });

  it("gives every series exactly one slot per point: cut when longer, NaN-padded when shorter", () => {
    const xs = [0, 10, 20];
    const flat = packTrend(xs, [[5, 6, 7, 8, 9], [1]], [1, 2, 3]);
    expect(flat.length).toBe(3 * 3 + 3);
    const { ys, guides } = unpackTrend(flat, 3, 2);
    expect([...ys[0]!]).toEqual([5, 6, 7]);
    expect([...ys[1]!]).toEqual([1, Number.NaN, Number.NaN]);
    expect([...guides]).toEqual([1, 2, 3]);
  });
});

describe("differencePaths", () => {
  // Pixel space: a smaller y is higher on screen, so a larger value.
  const d = differencePaths([0, 10], [10, 30], [30, 10], 0, 100, curveLinear);

  it("draws one band between the two curves", () => {
    expect(d.band).toBe("M0,10L10,30L10,10L0,30Z");
  });

  it("clips to the regions above and below the comparison curve", () => {
    expect(d.aboveComparison).toBe("M0,30L10,10L10,0L0,0Z");
    expect(d.belowComparison).toBe("M0,30L10,10L10,100L0,100Z");
  });
});

describe("spreadLabels", () => {
  it("pushes overlapping labels apart by the gap", () => {
    const out = spreadLabels(
      [
        { key: "a", y: 50 },
        { key: "b", y: 52 },
      ],
      0,
      200,
    );
    expect(out.get("b")! - out.get("a")!).toBe(15);
  });

  it("shifts the stack up when it runs past the bottom", () => {
    const out = spreadLabels(
      [
        { key: "a", y: 195 },
        { key: "b", y: 198 },
      ],
      0,
      200,
    );
    expect(out.get("b")).toBeLessThanOrEqual(200);
  });
});

describe("placeEventLabels", () => {
  it("keeps labels that fit on their row, steps a clash down, and drops what runs off the edge", () => {
    const rows = placeEventLabels(
      [
        { x: 10, text: "Fall sale", minRow: 0 },
        { x: 30, text: "Cookie banner update", minRow: 0 },
        { x: 380, text: "Wool Beanie sold out", minRow: 0 },
      ],
      0,
      400,
    );
    expect(rows).toEqual([0, 1, undefined]);
  });

  it("right-aligns a label near the edge so it fits", () => {
    expect(placeEventLabels([{ x: 390, text: "Restated", minRow: 1, end: true }], 0, 400)).toEqual([
      1,
    ]);
  });
});
