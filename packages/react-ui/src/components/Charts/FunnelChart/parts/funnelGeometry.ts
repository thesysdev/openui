// Pure path/ramp math for the funnel's multi-ring halo. Kept out of the
// component so the trapezoid geometry, the layer ramp, and the percentage
// semantic are unit-testable in isolation.

export type FunnelOrientation = "horizontal" | "vertical";
export type FunnelEdges = "curved" | "straight";

// Cross-axis half-extent factor: the widest ring spans 0.88 of the cross-axis
// (2 × 0.44), leaving a 12% margin — the headroom a hover scale-pop would use.
const HALF_EXTENT = 0.44;
// Bezier control factor: > 0.5 pushes the curve's inflection past center for a
// fuller "belly" on the tapered edge.
const BEZIER_CONTROL = 0.55;

/**
 * One ring's SVG path for a HORIZONTAL funnel cell (local coords, origin at the
 * cell's top-left; the cell tapers from `normStart` on the left edge to
 * `normEnd` on the right). `layerScale` shrinks the ring toward the core.
 */
export function hSegmentPath(
  normStart: number,
  normEnd: number,
  segW: number,
  H: number,
  layerScale: number,
  straight = false,
): string {
  const my = H / 2;
  const h0 = normStart * H * HALF_EXTENT * layerScale;
  const h1 = normEnd * H * HALF_EXTENT * layerScale;

  if (straight) {
    return `M 0 ${my - h0} L ${segW} ${my - h1} L ${segW} ${my + h1} L 0 ${my + h0} Z`;
  }

  const cx = segW * BEZIER_CONTROL;
  const top = `M 0 ${my - h0} C ${cx} ${my - h0}, ${segW - cx} ${my - h1}, ${segW} ${my - h1}`;
  const bot = `L ${segW} ${my + h1} C ${segW - cx} ${my + h1}, ${cx} ${my + h0}, 0 ${my + h0}`;
  return `${top} ${bot} Z`;
}

/**
 * One ring's SVG path for a VERTICAL funnel cell (local coords, origin at the
 * cell's top-left; the cell tapers from `normStart` on the top edge to
 * `normEnd` on the bottom).
 */
export function vSegmentPath(
  normStart: number,
  normEnd: number,
  segH: number,
  W: number,
  layerScale: number,
  straight = false,
): string {
  const mx = W / 2;
  const w0 = normStart * W * HALF_EXTENT * layerScale;
  const w1 = normEnd * W * HALF_EXTENT * layerScale;

  if (straight) {
    return `M ${mx - w0} 0 L ${mx - w1} ${segH} L ${mx + w1} ${segH} L ${mx + w0} 0 Z`;
  }

  const cy = segH * BEZIER_CONTROL;
  const left = `M ${mx - w0} 0 C ${mx - w0} ${cy}, ${mx - w1} ${segH - cy}, ${mx - w1} ${segH}`;
  const right = `L ${mx + w1} ${segH} C ${mx + w1} ${segH - cy}, ${mx + w0} ${cy}, ${mx + w0} 0`;
  return `${left} ${right} Z`;
}

export interface FunnelRing {
  /** Multiplier on the cross-axis extent; outer rings are larger (scale 1). */
  layerScale: number;
  /** The ring's own opacity in the halo ramp, before any hover dim. */
  ringOpacity: number;
}

/**
 * The halo ramp: `layers` concentric rings, OUTERMOST FIRST (so the solid core
 * paints last — SVG render order is z-order). Outer rings are larger and
 * fainter; the innermost (last) ring is the solid core. A single ring
 * (`layers === 1`) is fully opaque — the raw ramp would otherwise leave a lone
 * core at 0.18, near-invisible.
 */
export function funnelHaloRamp(layers: number): FunnelRing[] {
  const L = Math.max(1, Math.round(layers));
  return Array.from({ length: L }, (_, l) => ({
    layerScale: 1 - (l / L) * 0.35,
    ringOpacity: L === 1 ? 1 : 0.18 + (l / (L - 1)) * 0.65,
  }));
}

/**
 * Funnel percentage: relative to the FIRST stage (stage 0 = 100% = retention),
 * NOT share-of-total. `reference` is the first stage's value. Can exceed 100%
 * or go negative for non-monotonic data — that is informative, not a bug.
 */
export function funnelPercentage(value: number, reference: number): number {
  if (!Number.isFinite(reference) || reference === 0) return 0;
  return (value / reference) * 100;
}
