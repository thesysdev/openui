import { describe, expect, it } from "vitest";
import { MAX_LABEL_LINES, parseLineHeight, truncateToWidth, wrapLabelLines } from "./labelWrap";

// Deterministic stand-in for canvas text metrics: width == 10px per character.
const ctx = {
  measureText: (s: string) => ({ width: s.length * 10 }),
} as unknown as CanvasRenderingContext2D;

describe("parseLineHeight", () => {
  it("handles a unitless multiplier (12px/1.25 → 15)", () => {
    expect(parseLineHeight("400 12px/1.25 Inter")).toBe(15);
  });
  it("handles a px line-height (12px/16px → 16)", () => {
    expect(parseLineHeight("400 12px/16px Inter")).toBe(16);
  });
  it("falls back to 1.2× when no line-height is given (14px → 17)", () => {
    expect(parseLineHeight("400 14px Inter")).toBe(17);
  });
});

describe("truncateToWidth (single-line ellipsis)", () => {
  it("returns the text unchanged when it fits", () => {
    expect(truncateToWidth(ctx, "Jan", 100)).toBe("Jan");
  });
  it("trims and appends an ellipsis when it overflows", () => {
    const out = truncateToWidth(ctx, "San Francisco", 100); // 13 chars > 10
    expect(out.endsWith("…")).toBe(true);
    expect(out.length * 10).toBeLessThanOrEqual(100);
  });
  it("trims by code points, never splitting surrogate pairs (emoji)", () => {
    // '🎉🎉🎉' is 6 UTF-16 units (60px). Budget 45px forces a mid-pair cut
    // under unit-based slicing: the old code returned '🎉\uD83C…' (lone
    // surrogate). Code-point slicing must land on '🎉…' instead.
    const out = truncateToWidth(ctx, "🎉🎉🎉", 45);
    expect(out).toBe("🎉…");
    // No unpaired high surrogate anywhere in the output.
    expect(out).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
  });
});

describe("wrapLabelLines (multi-line tspans)", () => {
  it("keeps a short single word on one line", () => {
    expect(wrapLabelLines(ctx, "Jan", 100)).toEqual(["Jan"]);
  });
  it("wraps a multi-word label across lines", () => {
    expect(wrapLabelLines(ctx, "San Francisco", 100)).toEqual(["San", "Francisco"]);
  });
  it("caps at MAX_LABEL_LINES and ellipsizes the last kept line", () => {
    const out = wrapLabelLines(ctx, "aa bb cc dd ee ff", 20);
    expect(out.length).toBe(MAX_LABEL_LINES);
    expect(out[out.length - 1]!.endsWith("…")).toBe(true);
  });
  it("breaks an over-long word mid-word, every line within width", () => {
    const out = wrapLabelLines(ctx, "Supercalifragilistic", 50);
    expect(out.length).toBeGreaterThan(1);
    expect(out.every((l) => l.length * 10 <= 50)).toBe(true);
  });
});
