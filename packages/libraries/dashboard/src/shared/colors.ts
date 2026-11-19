/**
 * Chart colours. Charts read these CSS variables (defined in styles.css), so a
 * host can re-theme by overriding `--openui-dashboard-series-*` and friends on `.openui-dashboard-root`.
 *
 * The categorical order was validated for colour-vision deficiency: adjacent
 * slots stay distinguishable (CVD ΔE ≥ 12 light), and the first three stay
 * distinguishable in every pairing, which is why part-to-whole charts show at
 * most three slices plus "Other". Assign in order; never by rank. The dark
 * theme (styles.css) has its own steps, validated on the dark card surface.
 */
export const SERIES_COLORS = Array.from(
  { length: 8 },
  (_, i) => `var(--openui-dashboard-series-${i + 1})`,
);

/** The de-emphasis colour for the previous period, targets and "other". */
export const MUTED_COLOR = "var(--openui-dashboard-muted-mark)";

/** Slots 1–8 in order; anything past the eighth is grey "other", never a generated or repeated hue. */
export const seriesColor = (index: number) =>
  index < SERIES_COLORS.length ? SERIES_COLORS[index] : MUTED_COLOR;

/** The single-hue ramp for magnitude (heatmaps, cohort grids), light → dark. */
export const SEQUENTIAL = Array.from(
  { length: 9 },
  (_, i) => `var(--openui-dashboard-seq-${i + 1})`,
);

/** Picks a ramp step for a value in [min, max]. */
export function sequentialColor(
  value: number,
  min: number,
  max: number,
): { background: string; color: string } {
  // When every value is equal there is no magnitude to show: use a mid step, not the darkest.
  const t = max === min ? 0.5 : Math.min(1, Math.max(0, (value - min) / (max - min)));
  const step = Math.round(t * (SEQUENTIAL.length - 1));
  // Each step carries its own text ink token; the light and dark ramps switch
  // ink at different steps, so the switch point lives in each theme's CSS.
  return { background: SEQUENTIAL[step]!, color: `var(--openui-dashboard-seq-ink-${step + 1})` };
}

/** The two-pole ramp for polarity around a midpoint (change, variance, correlation). */
export const DIVERGING = Array.from(
  { length: 9 },
  (_, i) => `var(--openui-dashboard-div-${i + 1})`,
);

/**
 * Picks a diverging step for a value: the neutral middle step at midpoint,
 * the poles at ±spread. Each step carries its own text ink, set per theme.
 */
export function divergingColor(
  value: number,
  midpoint: number,
  spread: number,
): { background: string; color: string } {
  const t = spread ? Math.max(-1, Math.min(1, (value - midpoint) / spread)) : 0;
  const step = 4 + Math.round(t * 4);
  return { background: DIVERGING[step]!, color: `var(--openui-dashboard-div-ink-${step + 1})` };
}

/**
 * The textures series cycle through, in order. Each is drawn as dark ink (or
 * the series' own hue) over its colour, so neighbours differ by more than hue.
 * Series 1–6 get one each; 7 and 8 start the cycle again.
 */
export const TEXTURES = [
  "dots",
  "slash",
  "back-slash",
  "horizontal",
  "crosshatch",
  "vertical",
] as const;
export const textureOf = (index: number) => index % TEXTURES.length;
