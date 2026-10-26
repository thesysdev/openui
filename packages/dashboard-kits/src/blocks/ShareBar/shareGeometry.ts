/** Half the surface gap between segments, in px. */
export const SHARE_GAP = 2;
/** The narrowest a part with any value is drawn, so it stays visible and hoverable. */
export const MIN_SEGMENT = 3;

/**
 * Pixel spans of each part along one bar of `width`: widths proportional to
 * the values on a linear scale, a 2px surface gap between neighbours, and
 * every non-zero part at least MIN_SEGMENT wide (taken from the widest).
 * Packed flat as [x, width] per part, so the data morph can spring it.
 */
export function shareSpans(values: number[], width: number, gap = SHARE_GAP): Float64Array {
  const out = new Float64Array(values.length * 2);
  const parts = values.map((v) => (Number.isFinite(v) && v > 0 ? v : 0));
  const shown = parts.filter((v) => v > 0).length;
  const total = parts.reduce((a, v) => a + v, 0);
  if (total === 0 || width <= 0) return out;
  const room = Math.max(0, width - gap * Math.max(0, shown - 1));
  const widths = parts.map((v) => (v > 0 ? Math.max(MIN_SEGMENT, (v / total) * room) : 0));
  // Give back what the minimums took, from the widest part.
  const over = widths.reduce((a, w) => a + w, 0) - room;
  if (over > 0) {
    const widest = widths.indexOf(Math.max(...widths));
    widths[widest] = Math.max(MIN_SEGMENT, widths[widest]! - over);
  }
  let x = 0;
  widths.forEach((w, i) => {
    out[i * 2] = x;
    out[i * 2 + 1] = w;
    if (w > 0) x += w + gap;
  });
  return out;
}

/** The part under `px`, or null in a gap or past the ends. */
export function shareAt(spans: ArrayLike<number>, px: number): number | null {
  for (let i = 0; i < spans.length / 2; i++) {
    const x = spans[i * 2]!;
    const w = spans[i * 2 + 1]!;
    if (w > 0 && px >= x - 1 && px <= x + w + 1) return i;
  }
  return null;
}

/** A segment with its outer corners rounded: the bar's left end, its right end, or both. */
export function segmentPath(
  x: number,
  width: number,
  height: number,
  roundLeft: boolean,
  roundRight: boolean,
  radius = 4,
): string {
  const w = Math.max(0, width);
  const r = Math.min(radius, w / 2, height / 2);
  const l = roundLeft ? r : 0;
  const rr = roundRight ? r : 0;
  const x2 = x + w;
  return [
    `M${x + l},0`,
    `H${x2 - rr}`,
    rr ? `Q${x2},0 ${x2},${rr}V${height - rr}Q${x2},${height} ${x2 - rr},${height}` : `V${height}`,
    `H${x + l}`,
    l ? `Q${x},${height} ${x},${height - l}V${l}Q${x},0 ${x + l},0` : `V0`,
    "Z",
  ].join("");
}
