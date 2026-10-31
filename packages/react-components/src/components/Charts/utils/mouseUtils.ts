import type { ScaleBand, ScalePoint } from "d3-scale";

export function findNearestDataIndex(xScale: ScalePoint<string>, mouseX: number): number {
  const domain = xScale.domain();
  let nearestIdx = 0;
  let minDist = Infinity;
  domain.forEach((cat, idx) => {
    const catX = xScale(cat) ?? 0;
    const dist = Math.abs(mouseX - catX);
    if (dist < minDist) {
      minDist = dist;
      nearestIdx = idx;
    }
  });
  return nearestIdx;
}

export function findBandIndex(xScale: ScaleBand<string>, mouseX: number): number {
  const domain = xScale.domain();
  const step = xScale.step();
  if (step === 0) return 0;
  const paddingOuter = xScale.paddingOuter() * step;
  const index = Math.floor((mouseX - paddingOuter) / step);
  return Math.max(0, Math.min(domain.length - 1, index));
}
