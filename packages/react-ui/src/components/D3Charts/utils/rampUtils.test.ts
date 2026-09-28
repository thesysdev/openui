import { describe, expect, it } from "vitest";

import { sampleRampStops } from "./rampUtils";

const ELEVEN = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"];

describe("sampleRampStops", () => {
  it("samples 5 endpoint-inclusive stops from an 11-color ramp", () => {
    // positions 0, 2.5→3, 5, 7.5→8, 10 (Math.round rounds .5 up)
    expect(sampleRampStops(ELEVEN, 5)).toEqual(["a", "d", "f", "i", "k"]);
  });

  it("always keeps both endpoints", () => {
    const out = sampleRampStops(ELEVEN, 4);
    expect(out[0]).toBe("a");
    expect(out[out.length - 1]).toBe("k");
    expect(out).toHaveLength(4);
  });

  it("repeats a single-color ramp to fill the count", () => {
    expect(sampleRampStops(["x"], 5)).toEqual(["x", "x", "x", "x", "x"]);
  });

  it("returns the first color for count 1", () => {
    expect(sampleRampStops(ELEVEN, 1)).toEqual(["a"]);
  });

  it("returns [] for an empty ramp or non-positive count", () => {
    expect(sampleRampStops([], 5)).toEqual([]);
    expect(sampleRampStops(ELEVEN, 0)).toEqual([]);
    expect(sampleRampStops(ELEVEN, -3)).toEqual([]);
  });

  it("passes a shorter ramp through when count equals its length", () => {
    expect(sampleRampStops(["a", "b", "c"], 3)).toEqual(["a", "b", "c"]);
  });

  it("never returns undefined across ramp-size × count combinations", () => {
    for (let n = 1; n <= 12; n++) {
      const colors = Array.from({ length: n }, (_, i) => `#c${i}`);
      for (let count = 1; count <= 8; count++) {
        const out = sampleRampStops(colors, count);
        expect(out).toHaveLength(count);
        expect(out.every((c) => colors.includes(c))).toBe(true);
      }
    }
  });
});
