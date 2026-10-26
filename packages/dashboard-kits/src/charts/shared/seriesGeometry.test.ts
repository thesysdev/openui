import { scaleBand, scalePoint } from "d3-scale";
import { describe, expect, it } from "vitest";
import { findBandIndex, findNearestDataIndex } from "../utils/mouseUtils";
import { areaD, lineD, packGeometry, seriesCurve, unpackGeometry } from "./seriesGeometry";

describe("seriesGeometry", () => {
  const xs = [0, 10, 20, 30];
  const ys = [40, 10, 30, 20];

  it("round-trips the morph layout", () => {
    const flat = packGeometry(xs, [ys, [1, 2, 3, 4]]);
    const { xs: x, ys: y } = unpackGeometry(flat, 4);
    expect([...x]).toEqual(xs);
    expect([...y[0]!]).toEqual(ys);
    expect([...y[1]!]).toEqual([1, 2, 3, 4]);
  });

  it("draws the natural variant as a monotone curve through every point", () => {
    const d = lineD(xs, ys, seriesCurve("natural"));
    expect(d.startsWith("M0,40")).toBe(true);
    expect(d).toContain("C"); // cubic segments, not straight ones
    expect(d.endsWith("30,20")).toBe(true);
  });

  it("draws the linear variant as straight segments", () => {
    expect(lineD(xs, ys, seriesCurve("linear"))).toBe("M0,40L10,10L20,30L30,20");
  });

  it("draws only the requested span", () => {
    expect(lineD(xs, ys, seriesCurve("linear"), 2, 3)).toBe("M20,30L30,20");
  });

  it("breaks the line at missing values", () => {
    const d = lineD(xs, [40, Number.NaN, 30, 20], seriesCurve("linear"));
    // d3 marks an isolated point as a closed zero-length subpath.
    expect(d).toBe("M0,40ZM20,30L30,20");
  });

  it("closes an area down to a baseline or a second series", () => {
    expect(areaD([0, 10], 50, [40, 10], seriesCurve("linear"))).toBe("M0,40L10,10L10,50L0,50Z");
    expect(areaD([0, 10], [45, 45], [40, 10], seriesCurve("linear"))).toBe(
      "M0,40L10,10L10,45L0,45Z",
    );
  });

  it("finds the nearest point and the band under the pointer", () => {
    const points = scalePoint<number>().domain([0, 1, 2, 3]).range([0, 30]);
    expect(findNearestDataIndex(points, 14)).toBe(1);
    expect(findNearestDataIndex(points, 99)).toBe(3);
    const bands = scaleBand<number>().domain([0, 1, 2]).range([10, 40]);
    expect(findBandIndex(bands, 12)).toBe(0);
    expect(findBandIndex(bands, 39)).toBe(2);
    expect(findBandIndex(bands, -5)).toBe(0);
  });
});
