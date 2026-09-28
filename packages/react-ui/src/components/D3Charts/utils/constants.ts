/**
 * Brand prefix for every chart class name and `@keyframes` name the library
 * emits (`openui-d3-bar-chart-container`, `openui-d3-chart-tooltip`,
 * `openui-d3-fade-appear`, …). Distinct from the Recharts `Charts/` folder's
 * `openui-` classes so both stylesheets can ship side by side. Always compose
 * class names from this constant; never hardcode the brand token in TSX/TS.
 * SCSS can't read TS constants: `_prefix.scss` mirrors this as `$prefix`
 * — change BOTH or the stylesheets stop matching the DOM.
 * NOTE: the `data-openui-chart` print/PPTX attribute is a backend contract and
 * deliberately NOT derived from this prefix (see `useExportChartData`).
 */
export const CHART_CLASS_PREFIX = "openui-d3";

export const CHART_MARGIN_TOP = 10;
// Minimum vertical px between y-ticks. Grid and YAxis must share this value:
// both derive tickCount from it, and gridlines only align with tick labels
// because the two computations are identical.
export const MIN_TICK_SPACING = 40;
export const DEFAULT_CHART_HEIGHT = 296;
export const SINGLE_LINE_BREAKPOINT = 300;
export const ANGLED_LABEL_THRESHOLD = 100;

/**
 * Resolve the d3 tick-count hint for the y-axis (labels) AND the horizontal
 * gridlines — they share the y-scale, so both MUST call this with the same
 * arguments to stay in lockstep.
 *
 * - When `override` is a finite number the caller-supplied hint wins, floored
 *   at 2 (a chart with fewer than two ticks reads as broken).
 * - Otherwise the count is derived from the chart height at ~1 tick per
 *   `MIN_TICK_SPACING` (40) px, floored at 2 — the historical default. With
 *   `override` absent this is byte-identical to the old inline formula
 *   `Math.max(2, Math.floor(chartHeight / MIN_TICK_SPACING))`.
 *
 * The result is only a HINT: d3's `scale.ticks(count)` treats it as a target
 * and returns nice round values near it, so the rendered tick count can differ.
 */
export const resolveTickCount = (chartHeight: number, override?: number): number =>
  override != null && Number.isFinite(override)
    ? Math.max(2, Math.floor(override))
    : Math.max(2, Math.floor(chartHeight / MIN_TICK_SPACING));
