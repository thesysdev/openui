import { stack, stackOffsetNone, stackOrderNone } from "d3-shape";
import { describe, expect, it } from "vitest";
import { stackOffsetDivergingZeroPreserving } from "../hooks/cartesian/useStackedData";
import { computeYDomain } from "./yDomain";

const mixed = [
  { m: "Jan", a: 40, b: -25, c: 10 },
  { m: "Feb", a: -10, b: 60, c: -5 },
  { m: "Mar", a: 0, b: 15, c: 20 },
];
const keys = ["a", "b", "c"];

describe("computeYDomain (the shared scale/axis-width domain)", () => {
  it("all-non-negative data keeps the historical [0, max] domain", () => {
    const data = [
      { m: "Jan", a: 40, b: 100 },
      { m: "Feb", a: 70, b: 30 },
    ];
    expect(computeYDomain(data, ["a", "b"], false)).toEqual([0, 100]);
    // stacked: max row sum = 140
    expect(computeYDomain(data, ["a", "b"], true)).toEqual([0, 140]);
  });

  it("mixed-sign data spans the extent, always anchored through zero", () => {
    expect(computeYDomain(mixed, keys, false)).toEqual([-25, 60]);
  });

  it("all-negative data yields [min, 0]", () => {
    const data = [
      { m: "Jan", a: -40 },
      { m: "Feb", a: -5 },
    ];
    expect(computeYDomain(data, ["a"], false)).toEqual([-40, 0]);
  });

  it("stacked mixed-sign data = [lowest negative sum, highest positive sum]", () => {
    // Jan: pos 40+10=50, neg -25 · Feb: pos 60, neg -15 · Mar: pos 35, neg 0
    expect(computeYDomain(mixed, keys, true)).toEqual([-25, 60]);
  });

  it("matches the extent of the stack useStackedData actually renders", () => {
    const series = stack<Record<string, string | number>>()
      .keys(keys)
      .order(stackOrderNone)
      .offset(stackOffsetDivergingZeroPreserving)(mixed as Iterable<{ [key: string]: number }>);
    let min = 0;
    let max = 0;
    for (const s of series) {
      for (const point of s) {
        min = Math.min(min, point[0], point[1]);
        max = Math.max(max, point[0], point[1]);
      }
    }
    expect(computeYDomain(mixed, keys, true)).toEqual([min, max]);
  });

  it('stacked "none" spans every running total — a negative lowers the stack', () => {
    // Jan: 40, 15, 25 · Feb: -10, 50, 45 · Mar: 0, 15, 35
    expect(computeYDomain(mixed, keys, true, "none")).toEqual([-10, 50]);
  });

  it('"none" matches the extent of the stackOffsetNone stack areas render', () => {
    const series = stack<Record<string, string | number>>()
      .keys(keys)
      .order(stackOrderNone)
      .offset(stackOffsetNone)(mixed as Iterable<{ [key: string]: number }>);
    let min = 0;
    let max = 0;
    for (const s of series) {
      for (const point of s) {
        min = Math.min(min, point[0], point[1]);
        max = Math.max(max, point[0], point[1]);
      }
    }
    expect(computeYDomain(mixed, keys, true, "none")).toEqual([min, max]);
  });

  it('"none" and "sign" agree on all-non-negative data', () => {
    const data = [
      { m: "Jan", a: 40, b: 100 },
      { m: "Feb", a: 70, b: 30 },
    ];
    expect(computeYDomain(data, ["a", "b"], true, "none")).toEqual(
      computeYDomain(data, ["a", "b"], true, "sign"),
    );
  });

  it("handles empty data and non-numeric cells", () => {
    expect(computeYDomain([], keys, false)).toEqual([0, 0]);
    expect(computeYDomain([{ m: "Jan", a: "oops" }], ["a"], false)).toEqual([0, 0]);
  });
});

describe("stackOffsetDivergingZeroPreserving (the rendered stack offset)", () => {
  const runStack = (
    data: Array<Record<string, string | number>>,
    offsetFn: typeof stackOffsetDivergingZeroPreserving,
    stackKeys: string[],
  ) =>
    stack<Record<string, string | number>>()
      .keys(stackKeys)
      .order(stackOrderNone)
      .offset(offsetFn)(data as Iterable<{ [key: string]: number }>)
      .map((series) => series.map((p) => [p[0], p[1]]));

  it("is IDENTICAL to stackOffsetNone for all-non-negative data — zeros included", () => {
    // The pixel-identity guarantee. d3's own stackOffsetDiverging fails this:
    // its zero branch re-bases [cum, cum] segments to [0, 0], dropping a
    // stacked area band/line to the baseline wherever a value is exactly 0.
    const data = [
      { m: "Jan", a: 10, b: 0, c: 5 },
      { m: "Feb", a: 0, b: 0, c: 0 },
      { m: "Mar", a: 3.5, b: 7, c: 0 },
    ];
    const ks = ["a", "b", "c"];
    expect(runStack(data, stackOffsetDivergingZeroPreserving, ks)).toEqual(
      runStack(data, stackOffsetNone, ks),
    );
  });

  it("diverges mixed signs: positives stack up from zero, negatives down", () => {
    const data = [{ m: "Jan", a: 10, b: -5, c: 20, d: -15 }];
    const [a, b, c, d] = runStack(data, stackOffsetDivergingZeroPreserving, ["a", "b", "c", "d"]);
    expect(a![0]).toEqual([0, 10]); // positive, from zero up
    expect(b![0]).toEqual([-5, 0]); // negative, from zero down
    expect(c![0]).toEqual([10, 30]); // stacks on the positive total
    expect(d![0]).toEqual([-20, -5]); // stacks on the negative total
  });

  it("zeros in mixed rows ride the positive running total", () => {
    const data = [{ m: "Jan", a: 10, b: 0, c: -5 }];
    const [, b] = runStack(data, stackOffsetDivergingZeroPreserving, ["a", "b", "c"]);
    expect(b![0]).toEqual([10, 10]);
  });
});
