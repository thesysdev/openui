import { describe, expect, it } from "vitest";
import { ANGLED_LABEL_ROTATION, layoutXAxisLabels } from "./xAxisLabelLayout";

// Deterministic stand-in for canvas text metrics: width == 10px per character.
const ctx = {
  measureText: (s: string) => ({ width: s.length * 10 }),
} as unknown as CanvasRenderingContext2D;

const LINE = 15;
const LONG = "Extremely Long Category Name That Needs Truncation"; // 500px
const layout = (labels: string[], opts: Partial<Parameters<typeof layoutXAxisLabels>[2]> = {}) =>
  layoutXAxisLabels(ctx, labels, {
    variant: "singleLine",
    slotWidth: 100,
    maxHeight: 120,
    lineHeight: LINE,
    condensed: true,
    ...opts,
  });

describe("layoutXAxisLabels — condensed", () => {
  it("draws short labels horizontally, one per category", () => {
    expect(layout(["Jan", "Feb", "Mar"])).toEqual({
      angle: 0,
      interval: 1,
      labelWidth: 92,
      maxLines: 1,
      height: 30,
    });
  });

  it("keeps a single-line band for long labels; the renderer truncates them", () => {
    const out = layout([LONG, LONG], { slotWidth: 60 });
    expect(out.height).toBe(30);
    expect(out.labelWidth).toBe(52);
    expect(out.angle).toBe(0);
  });

  it("draws every n-th label when categories are too narrow to read", () => {
    // min(60, 40) + 8 gap = 48px needed per label → every 4th 12px category.
    const out = layout(Array(24).fill("Jan 23"), { slotWidth: 12 });
    expect(out.interval).toBe(4);
    expect(out.labelWidth).toBe(40);
  });

  it("wraps multiLine labels, with no more lines than the band cap allows", () => {
    expect(layout([LONG], { variant: "multiLine", slotWidth: 200 }).maxLines).toBe(3);
    // (45 − 13 padding) / 15 → 2 lines.
    const capped = layout([LONG], { variant: "multiLine", slotWidth: 200, maxHeight: 45 });
    expect(capped.maxLines).toBe(2);
    expect(capped.height).toBeLessThanOrEqual(45);
  });

  it("reserves only the lines the wrapped labels need", () => {
    const out = layout(["Jan", "Feb"], { variant: "multiLine" });
    expect(out.maxLines).toBe(1);
    expect(out.height).toBe(30);
  });

  it("keeps angled labels horizontal when they fit", () => {
    expect(layout(["Jan", "Feb"], { variant: "angled" }).angle).toBe(0);
  });

  it("rotates angled labels 45° and caps the band, truncating what doesn't fit", () => {
    const out = layout([LONG, LONG], { variant: "angled", slotWidth: 50, maxHeight: 100 });
    expect(out.angle).toBe(ANGLED_LABEL_ROTATION);
    expect(out.height).toBe(100);
    // (100 − 4 gap) / sin 45° − 15 line height
    expect(out.labelWidth).toBeCloseTo(96 / Math.SQRT1_2 - LINE);
    expect(out.labelWidth).toBeLessThan(500);
  });

  it("sizes the angled band to the labels when they fit under the cap", () => {
    const out = layout(["Quarter One", "Quarter Two"], { variant: "angled", slotWidth: 50 });
    expect(out.height).toBeLessThan(120);
    expect(out.labelWidth).toBeGreaterThanOrEqual(110);
  });

  it("thins rotated labels closer than a line-height apart", () => {
    // 15 / sin 45° ≈ 21.2px apart needed → every 3rd 8px category.
    expect(layout(Array(30).fill(LONG), { variant: "angled", slotWidth: 8 }).interval).toBe(3);
  });

  it("never lets the band exceed the cap, beyond one line in tiny charts", () => {
    for (const variant of ["singleLine", "multiLine", "angled"] as const) {
      expect(layout([LONG], { variant, slotWidth: 30, maxHeight: 60 }).height).toBeLessThanOrEqual(
        60,
      );
      expect(layout([LONG], { variant, slotWidth: 30, maxHeight: 10 }).height).toBe(30);
    }
  });
});

describe("layoutXAxisLabels — scrolling", () => {
  it("draws every label at its category width, never rotated", () => {
    const out = layout([LONG], { condensed: false, variant: "angled", slotWidth: 70 });
    expect(out).toEqual({ angle: 0, interval: 1, labelWidth: 70, maxLines: 1, height: 30 });
  });

  it("reserves the wrapped line count for multiLine", () => {
    // "Extremely Long Category…" wraps to 3+ lines at 150px → capped at 3.
    const out = layout([LONG], { condensed: false, variant: "multiLine", slotWidth: 150 });
    expect(out.maxLines).toBe(3);
    expect(out.height).toBe(3 * LINE + 13);
  });
});
