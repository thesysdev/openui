// Calendar-grid math for the GitHub-contributions-style CalendarHeatmap.
// Pure; no React/DOM/d3.
//
// LOCAL TIME, DELIBERATELY. A contribution calendar is about *calendar days* in
// the viewer's own timezone, so every date is normalized to LOCAL midnight.
// Note `new Date('2026-01-01')` parses as UTC midnight, which can land on the
// previous local day west of UTC; we never rely on that. Date-only strings are
// parsed field-wise via `new Date(y, m-1, d)` (local), and Date inputs are
// cloned and floored with `setHours(0,0,0,0)`. Day arithmetic rounds elapsed
// milliseconds to whole days so DST transitions (23h/25h days) can't drift a
// cell into the wrong column.
//
// Window semantics are ported from bklit heatmap-utils.ts (resolveHeatmapWeekRange,
// getHeatmapWeekStartAlignedToRange, resolveHeatmapDisplayRange) — logic, not code.

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;

/** Calendar-quarter start months (Jan, Apr, Jul, Oct). */
const QUARTER_START_MONTHS = [0, 3, 6, 9] as const;

/** Short month names, e.g. `Jan` — bklit month-label parity. */
const MONTH_LABEL_FMT = new Intl.DateTimeFormat("en-US", { month: "short" });

/** Long month name, e.g. `January` — tooltip header parity. */
const TOOLTIP_MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "long" });

/** Long weekday name, e.g. `Tuesday` — tooltip header parity. */
const TOOLTIP_WEEKDAY_FMT = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
});

export interface CalendarCell {
  col: number;
  row: number;
  date: Date;
  value: number;
  ghost: boolean;
}

export interface CalendarGrid {
  cells: CalendarCell[];
  weeks: number;
  start: Date;
  end: Date;
}

export type CalendarRange = "6m" | "12m" | [Date | string, Date | string];

interface DisplayWindow {
  start: Date | null;
  end: Date | null;
}

// ── date helpers ────────────────────────────────────────────────────────────

/** Normalize a Date or date-only string to LOCAL midnight (see module header). */
function toLocalDate(value: Date | string): Date {
  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    const parsed = new Date(value);
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }
  const clone = new Date(value);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

