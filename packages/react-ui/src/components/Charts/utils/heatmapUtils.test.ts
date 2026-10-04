import { scaleQuantize } from "d3-scale";
import { describe, expect, it } from "vitest";
import { buildColumnKeys, computeHeatmapColorDomain, computeLabelInterval } from "./heatmapUtils";

describe("computeHeatmapColorDomain", () => {
  it("sequential: passes the extent through", () => {
    expect(computeHeatmapColorDomain(3, 91, "sequential")).toEqual([3, 91]);
    expect(computeHeatmapColorDomain(-50, 100, "sequential")).toEqual([-50, 100]);
  });

  it("sequential: widens a collapsed extent so quantize can bucket it", () => {
    expect(computeHeatmapColorDomain(7, 7, "sequential")).toEqual([7, 8]);
    expect(computeHeatmapColorDomain(0, 0, "sequential")).toEqual([0, 1]);
  });

  it("diverging: symmetric about zero regardless of asymmetry", () => {
    expect(computeHeatmapColorDomain(-50, 100, "diverging")).toEqual([-100, 100]);
    expect(computeHeatmapColorDomain(-80, 20, "diverging")).toEqual([-80, 80]);
    // one-signed data still pivots at zero — that is the contract
    expect(computeHeatmapColorDomain(10, 90, "diverging")).toEqual([-90, 90]);
  });

  it("diverging: all-zero data widens to ±1", () => {
    expect(computeHeatmapColorDomain(0, 0, "diverging")).toEqual([-1, 1]);
  });

  it("diverging: negative-only data still pivots at zero", () => {
    expect(computeHeatmapColorDomain(-90, -10, "diverging")).toEqual([-90, 90]);
  });

  it("diverging: zero maps to the middle bucket of an odd ramp", () => {
    const [lo, hi] = computeHeatmapColorDomain(-50, 100, "diverging");
    const ramp = ["a", "b", "c", "d", "e"]; // odd length: one middle bucket
    const scale = scaleQuantize<string>().domain([lo, hi]).range(ramp);
    expect(scale(0)).toBe("c");
    // and the middle bucket straddles zero exactly
    const [bucketLo, bucketHi] = scale.invertExtent("c");
    expect(bucketLo).toBeLessThan(0);
    expect(bucketHi).toBeGreaterThan(0);
    expect(bucketLo).toBeCloseTo(-bucketHi);
  });
});

describe("computeLabelInterval", () => {
  it("wide bands show every label", () => {
    expect(computeLabelInterval(80, 28)).toBe(1);
    expect(computeLabelInterval(28, 28)).toBe(1);
  });

  it("thin bands skip labels so each shown one gets the minimum width", () => {
    expect(computeLabelInterval(14, 28)).toBe(2);
    expect(computeLabelInterval(7, 28)).toBe(4);
    expect(computeLabelInterval(1, 28)).toBe(28);
  });

  it('degenerate bandwidth degrades to "every label"', () => {
    expect(computeLabelInterval(0, 28)).toBe(1);
    expect(computeLabelInterval(-5, 28)).toBe(1);
    expect(computeLabelInterval(Number.NaN, 28)).toBe(1);
  });
});

describe("buildColumnKeys", () => {
  it("unique labels pass through untouched", () => {
    expect(buildColumnKeys(["Jan", "Feb", "Mar"])).toEqual(["Jan", "Feb", "Mar"]);
  });

  it("duplicates get occurrence suffixes; first occurrence stays bare", () => {
    const keys = buildColumnKeys(["Jan", "Feb", "Jan", "Jan"]);
    expect(keys[0]).toBe("Jan");
    expect(keys[1]).toBe("Feb");
    expect(new Set(keys).size).toBe(4);
  });

  it("suffixed keys cannot collide with real labels", () => {
    // The trap: a " 1"-style suffix would make ['Jan','Jan','Jan 1'] collide.
    const keys = buildColumnKeys(["Jan", "Jan", "Jan 1"]);
    expect(new Set(keys).size).toBe(3);
  });

  it("streaming append never re-keys existing columns", () => {
    const before = buildColumnKeys(["Jan", "Feb", "Jan"]);
    const after = buildColumnKeys(["Jan", "Feb", "Jan", "Mar"]);
    expect(after.slice(0, 3)).toEqual(before);
  });

  it("numeric-looking labels (already stringified upstream) dedupe too", () => {
    const keys = buildColumnKeys(["1", "2", "1", "10"]);
    expect(new Set(keys).size).toBe(4);
    expect(keys[0]).toBe("1");
  });
});
