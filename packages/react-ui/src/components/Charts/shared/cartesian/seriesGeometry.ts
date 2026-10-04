// Flat-vector geometry builders for the line/area series data morph.
//
// A series' rendered geometry is flattened into one Float64Array of pixel
// scalars — the shape the spring engine animates (dataMorph springs each
// scalar). These builders turn such a vector back into SVG path data. Both
// the React render (target attributes) and the morph's per-tick regeneration
// go through the SAME builder, so the two can never disagree about what a set
// of points looks like.
//
// Layouts (documented here, encoded in the strides):
//   line: [x, y] per point                (LINE_STRIDE = 2)
//   area: [x, y0, y1, yEdge] per point    (AREA_STRIDE = 4)
// `yEdge` is the area's stroked value edge as its own scalar (the running
// total y(d[1]) for stacked series, the value itself otherwise), decided at
// TARGET-build time rather than per morph tick.
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

export const LINE_STRIDE = 2;
export const AREA_STRIDE = 4;

/**
 * The line/area curve for a chart `variant`. "step" steps halfway between
 * points, as the Recharts charts did, so the first and last values get a flat
 * run too (step-after left the last value as a bare vertical tick). Anything
 * else falls back to "natural", the charts' default: while streaming, the
 * parser can hand over a placeholder (e.g. "") before the real value arrives,
 * and d3-shape throws "curve is not a function" on an undefined curve.
 */
export function seriesCurve(variant: string | undefined): CurveFactory {
  switch (variant) {
    case "linear":
      return curveLinear;
    case "step":
      return curveStep;
    default:
      return curveMonotoneX;
  }
}

/** Index array [0..n) — what the d3 generators iterate while accessors read
 *  the flat vector. Tiny (≤ point count) and short-lived. */
const indices = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

/** Line `d` from `[x, y]` scalars. */
export function buildLineD(values: ArrayLike<number>, curve: CurveFactory): string {
  const n = Math.floor(values.length / LINE_STRIDE);
  const gen = d3Line<number>()
    .x((i) => values[i * LINE_STRIDE] ?? 0)
    .y((i) => values[i * LINE_STRIDE + 1] ?? 0)
    .curve(curve);
  return gen(indices(n)) ?? "";
}

/** Area fill `d` from `[x, y0, y1, yEdge]` scalars (yEdge unused here). */
export function buildAreaD(values: ArrayLike<number>, curve: CurveFactory): string {
  const n = Math.floor(values.length / AREA_STRIDE);
  const gen = d3Area<number>()
    .x((i) => values[i * AREA_STRIDE] ?? 0)
    .y0((i) => values[i * AREA_STRIDE + 1] ?? 0)
    .y1((i) => values[i * AREA_STRIDE + 2] ?? 0)
    .curve(curve);
  return gen(indices(n)) ?? "";
}

/** Area value-edge stroke `d` from the same `[x, y0, y1, yEdge]` scalars. */
export function buildAreaEdgeD(values: ArrayLike<number>, curve: CurveFactory): string {
  const n = Math.floor(values.length / AREA_STRIDE);
  const gen = d3Line<number>()
    .x((i) => values[i * AREA_STRIDE] ?? 0)
    .y((i) => values[i * AREA_STRIDE + 3] ?? 0)
    .curve(curve);
  return gen(indices(n)) ?? "";
}
