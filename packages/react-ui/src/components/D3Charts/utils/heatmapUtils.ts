// Pure helpers for the heatmap's color scale and x-axis layout. Kept out of
// the orchestrator so the quantize-domain, label-thinning, and key-dedup
// rules are unit-testable.

export type HeatmapRampMode = "sequential" | "diverging";

/**
 * The quantize domain for the cell color scale.
 *
 * - `sequential`: the visible value extent, widened when it collapses —
 *   scaleQuantize cannot bucket a zero-width domain, so all-equal data
 *   renders every cell as the ramp's first color.
 * - `diverging`: symmetric about zero (±max|value|), so the ramp's middle
 *   bucket always contains zero no matter how asymmetric the data is — the
 *   whole point of a diverging ramp. An all-zero extent widens to ±1.
 */
export const computeHeatmapColorDomain = (
  minValue: number,
  maxValue: number,
  rampMode: HeatmapRampMode,
): [number, number] => {
  if (rampMode === "diverging") {
    const magnitude = Math.max(Math.abs(minValue), Math.abs(maxValue));
    return magnitude > 0 ? [-magnitude, magnitude] : [-1, 1];
  }
  return maxValue > minValue ? [minValue, maxValue] : [minValue, minValue + 1];
};

/**
 * Show every n-th x label so each shown label gets at least `minLabelPx` of
 * band — 100+ streamed columns must not render an ellipsis (plus a tooltip
 * wrapper) per column. 1 = every label, the XAxis default.
 */
export const computeLabelInterval = (bandwidth: number, minLabelPx: number): number => {
  if (!Number.isFinite(bandwidth) || bandwidth <= 0) return 1;
  return Math.max(1, Math.ceil(minLabelPx / bandwidth));
};

/**
 * Stable React keys for columns whose labels may repeat — LLMs re-emit
 * categories routinely, and duplicate keys make React drop/overdraw siblings.
 * First occurrence keeps the bare label (streaming appends never re-key
 * existing columns); repeats get an occurrence suffix. Same-label columns
 * still share one x band (d3 ordinal domains intern duplicates), so the last
 * one drawn wins visually — a data pathology rendered deterministically
 * rather than corrupting reconciliation.
 */
export const buildColumnKeys = (labels: string[]): string[] => {
  const seen = new Map<string, number>();
  return labels.map((label) => {
    const occurrence = seen.get(label) ?? 0;
    seen.set(label, occurrence + 1);
    // NUL separator: a plain-text suffix could collide with a REAL label
    // ("Jan", "Jan", "Jan 1" would key "Jan 1" twice); no real label has \0.
    return occurrence === 0 ? label : `${label}\u0000${occurrence}`;
  });
};
