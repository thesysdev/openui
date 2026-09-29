import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCalendarGrid,
  type CalendarCell,
  type CalendarGrid,
  formatCalendarTooltipDate,
  monthLabelColumns,
  quarterBoundaryColumns,
  resolveWeekRange,
} from "./calendarMath";

/** Local-midnight Date from y/m/d (m is 1-based), matching the module's parsing. */
function local(y: number, m: number, d: number): Date {
  return new Date(y, m - 1, d);
}

function cellOn(grid: CalendarGrid, date: Date): CalendarCell | undefined {
  return grid.cells.find((c) => c.date.getTime() === date.getTime());
}

describe("buildCalendarGrid — data extent (range undefined)", () => {
  // Brief case: data 2026-01-01..2026-03-31, weekStartDay=0.
  // NOTE: the brief states grid.weeks === 13, but a Sunday-aligned grid spanning
  // Jan 1's week (Sun Dec 28 2025) through Mar 31's week (Sun Mar 29 2026) is
  // 14 columns (13 week-gaps + 1). 14 is the honest count — bklit's own
  // getHeatmapWeekCount agrees. See task-3-report.md for the arithmetic.
  const data = [
    { date: "2026-01-01", value: 7 },
    { date: "2026-01-15", value: 2 },
    { date: "2026-01-15", value: 3 }, // duplicate day → sums to 5
    { date: "2026-03-31", value: 4 },
  ];

  it("spans 14 week columns and week-aligns the start to the prior Sunday", () => {
    const grid = buildCalendarGrid(data, {
      weekStartDay: 0,
      hideGhostCells: true,
    });
    expect(grid.weeks).toBe(14);
    expect(grid.start.getDay()).toBe(0); // Sunday
    expect(grid.start.getTime()).toBe(local(2025, 12, 28).getTime());
    expect(grid.end.getTime()).toBe(local(2026, 3, 31).getTime());
  });

  it("places 2026-01-01 (Thursday) at {col:0,row:4} with its value, not a ghost", () => {
    const grid = buildCalendarGrid(data, {
      weekStartDay: 0,
      hideGhostCells: true,
    });
    const jan1 = cellOn(grid, local(2026, 1, 1));
    expect(jan1).toBeDefined();
    expect(jan1!.col).toBe(0);
    expect(jan1!.row).toBe(4);
    expect(jan1!.value).toBe(7);
    expect(jan1!.ghost).toBe(false);
  });

  it("sums duplicate dates and lands values on the right cells", () => {
    const grid = buildCalendarGrid(data, {
      weekStartDay: 0,
      hideGhostCells: true,
    });
    expect(cellOn(grid, local(2026, 1, 15))!.value).toBe(5);
    expect(cellOn(grid, local(2026, 3, 31))!.value).toBe(4);
  });

  it("gives missing dates value 0", () => {
    const grid = buildCalendarGrid(data, {
      weekStartDay: 0,
      hideGhostCells: true,
    });
    expect(cellOn(grid, local(2026, 1, 2))!.value).toBe(0);
  });

  it("excludes ghost cells entirely when hideGhostCells is true", () => {
    const grid = buildCalendarGrid(data, {
      weekStartDay: 0,
      hideGhostCells: true,
    });
    expect(grid.cells.some((c) => c.ghost)).toBe(false);
    // Dec 28-31 2025 precede the data window → dropped.
    expect(cellOn(grid, local(2025, 12, 28))).toBeUndefined();
    // Apr 1-4 2026 trail the data window → dropped.
    expect(cellOn(grid, local(2026, 4, 1))).toBeUndefined();
  });

  it("includes ghost cells (value 0) when hideGhostCells is false", () => {
    const grid = buildCalendarGrid(data, {
      weekStartDay: 0,
      hideGhostCells: false,
    });
    // Columns unchanged whether ghosts are hidden or not.
    expect(grid.weeks).toBe(14);
    const leadGhost = cellOn(grid, local(2025, 12, 28));
    expect(leadGhost).toBeDefined();
    expect(leadGhost!.ghost).toBe(true);
    expect(leadGhost!.value).toBe(0);
    expect(leadGhost!.col).toBe(0);
    expect(leadGhost!.row).toBe(0); // Sunday, display row 0
  });

  // Brief case: weekStartDay=1 (Monday-first) → 2026-01-01 row becomes 3.
  it("rotates rows for a Monday-first week: 2026-01-01 lands on row 3", () => {
    const grid = buildCalendarGrid(data, {
      weekStartDay: 1,
      hideGhostCells: true,
    });
    const jan1 = cellOn(grid, local(2026, 1, 1));
    expect(jan1!.col).toBe(0);
    expect(jan1!.row).toBe(3);
    expect(grid.start.getDay()).toBe(1); // Monday
    expect(grid.start.getTime()).toBe(local(2025, 12, 29).getTime());
  });

  // Supports the brief's intended "~13 weeks for Q1": when the last datapoint
  // falls inside the 13th column, the honest count is exactly 13.
  it("spans exactly 13 columns when the data ends within the 13th week", () => {
    const grid = buildCalendarGrid(
      [
        { date: "2026-01-01", value: 1 },
        { date: "2026-03-28", value: 1 }, // Sat, last day of column 12
      ],
      { weekStartDay: 0, hideGhostCells: true },
    );
    expect(grid.weeks).toBe(13);
    expect(cellOn(grid, local(2026, 3, 28))!.col).toBe(12);
  });
});

