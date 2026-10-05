import { describe, expect, it } from "vitest";
import { formatStackedValue, resolveStackedLegendLayout } from "./stackedLegendLayout";

describe("resolveStackedLegendLayout", () => {
  it("forces showMore / scrollable explicitly", () => {
    expect(resolveStackedLegendLayout("showMore", 1000, 2)).toEqual({
      isShowMore: true,
      isScrollable: false,
    });
    expect(resolveStackedLegendLayout("scrollable", 100, 50)).toEqual({
      isShowMore: false,
      isScrollable: true,
    });
  });
  it("auto → showMore when narrow or many items", () => {
    expect(resolveStackedLegendLayout("auto", 300, 2).isShowMore).toBe(true); // narrow
    expect(resolveStackedLegendLayout("auto", 1000, 10).isShowMore).toBe(true); // > limit
  });
  it("auto → scrollable when wide and few items", () => {
    expect(resolveStackedLegendLayout("auto", 1000, 3)).toEqual({
      isShowMore: false,
      isScrollable: true,
    });
  });
  it("auto without containerWidth → scrollable (no width to judge)", () => {
    expect(resolveStackedLegendLayout("auto", undefined, 3).isScrollable).toBe(true);
  });
  it("locks the exact breakpoint/limit boundaries (strict < / >)", () => {
    // width === SHOW_MORE_BREAKPOINT (450) is NOT < 450 → scrollable.
    expect(resolveStackedLegendLayout("auto", 450, 2)).toEqual({
      isShowMore: false,
      isScrollable: true,
    });
    // itemCount === LEGEND_ITEM_LIMIT (6) is NOT > 6 → scrollable.
    expect(resolveStackedLegendLayout("auto", 1000, 6)).toEqual({
      isShowMore: false,
      isScrollable: true,
    });
  });
});

describe("formatStackedValue", () => {
  it("percentage of total to 1 decimal", () => {
    expect(formatStackedValue(25, 100, "percentage")).toBe("25.0%");
    expect(formatStackedValue(1, 3, "percentage")).toBe("33.3%");
  });
  it("number returns the raw value as string", () => {
    expect(formatStackedValue(42, 100, "number")).toBe("42");
  });
  it("guards divide-by-zero total", () => {
    expect(formatStackedValue(0, 0, "percentage")).toBe("0.0%");
  });
});
