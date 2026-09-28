import { scaleLinear } from "d3-scale";
import { describe, expect, it } from "vitest";
import { measureYAxisWidth, numberTickFormatter } from "./styleUtils";

// Deterministic stand-in for canvas text metrics: width == 10px per character.
// (Real CanvasRenderingContext2D isn't available under vitest's node env; the
// logic under test is "which strings get measured", not the exact font metrics.)
const mockContext = {
  measureText: (s: string) => ({ width: s.length * 10 }),
} as unknown as CanvasRenderingContext2D;

const PADDING = 10;
const MIN = 20;

describe("numberTickFormatter", () => {
  it("renders plain integers as-is", () => {
    expect(numberTickFormatter(0)).toBe("0");
    expect(numberTickFormatter(950)).toBe("950");
  });

  it("abbreviates K/M/B/T with one decimal until 10×, then none", () => {
    expect(numberTickFormatter(1000)).toBe("1.0K");
    expect(numberTickFormatter(9500)).toBe("9.5K");
    expect(numberTickFormatter(12000)).toBe("12K");
    expect(numberTickFormatter(1_000_000)).toBe("1.0M");
    expect(numberTickFormatter(2_500_000_000)).toBe("2.5B");
  });

  it("shows two decimals for fractional values", () => {
    expect(numberTickFormatter(47.38)).toBe("47.38");
  });
});

describe("measureYAxisWidth sizes against the rendered ticks (F4)", () => {
  it("reserves width for the .nice() top tick, not the raw data max", () => {
    // data max 950 → .nice() domain [0, 1000] → top tick 1000 → "1.0K" (4 chars).
    // The OLD hook measured the raw "950" (3 chars) and the real "1.0K" clipped.
    const ticks = scaleLinear().domain([0, 950]).nice().ticks();
    expect(ticks).toContain(1000);
    // widest tick "1.0K" = 4 chars × 10 + 10 padding = 50
    expect(measureYAxisWidth(ticks, mockContext)).toBe(4 * 10 + PADDING);
    // proof of the bug it fixes: measuring the raw value would under-reserve.
    expect(mockContext.measureText("950").width).toBeLessThan(
      mockContext.measureText("1.0K").width,
    );
  });

  it("does not over-reserve for fractional data the axis never shows", () => {
    // raw max 47.38 ("47.38", 5 chars) but ticks are 0..50 (≤ 2 chars).
    const ticks = scaleLinear().domain([0, 47.38]).nice().ticks();
    const widest = Math.max(...ticks.map((t) => numberTickFormatter(t).length));
    expect(widest).toBeLessThanOrEqual(2);
    expect(measureYAxisWidth(ticks, mockContext)).toBe(2 * 10 + PADDING);
  });

  it("takes the widest tick (often the top-of-domain abbreviation), not min/max position", () => {
    // [0 .. 9500] → top "9.5K" (4) is wider than any 3-digit interior tick.
    const ticks = scaleLinear().domain([0, 9500]).nice().ticks();
    const widthByFormatter = Math.max(...ticks.map((t) => numberTickFormatter(t).length));
    expect(measureYAxisWidth(ticks, mockContext)).toBe(widthByFormatter * 10 + PADDING);
  });

  it("clamps to min and max", () => {
    expect(measureYAxisWidth([5], mockContext)).toBe(MIN); // 1×10+10=20 → min
    expect(measureYAxisWidth([], mockContext)).toBe(MIN); // no ticks → min
    expect(measureYAxisWidth([1000], mockContext, { maxWidth: 25 })).toBe(25);
  });
});
