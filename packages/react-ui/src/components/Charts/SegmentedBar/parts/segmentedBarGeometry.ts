// Pure share math for the SegmentedBar: value clamp + SHARE-OF-TOTAL. Kept out
// of the component so the clamp and the divide-by-zero guard are unit-testable
// in isolation.
//
// NOTE: this is share-of-TOTAL (value / Σ visible), NOT the funnel's
// retention-relative-to-first-stage (see funnelGeometry.ts:funnelPercentage).

/**
 * A segment's numeric value. Non-numeric / NaN / negative collapses to 0 — a
 * negative share has no geometry, and a NaN would poison the total. Adapts
 * funnelStageValue (useFunnelChartOrchestrator.ts:31), tightened to also clamp
 * negatives (the funnel allows them; the segmented bar does not).
 */
export function segmentValue(raw: string | number | undefined): number {
  const value = Number(raw);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/**
 * Share of the TOTAL: value / Σ, clamped to [0, 1]. Divide-by-zero guard:
 * total <= 0 → 0, so an all-zero (or empty) set renders zero-width segments,
 * never NaN / Infinity. The div-based bar multiplies this by 100 for its
 * `width: %` — the same width that encodes the segment's share.
 */
export function segmentShare(value: number, total: number): number {
  if (!(total > 0)) return 0;
  return Math.max(0, value) / total;
}