/** Local midnight for the current day. */
function localToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/** The `weekStartDay`-aligned start of `date`'s week (at or before it). */
function startOfWeek(date: Date, weekStartDay: number): Date {
  const aligned = new Date(date);
  aligned.setHours(0, 0, 0, 0);
  const offset = (aligned.getDay() - weekStartDay + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  aligned.setDate(aligned.getDate() - offset);
  return aligned;
}

/** `date` shifted by `days`, re-floored to local midnight (DST-safe). */
function addDays(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  shifted.setHours(0, 0, 0, 0);
  return shifted;
}

/** Whole calendar days between two local-midnight dates (rounded for DST). */
function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/** Column index of the week containing `date`, relative to an aligned `start`. */
function columnOf(date: Date, start: Date): number {
  return Math.floor(daysBetween(start, date) / DAYS_PER_WEEK);
}

/** Inclusive count of week columns spanning [`start`, `end`]. */
function weekCount(start: Date, end: Date, weekStartDay: number): number {
  const endWeek = startOfWeek(end, weekStartDay);
  return Math.round(daysBetween(start, endWeek) / DAYS_PER_WEEK) + 1;
}

/**
 * First-of-month for the calendar-month window `months` back from `today`
 * (bklit `getHeatmapCalendarRangeStart`). The 6-month window keeps bklit's quirk
 * of offsetting by `months` (spanning ~7 calendar months) rather than `months-1`.
 */
function calendarRangeStart(today: Date, months: number): Date {
  const monthOffset = months === 6 ? 6 : months - 1;
  return new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
}

/** Local-midnight min/max of a date list (assumes non-empty). */
function dateExtent(dates: Date[]): { min: Date; max: Date } {
  let min = dates[0]!;
  let max = dates[0]!;
  for (const date of dates) {
    if (date.getTime() < min.getTime()) min = date;
    if (date.getTime() > max.getTime()) max = date;
  }
  return { min, max };
}

// ── range + grid ────────────────────────────────────────────────────────────

/**
 * Resolves the grid's aligned start column and end day for a range.
 *
 * - `'6m'` / `'12m'`: a calendar-month window ending on *today* (GitHub window
 *   inference); the datapoints don't move the window.
 * - `[start, end]` tuple: an explicit window; the start is week-aligned.
 * - `undefined`: the data's own [min, max] extent; the start is week-aligned.
 *
 * `start` is always aligned to `weekStartDay` (it opens column 0); `end` is the
 * last in-window day and is left un-aligned.
 */
export function resolveWeekRange(
  dates: Date[],
  range: CalendarRange | undefined,
  weekStartDay: number,
): { start: Date; end: Date } {
  if (Array.isArray(range)) {
    const a = toLocalDate(range[0]);
    const b = toLocalDate(range[1]);
    const [low, high] = a.getTime() <= b.getTime() ? [a, b] : [b, a];
    return { start: startOfWeek(low, weekStartDay), end: high };
  }

  if (range === "6m" || range === "12m") {
    const today = localToday();
    const months = range === "6m" ? 6 : 12;
    const rangeStart = calendarRangeStart(today, months);
    return { start: startOfWeek(rangeStart, weekStartDay), end: today };
  }

  const normalized = dates.map(toLocalDate);
  if (normalized.length === 0) {
    const today = localToday();
    return { start: startOfWeek(today, weekStartDay), end: today };
  }
  const { min, max } = dateExtent(normalized);
  return { start: startOfWeek(min, weekStartDay), end: max };
}

/**
 * The display window used for ghost detection — days outside it are decorative
 * ghosts (padding), not real inactive days (bklit `resolveHeatmapDisplayRange`).
 * `'6m'`/`'12m'` clamp to [rangeStart, today]; a tuple clamps to its bounds; the
 * data-extent case clamps to [min, max].
 */
function resolveDisplayWindow(
  range: CalendarRange | undefined,
  dates: Date[],
  end: Date,
): DisplayWindow {
  if (Array.isArray(range)) {
    const a = toLocalDate(range[0]);
    const b = toLocalDate(range[1]);
    return a.getTime() <= b.getTime() ? { start: a, end: b } : { start: b, end: a };
  }
  if (range === "6m" || range === "12m") {
    const months = range === "6m" ? 6 : 12;
    return { start: calendarRangeStart(end, months), end };
  }
  if (dates.length === 0) return { start: null, end: null };
  const { min, max } = dateExtent(dates);
  return { start: min, end: max };
}

/** Whether `date` falls outside the display window (a ghost/padding day). */
function isGhost(date: Date, displayWindow: DisplayWindow): boolean {
  const time = date.getTime();
  if (displayWindow.end && time > displayWindow.end.getTime()) return true;
  if (displayWindow.start && time < displayWindow.start.getTime()) return true;
  return false;
}

/**
 * Builds the full week-column grid for a contribution calendar.
 *
 * Columns run left→right (one per week); rows run top→bottom (one per weekday,
 * rotated so row 0 is `weekStartDay`). Duplicate input dates SUM onto one cell;
 * days with no datapoint get value 0. Days outside the display window are
 * ghosts: omitted entirely when `hideGhostCells` is true, otherwise emitted with
 * `ghost: true` and value 0. `weeks` counts columns either way.
 */
export function buildCalendarGrid(
  data: ReadonlyArray<{ date: Date | string; value: number }>,
  opts: {
    range?: CalendarRange;
    weekStartDay: number;
    hideGhostCells: boolean;
  },
): CalendarGrid {
  const { weekStartDay, hideGhostCells } = opts;
  const normalizedDates = data.map((point) => toLocalDate(point.date));
  const { start, end } = resolveWeekRange(normalizedDates, opts.range, weekStartDay);
  const weeks = weekCount(start, end, weekStartDay);

  const valueByDay = new Map<number, number>();
  for (const point of data) {
    const key = toLocalDate(point.date).getTime();
    valueByDay.set(key, (valueByDay.get(key) ?? 0) + point.value);
  }

  const displayWindow = resolveDisplayWindow(opts.range, normalizedDates, end);

  const cells: CalendarCell[] = [];
  for (let col = 0; col < weeks; col++) {
    for (let row = 0; row < DAYS_PER_WEEK; row++) {
      const date = addDays(start, col * DAYS_PER_WEEK + row);
      const ghost = isGhost(date, displayWindow);
      if (ghost && hideGhostCells) continue;
      cells.push({
        col,
        row,
        date,
        value: valueByDay.get(date.getTime()) ?? 0,
        ghost,
      });
    }
  }

  return { cells, weeks, start, end };
}

// ── axis annotations ──────────────────────────────────────────────────────────

/**
 * Columns (excluding column 0) that open a new calendar quarter — the column
 * containing a Jan/Apr/Jul/Oct 1 within the grid's [start, end] window. Used to
 * draw quarter separators and anchor quarter labels.
 */
export function quarterBoundaryColumns(grid: CalendarGrid): number[] {
  const columns = new Set<number>();
  const startTime = grid.start.getTime();
  const endTime = grid.end.getTime();

  for (let year = grid.start.getFullYear(); year <= grid.end.getFullYear(); year++) {
    for (const month of QUARTER_START_MONTHS) {
      const quarterStart = new Date(year, month, 1);
      const time = quarterStart.getTime();
      if (time <= startTime || time > endTime) continue;
      const col = columnOf(quarterStart, grid.start);
      if (col > 0 && col < grid.weeks) columns.add(col);
    }
  }

  return [...columns].sort((a, b) => a - b);
}

/**
 * One short-month label per month, anchored to the column containing that
 * month's 1st (bklit month-anchor parity). Months whose 1st falls outside the
 * grid's [start, end] window are skipped; duplicate columns are deduped.
 */
export function monthLabelColumns(grid: CalendarGrid): Array<{ col: number; label: string }> {
  const startTime = grid.start.getTime();
  const endTime = grid.end.getTime();
  const seenColumns = new Set<number>();
  const labels: Array<{ col: number; label: string }> = [];

  for (let year = grid.start.getFullYear(); year <= grid.end.getFullYear(); year++) {
    for (let month = 0; month < 12; month++) {
      const first = new Date(year, month, 1);
      const time = first.getTime();
      if (time < startTime || time > endTime) continue;
      const col = columnOf(first, grid.start);
      if (col < 0 || col >= grid.weeks || seenColumns.has(col)) continue;
      seenColumns.add(col);
      labels.push({ col, label: MONTH_LABEL_FMT.format(first) });
    }
  }

  return labels.sort((a, b) => a.col - b.col);
}

// ── tooltip formatting ────────────────────────────────────────────────────────

/**
 * The English ordinal for a day-of-month: `1st`, `2nd`, `3rd`, `4th`… with the
 * teens (`11th`, `12th`, `13th`) always taking `th` (ported from bklit
 * `formatHeatmapOrdinalDay`).
 */
function ordinalDay(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

/**
 * The calendar tooltip's header line for a day, e.g.
 * `"January 20th 2026 · Tuesday"` — long month, ordinal day, year, then the
 * long weekday (bklit renders these as two lines; the shared portal tooltip has
 * a single header slot, so they join with a middot).
 */
export function formatCalendarTooltipDate(date: Date): string {
  const month = TOOLTIP_MONTH_FMT.format(date);
  const day = ordinalDay(date.getDate());
  const weekday = TOOLTIP_WEEKDAY_FMT.format(date);
  return `${month} ${day} ${date.getFullYear()} · ${weekday}`;
}
