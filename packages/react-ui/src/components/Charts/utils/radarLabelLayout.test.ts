import { describe, expect, it } from "vitest";
import { MIN_RADAR_LABEL_BUDGET, radarLabelLayout, radarLabelPadding } from "./radarLabelLayout";

// Reference geometry: chartSize 300 → maxRadius 105 (0.35·300), lineHeight 15
// (the default '400 12px/1.25 Inter' theme font). radarLabelPadding(300, 15)
// is 16, so the label ring radius r = 121.
const GEOM = {
  chartSize: 300,
  maxRadius: 105,
  containerWidth: 800,
  lineHeight: 15,
};

describe("radarLabelPadding (adaptive vertical reserve)", () => {
  it("keeps the legacy 16px at comfortable sizes (300+)", () => {
    expect(radarLabelPadding(300, 15)).toBe(16);
    expect(radarLabelPadding(500, 15)).toBe(16);
  });
  it("shrinks at small sizes so a one-line label still fits the svg (150 → 7.5)", () => {
    // 0.15·150 − 15 = 7.5 → top label: y = −(52.5+7.5) = −60, minus one
    // lineHeight of ascent = −75 = exactly the svg edge. No spill.
    expect(radarLabelPadding(150, 15)).toBe(7.5);
  });
  it("never goes below the 6px floor", () => {
    expect(radarLabelPadding(100, 15)).toBe(6);
  });
});

describe("radarLabelLayout — N=4 cardinal axes, wide container (800px)", () => {
  // svgLeft = (800−300)/2 = 250; svg center in container coords = 250+150 = 400.
  it("top axis (i=0): middle-anchored, bottom-aligned, 1 line, near-full-width budget", () => {
    const l = radarLabelLayout(0, 4, GEOM);
    expect(l.x).toBeCloseTo(0, 6);
    expect(l.y).toBeCloseTo(-121, 6);
    expect(l.hAlign).toBe("middle");
    expect(l.vAlign).toBe("bottom");
    expect(l.maxLines).toBe(1); // |sin| ≥ 0.7 → single line (vertical safety)
    expect(l.maxWidth).toBeCloseTo(2 * (400 - 4), 6); // 2·(min(400,400) − margin)
  });
  it("right axis (i=1): start-anchored, middle-aligned, 2 lines, budget to right edge", () => {
    const l = radarLabelLayout(1, 4, GEOM);
    expect(l.x).toBeCloseTo(121, 6);
    expect(l.y).toBeCloseTo(0, 6);
    expect(l.hAlign).toBe("start");
    expect(l.vAlign).toBe("middle");
    expect(l.maxLines).toBe(2);
    expect(l.maxWidth).toBeCloseTo(800 - (400 + 121) - 4, 6); // = 275
  });
  it("bottom axis (i=2): middle/top/1-line", () => {
    const l = radarLabelLayout(2, 4, GEOM);
    expect(l.y).toBeCloseTo(121, 6);
    expect(l.vAlign).toBe("top");
    expect(l.maxLines).toBe(1);
  });
  it("left axis (i=3): end-anchored, budget to left edge", () => {
    const l = radarLabelLayout(3, 4, GEOM);
    expect(l.x).toBeCloseTo(-121, 6);
    expect(l.hAlign).toBe("end");
    expect(l.maxWidth).toBeCloseTo(400 - 121 - 4, 6); // = 275
  });
});

describe("radarLabelLayout — degenerate containers", () => {
  it("square container: side budget collapses to the svg slack, not below", () => {
    const l = radarLabelLayout(1, 4, { ...GEOM, containerWidth: 300 });
    // svgLeft = 0, anchor at 150+121 = 271 → 300 − 271 − 4 = 25
    expect(l.maxWidth).toBeCloseTo(25, 6);
  });
  it("containerWidth 0 (pre-measure frame) is clamped to chartSize", () => {
    const zero = radarLabelLayout(1, 4, { ...GEOM, containerWidth: 0 });
    const square = radarLabelLayout(1, 4, { ...GEOM, containerWidth: 300 });
    expect(zero.maxWidth).toBeCloseTo(square.maxWidth, 6);
  });
  it("budget is never negative", () => {
    const l = radarLabelLayout(1, 4, {
      chartSize: 150,
      maxRadius: 150 * 0.35,
      containerWidth: 0,
      lineHeight: 15,
    });
    expect(l.maxWidth).toBeGreaterThanOrEqual(0);
  });
});

describe("MIN_RADAR_LABEL_BUDGET", () => {
  it("is 12 (labels below this are hidden, never overflowed)", () => {
    expect(MIN_RADAR_LABEL_BUDGET).toBe(12);
  });
});
