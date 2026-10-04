import { describe, expect, it } from "vitest";
import { segmentShare, segmentValue } from "./segmentedBarGeometry";

describe("segmentValue (clamp neg / NaN / non-numeric → 0)", () => {
  it("keeps a positive number", () => {
    expect(segmentValue(42)).toBe(42);
  });
  it("parses a numeric string", () => {
    expect(segmentValue("17.5")).toBe(17.5);
  });
  it("clamps a negative to 0", () => {
    expect(segmentValue(-3)).toBe(0);
  });
  it("clamps NaN / non-numeric / undefined to 0", () => {
    expect(segmentValue(Number.NaN)).toBe(0);
    expect(segmentValue("abc")).toBe(0);
    expect(segmentValue(undefined)).toBe(0);
  });
});

describe("segmentShare (share of TOTAL, not retention)", () => {
  it("share is value / total", () => {
    expect(segmentShare(25, 100)).toBe(0.25);
  });
  it("shares over a set sum to 1", () => {
    const values = [30, 24, 7, 39];
    const total = values.reduce((a, b) => a + b, 0);
    const sum = values.reduce((acc, v) => acc + segmentShare(v, total), 0);
    expect(sum).toBeCloseTo(1, 10);
  });
  it("guards divide-by-zero (total <= 0) → 0, never NaN/Infinity", () => {
    expect(segmentShare(5, 0)).toBe(0);
    expect(segmentShare(5, -10)).toBe(0);
    expect(Number.isFinite(segmentShare(5, 0))).toBe(true);
  });
  it("clamps a negative value to a 0 share", () => {
    expect(segmentShare(-5, 100)).toBe(0);
  });
});
