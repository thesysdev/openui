import { describe, expect, it } from "vitest";
import { MIN_TICK_SPACING, resolveTickCount } from "./constants";

describe("resolveTickCount", () => {
  it("derives the count from chart height at ~1 per MIN_TICK_SPACING when no override", () => {
    // Byte-identical to the old inline formula
    // `Math.max(2, Math.floor(chartHeight / MIN_TICK_SPACING))`.
    expect(resolveTickCount(200)).toBe(Math.floor(200 / MIN_TICK_SPACING));
    expect(resolveTickCount(296)).toBe(Math.floor(296 / MIN_TICK_SPACING));
    expect(resolveTickCount(400)).toBe(10); // 400 / 40
  });

  it("floors the height-derived count at 2 for short charts", () => {
    expect(resolveTickCount(0)).toBe(2);
    expect(resolveTickCount(40)).toBe(2); // 40/40 = 1 → floored to 2
    expect(resolveTickCount(79)).toBe(2); // 79/40 = 1.97 → floor 1 → 2
    expect(resolveTickCount(80)).toBe(2); // 80/40 = 2
  });

  it("lets an explicit override win over the height-derived value", () => {
    // Same tall chart, different override → override drives the count.
    expect(resolveTickCount(400, 3)).toBe(3);
    expect(resolveTickCount(400, 10)).toBe(10);
    expect(resolveTickCount(100, 8)).toBe(8);
  });

  it("floors an override at 2", () => {
    expect(resolveTickCount(400, 0)).toBe(2);
    expect(resolveTickCount(400, 1)).toBe(2);
    expect(resolveTickCount(400, -5)).toBe(2);
  });

  it("floors a fractional override toward zero", () => {
    expect(resolveTickCount(400, 5.9)).toBe(5);
  });

  it("ignores a non-finite override and falls back to the height-derived count", () => {
    expect(resolveTickCount(400, NaN)).toBe(10);
    expect(resolveTickCount(400, Infinity)).toBe(10);
  });
});
