// Series geometry for the kit charts, built with d3-shape the way react-ui's
// charts build theirs (components/Charts/shared/cartesian/seriesGeometry.ts):
// the same curves, the same generators, read straight off flat pixel vectors.
//
// Morph layout: one flat Float64Array per chart — the x positions, then each
// series' y positions — `[x0…xn-1, y(s0)0…y(s0)n-1, y(s1)0…, …]`. One data
// morph springs every scalar, and every path is rebuilt from the same animated
// values on each tick, so lines, areas, and the bands between them can never
// seam apart mid-animation.
//
// Pure (no DOM, no React) — unit-tested directly.

import {
  curveLinear,
  curveMonotoneX,
  curveStep,
  area as d3Area,
  line as d3Line,
  type CurveFactory,
} from "d3-shape";

/** How a series is drawn between its points. */
export type SeriesCurve = "natural" | "linear" | "step";

/**
 * The d3 curve for a variant. "natural" is d3's monotone-x curve, react-ui's
 * default: smooth, and it never overshoots a point, so a curve can't suggest a
 * value the data doesn't have. Anything unknown falls back to it.
 */
export function seriesCurve(variant: SeriesCurve | undefined): CurveFactory {
  switch (variant) {
    case "linear":
      return curveLinear;
    case "step":
      return curveStep;
    default:
      return curveMonotoneX;
  }
}

export function packGeometry(xs: ArrayLike<number>, ys: ArrayLike<number>[]): Float64Array {
  const n = xs.length;
  const out = new Float64Array(n * (ys.length + 1));
  out.set(xs, 0);
  ys.forEach((series, s) => out.set(series, n * (s + 1)));
  return out;
}

export function unpackGeometry(
  values: Float64Array,
  pointCount: number,
): { xs: Float64Array; ys: Float64Array[] } {
  const rows = Math.floor(values.length / pointCount);
  const xs = values.subarray(0, pointCount);
  const ys = Array.from({ length: rows - 1 }, (_, s) =>
    values.subarray(pointCount * (s + 1), pointCount * (s + 2)),
  );
  return { xs, ys };
}

/** Index array [from..to] — what the d3 generators iterate while accessors read the vectors. */
function indices(from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}

const finite = (v: number | undefined): v is number => v != null && Number.isFinite(v);

/** A series line through points `from`…`to` (inclusive); missing values break the line. */
export function lineD(
  xs: ArrayLike<number>,
  ys: ArrayLike<number>,
  curve: CurveFactory = curveMonotoneX,
  from = 0,
  to = xs.length - 1,
): string {
  return (
    d3Line<number>()
      .defined((i) => finite(ys[i]))
      .x((i) => xs[i]!)
      .y((i) => ys[i]!)
      .curve(curve)(indices(from, to)) ?? ""
  );
}

/**
 * The area between two edges: `y0` (a constant baseline, or a second series)
 * and `y1`. With a series for `y0`, it is the band between two lines.
 */
export function areaD(
  xs: ArrayLike<number>,
  y0: number | ArrayLike<number>,
  y1: ArrayLike<number>,
  curve: CurveFactory = curveMonotoneX,
): string {
  const base = typeof y0 === "number" ? () => y0 : (i: number) => y0[i]!;
  return (
    d3Area<number>()
      .defined((i) => finite(y1[i]) && finite(base(i)))
      .x((i) => xs[i]!)
      .y0(base)
      .y1((i) => y1[i]!)
      .curve(curve)(indices(0, xs.length - 1)) ?? ""
  );
}
