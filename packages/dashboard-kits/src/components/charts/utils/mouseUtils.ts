// Pointer position → data index, as react-ui's charts resolve it
// (components/Charts/utils/mouseUtils.ts).

import type { ScaleBand, ScalePoint } from "d3-scale";

/** The index of the point nearest `x` on a point scale. */
export function findNearestDataIndex<T extends string | number>(
  xScale: ScalePoint<T>,
  x: number,
): number {
  const domain = xScale.domain();
  let nearest = 0;
  let minDist = Infinity;
  domain.forEach((value, i) => {
    const dist = Math.abs(x - (xScale(value) ?? 0));
    if (dist < minDist) {
      minDist = dist;
      nearest = i;
    }
  });
  return nearest;
}

/** The index of the band under `x` on a band scale, clamped to the domain. */
export function findBandIndex<T extends string | number>(xScale: ScaleBand<T>, x: number): number {
  const domain = xScale.domain();
  const step = xScale.step();
  if (step === 0) return 0;
  const start = xScale.range()[0]! + xScale.paddingOuter() * step;
  const index = Math.floor((x - start) / step);
  return Math.max(0, Math.min(domain.length - 1, index));
}
