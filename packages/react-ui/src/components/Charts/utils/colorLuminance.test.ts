import { describe, expect, it } from "vitest";
import { LUMINANCE_TEXT_PIVOT, relativeLuminanceFromRgb } from "./colorLuminance";

describe("relativeLuminanceFromRgb (WCAG)", () => {
  it("anchors: black is 0, white is 1", () => {
    expect(relativeLuminanceFromRgb(0, 0, 0)).toBe(0);
    expect(relativeLuminanceFromRgb(255, 255, 255)).toBeCloseTo(1, 10);
  });

  it("matches the published value for sRGB primaries", () => {
    expect(relativeLuminanceFromRgb(255, 0, 0)).toBeCloseTo(0.2126, 4);
    expect(relativeLuminanceFromRgb(0, 255, 0)).toBeCloseTo(0.7152, 4);
    expect(relativeLuminanceFromRgb(0, 0, 255)).toBeCloseTo(0.0722, 4);
  });

  it("the text pivot splits the ramp the way contrast math says", () => {
    // Dark navy (ocean ramp low end) → below pivot → light text wins.
    expect(relativeLuminanceFromRgb(0x0d, 0x47, 0xa1)).toBeLessThan(LUMINANCE_TEXT_PIVOT);
    // Pale blue (ocean ramp high end) → above pivot → dark text wins.
    expect(relativeLuminanceFromRgb(0xef, 0xf8, 0xff)).toBeGreaterThan(LUMINANCE_TEXT_PIVOT);
  });
});
