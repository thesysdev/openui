import { describe, expect, it } from "vitest";
import { buildCalendarGrid } from "./calendarMath";
import { columnXOffsets, resolveCalendarSeparators, separatorColumns } from "./separatorLayout";

describe("separatorColumns", () => {
  const grid = buildCalendarGrid(
    [
      { date: "2026-01-01", value: 1 },
      { date: "2026-09-30", value: 1 },
    ],
    { weekStartDay: 0, hideGhostCells: true },
  );

  it("places a separator every N columns (excludes col 0, stops before the end)", () => {
    // grid.weeks === 40
    expect(separatorColumns(grid, { groupBy: { every: 13 } })).toEqual([13, 26, 39]);
  });

  it("returns no separators when the interval meets or exceeds the width", () => {
    expect(separatorColumns(grid, { groupBy: { every: 40 } })).toEqual([]);
    expect(separatorColumns(grid, { groupBy: { every: 100 } })).toEqual([]);
    expect(separatorColumns(grid, { groupBy: { every: 0 } })).toEqual([]);
  });

  it("groupBy 'quarter' delegates to calendar-quarter boundaries", () => {
    expect(separatorColumns(grid, { groupBy: "quarter" })).toEqual([13, 26]);
  });
});

describe("columnXOffsets", () => {
  // Brief case: columnXOffsets(10, [4,8], 12) →
  // cols 0-3 offset 0, cols 4-7 offset 12, cols 8-9 offset 24.
  it("accumulates spacing for every separator at or before a column", () => {
    expect(columnXOffsets(10, [4, 8], 12)).toEqual([0, 0, 0, 0, 12, 12, 12, 12, 24, 24]);
  });

  it("is all zeros when there are no separators", () => {
    expect(columnXOffsets(4, [], 12)).toEqual([0, 0, 0, 0]);
  });

  it("is order-independent in the separator list", () => {
    expect(columnXOffsets(10, [8, 4], 12)).toEqual(columnXOffsets(10, [4, 8], 12));
  });
});

describe("resolveCalendarSeparators", () => {
  // grid.weeks === 40, quarterBoundaryColumns === [13, 26].
  const grid = buildCalendarGrid(
    [
      { date: "2026-01-01", value: 1 },
      { date: "2026-09-30", value: 1 },
    ],
    { weekStartDay: 0, hideGhostCells: true },
  );

  it("maps 'quarter' to boundary columns, gutter offsets and consecutive Q labels", () => {
    const resolved = resolveCalendarSeparators(grid, {
      groupBy: "quarter",
      spacing: 10,
      showLabels: true,
    });

    expect(resolved.columns).toEqual([13, 26]);
    expect(resolved.spacing).toBe(10);
    // cols 0-12 offset 0, 13-25 offset 10, 26-39 offset 20.
    expect(resolved.offsets).toHaveLength(40);
    expect(resolved.offsets[12]).toBe(0);
    expect(resolved.offsets[13]).toBe(10);
    expect(resolved.offsets[26]).toBe(20);
    expect(resolved.offsets[39]).toBe(20);
    // The first group anchors at column 0; boundaries anchor the following
    // quarters. Quarters advance consecutively across the window.
    expect(resolved.labels).toEqual([
      { col: 0, quarter: 1, year: 2026 },
      { col: 13, quarter: 2, year: 2026 },
      { col: 26, quarter: 3, year: 2026 },
    ]);
  });

  it("omits labels when showLabels is not set", () => {
    const resolved = resolveCalendarSeparators(grid, { groupBy: "quarter" });
    expect(resolved.columns).toEqual([13, 26]);
    expect(resolved.labels).toEqual([]);
  });

  it("maps '{ every: N }' to interval columns with zero-default spacing and no labels", () => {
    const resolved = resolveCalendarSeparators(grid, {
      groupBy: { every: 13 },
      showLabels: true,
    });
    expect(resolved.columns).toEqual([13, 26, 39]);
    expect(resolved.spacing).toBe(0);
    expect(resolved.offsets).toEqual(new Array(40).fill(0));
    // Quarter labels are a 'quarter'-mode feature; interval mode has none.
    expect(resolved.labels).toEqual([]);
  });

  it("yields empty columns/labels and all-zero offsets when no separators apply", () => {
    const resolved = resolveCalendarSeparators(grid, {
      groupBy: { every: 40 },
    });
    expect(resolved.columns).toEqual([]);
    expect(resolved.labels).toEqual([]);
    expect(resolved.offsets).toEqual(new Array(40).fill(0));
  });
});
