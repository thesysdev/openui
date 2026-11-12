export interface CalendarHeatmapDatum {
  /**
   * The calendar day this value falls on. Either a `Date` or a date-only string
   * (`"2026-01-05"`); parsed in LOCAL time so a day never drifts across the
   * timezone boundary. Multiple data points on the same day are SUMMED onto one
   * cell.
   */
  date: string | Date;
  /** The day's magnitude (e.g. commits, sales, events). Days with no datum are 0. */
  value: number;
}

/** One of the five built-in tile patterns overlaid on a level's color. */
export type CalendarLevelPattern = "diagonal" | "dots" | "cross" | "horizontal" | "vertical";

/**
 * Per-level style override (index 0..4, empty → most active). Any entry may be
 * `null` / omitted to keep that level's default. `color` overrides the level's
 * resolved fill; `pattern` overlays a hatch/dot tile on top of that fill;
 * `patternColor` sets the pattern's stroke (defaults to the theme foreground).
 */
export interface CalendarLevelStyle {
  /** Override this level's fill color. */
  color?: string;
  /** Overlay a tile pattern on the fill. */
  pattern?: CalendarLevelPattern;
  /** Pattern stroke/dot color. Default: the theme foreground token. */
  patternColor?: string;
}

/**
 * Column-separator config: split the week columns into groups by a fixed
 * interval or by calendar quarter, drawing a vertical rule (and an optional
 * gutter) at each boundary.
 */
export interface CalendarColumnSeparators {
  /**
   * Group by a fixed interval (`{ every: N }` → a rule before every Nth column)
   * or by calendar quarter (`'quarter'` → a rule at each Jan/Apr/Jul/Oct start).
   */
  groupBy: { every: number } | "quarter";
  /** Extra horizontal gap opened at each separator in px, shifting the columns
   * apart. Default 0 (a hairline rule that does not move the grid). */
  spacing?: number;
  /** Separator line color. Default: the theme border token. */
  stroke?: string;
  /** Draw the separators dashed instead of solid. Default false. */
  dashed?: boolean;
  /** Draw a quarter label (e.g. `Q1 2026`) at each group start. Only meaningful
   * for `groupBy: 'quarter'`. Default false. */
  showLabels?: boolean;
  /** Format a quarter label from its `1`–`4` quarter and calendar `year`.
   * Default `` (q, year) => `Q${q} ${year}` ``. */
  labelFormat?: (quarter: number, year: number) => string;
}

