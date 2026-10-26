/**
 * Prefix for every kit chart class name and `@keyframes` name
 * (`kit-trend-chart-frame`, `kit-draw-line`, …). Compose class names from this
 * constant; never hardcode it in TSX. `_prefix.scss` mirrors it as `$prefix`.
 */
export const KIT_CHART_PREFIX = "kit";

/** Categorical colors in fixed order, from the kit theme. Color follows the series, never its rank. */
export const SERIES_COLORS = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `var(--kit-s${i})`);

/** Context series (the prior period, "everyone else") draw in this gray. */
export const MUTED_COLOR = "var(--kit-muted-mark)";

/** Default plot height for a trend; charts beside a taller card grow from it. */
export const DEFAULT_TREND_HEIGHT = 220;

/** Charts beside a taller card grow into its height, up to this. */
export const FILL_MAX_HEIGHT = 420;

/** Minimum px between x-axis labels before every other one is skipped. */
export const X_LABEL_SPACING = 72;
