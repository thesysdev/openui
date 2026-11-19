// Orientation-neutral rounded-bar geometry shared by the vertical and
// horizontal BarChart renderers: the per-corner rounded-rect SVG path (plus the
// minimum-width threshold that suppresses its rounding). Kept out of the React
// layer so every value is unit-testable in isolation (node env, no DOM).
//
// Ported from openui's LineInBarShape path geometry.

/** A bar's extent (its rounded dimension) must reach this before its corners
 *  round; narrower bars render as plain rectangles (px). openui MIN_BAR_WIDTH. */
export const MIN_BAR_WIDTH = 2;

/**
 * SVG `<path d>` for a bar as a rounded rectangle at `(x, y)` of size `w × h`,
 * with per-corner radii `[tl, tr, br, bl]`. Traversed clockwise (top edge
 * →, right ↓, bottom ←, left ↑) with `sweep=1` convex quarter-arcs; a corner
 * with radius 0 is a plain `L`. All rounding is SUPPRESSED — the bar becomes a
 * plain rectangle — when the bar is too thin (`h < 7`) or too short
 * (`w < MIN_BAR_WIDTH`), matching openui's LineInBarShape thresholds. Each
 * corner radius is then CLAMPED per corner to the bar's half-dimensions
 * (`min(r, w/2, h/2)`) so a narrow or short bar can never produce a
 * self-crossing or overhanging path (a coordinate left of `x` / above `y`) —
 * stricter than openui, which omits this clamp. The caller always passes a
 * non-negative `w` (it positions `x` at the left edge for negative bars), so
 * this stays sign-agnostic. Orientation-neutral: vertical bars round their
 * top/bottom corners, horizontal bars their left/right — the caller picks the
 * radii array.
 */
export function roundedBarPath(
  x: number,
  y: number,
  w: number,
  h: number,
  radii: [number, number, number, number],
): string {
  const base = h < 7 || w < MIN_BAR_WIDTH ? [0, 0, 0, 0] : radii;
  // Clamp each corner independently to half the bar's smaller dimension so the
  // quarter-arcs can never overshoot the bar box (no path point < x or < y).
  const maxRadius = Math.min(w / 2, h / 2);
  const tl = Math.min(base[0]!, maxRadius);
  const tr = Math.min(base[1]!, maxRadius);
  const br = Math.min(base[2]!, maxRadius);
  const bl = Math.min(base[3]!, maxRadius);

  const right = x + w;
  const bottom = y + h;

  return [
    `M ${x + tl},${y}`,
    `L ${right - tr},${y}`,
    tr > 0 ? `A ${tr},${tr} 0 0 1 ${right},${y + tr}` : `L ${right},${y}`,
    `L ${right},${bottom - br}`,
    br > 0 ? `A ${br},${br} 0 0 1 ${right - br},${bottom}` : `L ${right},${bottom}`,
    `L ${x + bl},${bottom}`,
    bl > 0 ? `A ${bl},${bl} 0 0 1 ${x},${bottom - bl}` : `L ${x},${bottom}`,
    `L ${x},${y + tl}`,
    tl > 0 ? `A ${tl},${tl} 0 0 1 ${x + tl},${y}` : `L ${x},${y}`,
    "Z",
  ].join(" ");
}
