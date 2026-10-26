/** Where one series' column sits in value space in one column group. */
export interface ColumnSpan {
  from: number;
  to: number;
}

/**
 * Value spans for every series (outer) and column (inner). Grouped columns
 * each stand on zero. Stacked columns diverge from zero: positive values stack
 * upward and negative values downward, each in series order, so a stack of
 * gains over a loss reads both ways from one baseline.
 */
export function columnSpans(values: number[][], stacked: boolean): ColumnSpan[][] {
  const n = Math.max(0, ...values.map((v) => v.length));
  if (!stacked) {
    return values.map((v) =>
      Array.from({ length: n }, (_, j) => {
        const value = finite(v[j]);
        return { from: Math.min(0, value), to: Math.max(0, value) };
      }),
    );
  }
  const up = new Float64Array(n);
  const down = new Float64Array(n);
  return values.map((v) =>
    Array.from({ length: n }, (_, j) => {
      const value = finite(v[j]);
      if (value >= 0) {
        const from = up[j]!;
        up[j] = from + value;
        return { from, to: up[j]! };
      }
      const to = down[j]!;
      down[j] = to + value;
      return { from: down[j]!, to };
    }),
  );
}

const finite = (v: number | undefined) => (v != null && Number.isFinite(v) ? v : 0);

/** Each column's sum across series: the stack's net. */
export function columnTotals(values: number[][]): number[] {
  const n = Math.max(0, ...values.map((v) => v.length));
  return Array.from({ length: n }, (_, j) => values.reduce((a, v) => a + finite(v[j]), 0));
}

/**
 * Which segment ends a stack, per column: the last series with a positive
 * value (its top end is rounded) and the last with a negative one (its bottom
 * end is rounded). -1 where a column has none. Grouped columns round every bar.
 */
export function outerSegments(values: number[][]): { top: Int16Array; bottom: Int16Array } {
  const n = Math.max(0, ...values.map((v) => v.length));
  const top = new Int16Array(n).fill(-1);
  const bottom = new Int16Array(n).fill(-1);
  values.forEach((v, i) => {
    for (let j = 0; j < n; j++) {
      const value = finite(v[j]);
      if (value > 0) top[j] = i;
      else if (value < 0) bottom[j] = i;
    }
  });
  return { top, bottom };
}

/** Half the surface gap between stacked segments, in px. */
export const SEGMENT_GAP = 1;

/**
 * Every segment's top and bottom in pixels as one flat vector the data morph
 * can spring, series-major: [top, bottom] per series per column. Stacked
 * segments are inset where they meet another segment, leaving a 2px surface
 * gap, but never at the baseline or the stack's outer end.
 */
export function packColumns(
  spans: ColumnSpan[][],
  y: (value: number) => number,
  stacked: boolean,
): Float64Array {
  const n = spans[0]?.length ?? 0;
  const out = new Float64Array(spans.length * n * 2);
  const outer = stacked ? outerOf(spans) : null;
  spans.forEach((series, i) =>
    series.forEach((span, j) => {
      let top = y(span.to);
      let bottom = y(span.from);
      if (outer && bottom - top > 0) {
        const positive = span.to > 0;
        // Inner end: the end nearer zero. Outer end: the end away from it.
        const innerAtZero = positive ? span.from === 0 : span.to === 0;
        const isOuter = positive ? outer.top[j] === i : outer.bottom[j] === i;
        const gapTop = positive ? !isOuter : !innerAtZero;
        const gapBottom = positive ? !innerAtZero : !isOuter;
        if (gapTop) top += SEGMENT_GAP;
        if (gapBottom) bottom -= SEGMENT_GAP;
        if (bottom < top) top = bottom = (top + bottom) / 2;
      }
      const o = (i * n + j) * 2;
      out[o] = top;
      out[o + 1] = bottom;
    }),
  );
  return out;
}

function outerOf(spans: ColumnSpan[][]) {
  return outerSegments(
    spans.map((s) => s.map((span) => (span.to > 0 ? 1 : span.from < 0 ? -1 : 0))),
  );
}

/**
 * A column with only its outer end rounded: the top for a column above zero,
 * the bottom for one below. The radius shrinks to fit short or thin columns.
 */
export function columnPath(
  x: number,
  width: number,
  top: number,
  bottom: number,
  round: "top" | "bottom" | "none",
  radius = 4,
): string {
  const h = Math.max(0, bottom - top);
  const r = round === "none" ? 0 : Math.max(0, Math.min(radius, width / 2, h));
  const x2 = x + width;
  if (r === 0) return `M${x},${top}H${x2}V${bottom}H${x}Z`;
  if (round === "top") {
    return `M${x},${bottom}V${top + r}Q${x},${top} ${x + r},${top}H${x2 - r}Q${x2},${top} ${x2},${top + r}V${bottom}Z`;
  }
  return `M${x},${top}H${x2}V${bottom - r}Q${x2},${bottom} ${x2 - r},${bottom}H${x + r}Q${x},${bottom} ${x},${bottom - r}Z`;
}
