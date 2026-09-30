import { describe, expect, it } from "vitest";
import { wrapLabelLines } from "./labelWrap";
import { ANGLED_LABEL_ROTATION, fullLabelWidth, layoutXAxisLabels } from "./xAxisLabelLayout";

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
      slotWidth: 100,
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
    expect(out).toEqual({
      angle: 0,
      interval: 1,
      labelWidth: 70,
      maxLines: 1,
      height: 30,
      slotWidth: 70,
    });
  });

  it("reserves the wrapped line count for multiLine", () => {
    // "Extremely Long Category…" wraps to 3+ lines at 150px → capped at 3.
    const out = layout([LONG], { condensed: false, variant: "multiLine", slotWidth: 150 });
    expect(out.maxLines).toBe(3);
    expect(out.height).toBe(3 * LINE + 13);
  });
});

describe("layoutXAxisLabels — scrolling, full labels", () => {
  const scroll = (labels: string[], opts: Partial<Parameters<typeof layoutXAxisLabels>[2]> = {}) =>
    layout(labels, {
      condensed: false,
      variant: "multiLine",
      slotWidth: 72,
      visibleWidth: 1000,
      ...opts,
    });
  /** The label as the axis draws it at the layout's width and line count. */
  const drawn = (label: string, out: ReturnType<typeof layoutXAxisLabels>) =>
    wrapLabelLines(ctx, label, out.labelWidth, out.maxLines);

  it("keeps the density width when every label already fits", () => {
    const out = scroll(["Jan", "Feb", "Mar"]);
    expect(out.slotWidth).toBe(72);
    expect(out.maxLines).toBe(1);
  });

  it("widens the category until a long label wraps in full", () => {
    const out = scroll([LONG, "Jan"]);
    // The narrowest 3-line wrap is 180px ("Category Name That"), + the 8px gap.
    expect(out.slotWidth).toBe(189);
    expect(out.maxLines).toBe(3);
    expect(drawn(LONG, out)).toEqual(["Extremely Long", "Category Name That", "Needs Truncation"]);
  });

  // Wraps into 3 lines from 130px ("Response Time"), 2 lines from 160px.
  const CSRT = "Customer Support Response Time";

  it("sizes a bar chart's category so the label fits under the band", () => {
    const out = scroll([CSRT], { labelShare: 0.8 });
    expect(out.labelWidth).toBeCloseTo(out.slotWidth * 0.8);
    expect(out.labelWidth).toBeGreaterThanOrEqual(130);
    expect(drawn(CSRT, out).join(" ")).toBe(CSRT);
  });

  it("fits the lines a short band holds", () => {
    // (45 − 13 padding) / 15 → 2 lines, so the label needs a wider category.
    const out = scroll([CSRT], { maxHeight: 45 });
    expect(out.maxLines).toBe(2);
    expect(drawn(CSRT, out)).toEqual(["Customer Support", "Response Time"]);
  });

  it("fits single-line labels on one line", () => {
    const out = scroll(["Customer Support"], { variant: "singleLine" });
    expect(out.slotWidth).toBe(168);
    expect(out.maxLines).toBe(1);
  });

  it("grows a category to at most three times its usual width", () => {
    // 200px + the 8px gap fits under 3 × 72 = 216px; 220px doesn't, so it truncates.
    expect(scroll(["Twenty characters ok"], { variant: "singleLine" }).slotWidth).toBe(208);
    expect(scroll(["Twenty-two characters!"], { variant: "singleLine" }).slotWidth).toBe(72);
  });

  it("never grows a category past half the visible width", () => {
    // A 300px plot keeps at least two 150px categories in view.
    const narrow = { variant: "singleLine" as const, visibleWidth: 300 };
    expect(scroll(["Fourteen chars"], narrow).slotWidth).toBe(148);
    expect(scroll(["Sixteen chars ok"], narrow).slotWidth).toBe(72);
  });

  it("never lets the gap between labels make a chart that fits scroll", () => {
    // Four 160px labels fit a 660px plot at 165px each, just not with the 8px gap.
    const out = scroll(Array(4).fill("Sixteen chars ok"), {
      variant: "singleLine",
      visibleWidth: 660,
    });
    expect(out.slotWidth).toBe(165);
  });

  it("truncates, without widening for, a label that can't show in full", () => {
    // One 370px word would fit this 1000px plot on one line, but not a
    // category three times the usual width: it breaks mid-word and truncates.
    const WORD = "SinglePointDataSetForTestingEdgeCases";
    const out = scroll([WORD, "Jan"]);
    expect(out.slotWidth).toBe(72);
    expect(drawn(WORD, out).at(-1)).toMatch(/…$/);
  });

  it("leaves the condensed layout's categories alone", () => {
    expect(layout([LONG], { slotWidth: 60, visibleWidth: 1000 }).slotWidth).toBe(60);
  });
});

describe("fullLabelWidth", () => {
  it("is the one-line width when only one line is allowed", () => {
    expect(fullLabelWidth(ctx, LONG, 1)).toBe(500);
  });

  it("is the narrowest width that wraps the label into the allowed lines", () => {
    expect(fullLabelWidth(ctx, LONG, 3)).toBeCloseTo(180, 0);
    expect(fullLabelWidth(ctx, LONG, 2)).toBeCloseTo(260, 0);
  });

  it("never breaks a word", () => {
    expect(fullLabelWidth(ctx, "Revenue", 3)).toBe(70);
    expect(fullLabelWidth(ctx, "Q1 Revenue", 3)).toBe(70);
  });
});
