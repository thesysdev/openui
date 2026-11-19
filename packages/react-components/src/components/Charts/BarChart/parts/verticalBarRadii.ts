/**
 * Per-corner radii `[tl, tr, br, bl]` for one VERTICAL bar, matching react-ui:
 * only the OUTER corners round, so a bar stays flat against its baseline.
 * - `rounded === false` → no rounding, `[0, 0, 0, 0]` (inner stacked segments).
 * - positive bar (grows up from the baseline) rounds its TOP two corners,
 *   `[radius, radius, 0, 0]`.
 * - negative bar (grows down from the baseline) rounds its BOTTOM two corners,
 *   `[0, 0, radius, radius]`.
 *
 * The vertical counterpart of the horizontal `radiusArray`; fed to
 * `roundedBarPath` alongside the bar box.
 */
export function verticalBarRadii(
  radius: number,
  isNegative: boolean,
  rounded: boolean,
): [number, number, number, number] {
  if (!rounded) return [0, 0, 0, 0];
  return isNegative ? [0, 0, radius, radius] : [radius, radius, 0, 0];
}