export interface CalendarHeatmapProps {
  /** One `{ date, value }` per day. Sparse is fine — missing days render as level 0. */
  data: CalendarHeatmapDatum[];
  /**
   * The window of days to show.
   * - `"6m"` / `"12m"` — a calendar-month window ending on TODAY (GitHub-style;
   *   the data does not move the window).
   * - `[start, end]` — an explicit range (Dates or date-only strings).
   * - omitted — the data's own earliest→latest day.
   * The first column is always aligned to `weekStartDay`.
   */
  range?: "6m" | "12m" | [Date | string, Date | string];
  /**
   * Ascending cutoffs `[t1, t2, t3, t4]` for contribution levels 1..4: a day's
   * value maps to the highest level whose cutoff it meets, or level 0 below
   * `t1`. Default `[1, 2, 3, 4]` — the GitHub scale where 4+ saturates.
   */
  thresholds?: [number, number, number, number];
  /**
   * Five explicit colors for levels 0..4 (empty → most active). Overrides the
   * theme-derived ramp. When omitted, five stops are sampled from the theme's
   * `defaultChartPalette` (or the built-in ramp), level 0 being the faint
   * "empty" shade.
   */
  levelColors?: [string, string, string, string, string];
  /**
   * How the grid sizes to its container.
   * - `"fluid"` (default) — square cells sized from the container WIDTH; the
   *   grid height hugs the seven rows (GitHub-style).
   * - `"fill"` — cells stretch to fill BOTH the measured width and height.
   */
  layout?: "fluid" | "fill";
  /**
   * Fixed cell slot size in px, overriding the auto-size from `layout`. The
   * drawn square is `binSize - gap`. Omit to let the container drive sizing.
   */
  binSize?: number;
  /** Gap between cells in px. Default 3. */
  gap?: number;
  /**
   * The weekday that opens each column (row 0). `0` = Sunday (GitHub default),
   * `1` = Monday, … `6` = Saturday. Default 0.
   */
  weekStartDay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Drop the decorative padding days that fall outside the window (the corners
   * of the first/last week). Default true (GitHub-style). Set false to render
   * them as level-0 cells.
   */
  hideGhostCells?: boolean;
  /**
   * Which weekday rows get a left-hand label. `"odd"` (default) labels every
   * other row (Mon/Wed/Fri for a Sunday start); `"even"` labels the alternates;
   * `"all"` labels every row.
   */
  weekdayTickFilter?: "all" | "odd" | "even";
  /**
   * Weekday label style. `"full"` (default) is the three-letter abbreviation
   * (`"Mon"`); `"initial"` is the single narrow letter (`"M"`).
   */
  weekdayLabelFormat?: "full" | "initial";
  /** Show the short month labels along the top. Default true. */
  showMonthLabels?: boolean;
  /**
   * Per-row opacity multiplier applied as fill-opacity. A single number dims
   * every row equally; an array is indexed by display row (row 0 = top). Rows
   * without an entry stay fully opaque.
   */
  rowOpacity?: number | number[];
  /**
   * Play the entrance animation. Gates the entrance ONLY — any hover or
   * data-update motion is independent of this flag, and printing always
   * disables it.
   * Default false (streaming-safe: marks mounted while data streams in don't
   * replay staggered entrances).
   */
  isAnimationActive?: boolean;
  /**
   * Entrance window in ms — the span over which the per-cell stagger scatters
   * the fade-ins. Only meaningful when `isAnimationActive`. Default 1600.
   */
  animationDuration?: number;
  width?: number | string;
  height?: number | string;
  /**
   * Ordered color ramp the level scale is sampled from (low → high); overrides
   * the theme palette. Superseded by `levelColors` when that is also given.
   */
  customPalette?: string[];
  /**
   * Per-level style overrides, indexed by level 0..4 (empty → most active).
   * Each entry may be `null` to keep that level's default. Use it to recolor a
   * level or overlay one of the built-in tile patterns; a level's `color` here
   * supersedes the corresponding `levelColors` / palette stop.
   */
  levelStyles?: Array<CalendarLevelStyle | null>;
  /**
   * Split the week columns into groups with vertical separators — by a fixed
   * interval (`{ every: N }`) or by calendar quarter (`'quarter'`), optionally
   * opening a gutter and labeling each quarter. Omit for an ungrouped grid.
   */
  columnSeparators?: CalendarColumnSeparators;
  /**
   * The Less→More scale legend under the grid: `"swatches"` (five discrete
   * squares, default), `"gradient"` (a continuous color bar), or `"none"`.
   */
  legendVariant?: "swatches" | "gradient" | "none";
  /** Override the legend's bracketing labels. Default `{ less: 'Less', more: 'More' }`. */
  legendLabels?: { less?: string; more?: string };
  /** Name of the day's value in the tooltip. Default `"Contributions"`. */
  valueLabel?: string;
  /**
   * Format the tooltip's contribution value from the day's summed `value` and
   * its `Date` (e.g. add units or a currency symbol). Default: the raw value.
   */
  formatTooltipLabel?: (value: number, date: Date) => string;
  /**
   * Tooltip show/hide delays in ms. The hide grace period keeps the tooltip
   * alive while the pointer crosses between adjacent cells. Default
   * `{ show: 0, hide: 120 }`.
   */
  tooltipDelay?: { show?: number; hide?: number };
  /** Click on a day: its `Date` and summed `value`. */
  onClick?: (date: Date, value: number) => void;
  className?: string;
}