describe("buildCalendarGrid — GitHub window inference (range 6m/12m)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // Brief case: range:'12m' with a single datapoint today → a full calendar-year
  // window ending this week. Pinned to a late-month "today" so the 12 calendar
  // months resolve to 53 week columns (bklit resolveHeatmapWeekRange semantics).
  it("resolves '12m' to 53 columns ending on this week's today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 31, 12, 0, 0)); // Dec 31 2026, local noon
    const today = local(2026, 12, 31);

    const grid = buildCalendarGrid([{ date: today, value: 9 }], {
      range: "12m",
      weekStartDay: 0,
      hideGhostCells: true,
    });

    expect(grid.weeks).toBe(53);
    expect(grid.start.getDay()).toBe(0);
    expect(grid.start.getTime()).toBe(local(2025, 12, 28).getTime());
    expect(grid.end.getTime()).toBe(today.getTime());

    const todayCell = cellOn(grid, today);
    expect(todayCell).toBeDefined();
    expect(todayCell!.value).toBe(9);
    expect(todayCell!.ghost).toBe(false);
    expect(todayCell!.col).toBe(52); // last column
  });

  it("resolves '6m' to a calendar-month window ending today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 11, 31, 12, 0, 0));
    const today = local(2026, 12, 31);

    const grid = buildCalendarGrid([{ date: today, value: 1 }], {
      range: "6m",
      weekStartDay: 0,
      hideGhostCells: true,
    });

    // Six-calendar-month window: start-of-week for Jun 1 2026 = Sun May 31 2026.
    expect(grid.start.getTime()).toBe(local(2026, 5, 31).getTime());
    expect(grid.end.getTime()).toBe(today.getTime());
    expect(grid.weeks).toBe(31);
    expect(cellOn(grid, today)!.ghost).toBe(false);
  });
});

describe("resolveWeekRange — explicit [start,end] tuple", () => {
  it("week-aligns the start and preserves the end, order-independent", () => {
    const range = resolveWeekRange([], ["2026-01-01", "2026-03-31"], 0);
    expect(range.start.getTime()).toBe(local(2025, 12, 28).getTime());
    expect(range.end.getTime()).toBe(local(2026, 3, 31).getTime());

    const swapped = resolveWeekRange([], ["2026-03-31", "2026-01-01"], 0);
    expect(swapped.start.getTime()).toBe(local(2025, 12, 28).getTime());
    expect(swapped.end.getTime()).toBe(local(2026, 3, 31).getTime());
  });

  it("ghosts cells outside an explicit tuple window", () => {
    const grid = buildCalendarGrid([], {
      range: [local(2026, 1, 1), local(2026, 3, 31)],
      weekStartDay: 0,
      hideGhostCells: false,
    });
    expect(cellOn(grid, local(2025, 12, 31))!.ghost).toBe(true);
    expect(cellOn(grid, local(2026, 1, 1))!.ghost).toBe(false);
    expect(cellOn(grid, local(2026, 3, 31))!.ghost).toBe(false);
  });
});

describe("quarterBoundaryColumns", () => {
  it("returns the columns that start a new calendar quarter (excludes col 0)", () => {
    const grid = buildCalendarGrid(
      [
        { date: "2026-01-01", value: 1 },
        { date: "2026-09-30", value: 1 },
      ],
      { weekStartDay: 0, hideGhostCells: true },
    );
    // Grid starts Sun Dec 28 2025 (col 0 holds Jan 1 = Q1 start, excluded).
    // Apr 1 and Jul 1 open Q2 and Q3.
    const cols = quarterBoundaryColumns(grid);
    expect(cols).toEqual([13, 26]);
    // Each boundary column contains the quarter's first day.
    for (const col of cols) {
      expect(col).toBeGreaterThan(0);
      expect(col).toBeLessThan(grid.weeks);
    }
  });
});

describe("monthLabelColumns", () => {
  it("emits one dedup label per month anchored to the column of the 1st", () => {
    const grid = buildCalendarGrid(
      [
        { date: "2026-01-01", value: 1 },
        { date: "2026-03-31", value: 1 },
      ],
      { weekStartDay: 0, hideGhostCells: true },
    );
    expect(monthLabelColumns(grid)).toEqual([
      { col: 0, label: "Jan" },
      { col: 5, label: "Feb" },
      { col: 9, label: "Mar" },
    ]);
  });
});

describe("formatCalendarTooltipDate", () => {
  // Brief ordinal table: 1→'1st', 2→'2nd', 3→'3rd', 11→'11th', 21→'21st',
  // plus the teens-suffix exceptions (11/12/13 all take 'th').
  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [21, "21st"],
    [22, "22nd"],
    [23, "23rd"],
    [31, "31st"],
  ])('renders the %ith with the "%s" ordinal suffix', (day, expected) => {
    // January 2026 so month/year are stable across the ordinal cases.
    expect(formatCalendarTooltipDate(new Date(2026, 0, day))).toContain(`January ${expected} 2026`);
  });

  it('formats the full "Month Ordinal Year · Weekday" label', () => {
    // Jan 20 2026 is a Tuesday (Jan 1 2026 is a Thursday).
    expect(formatCalendarTooltipDate(new Date(2026, 0, 20))).toBe("January 20th 2026 · Tuesday");
  });
});
