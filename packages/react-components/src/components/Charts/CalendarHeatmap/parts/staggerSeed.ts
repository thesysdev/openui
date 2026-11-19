// Deterministic per-cell entrance stagger. Pure; no React/DOM/d3.
//
// The visual "scatter" of the contribution grid's fade-in is driven by a seeded
// PRNG so it is stable across renders (streaming-safe) and reproducible in
// tests. The seed combines column and row exactly as bklit's `heatmapCellSeed`
// (`col*1009 + row*9176`) so the stagger pattern matches upstream. bklit ran a
// Lehmer generator over that seed; here we use the classic Numerical-Recipes
// linear congruential generator (`s*1664525 + 1013904223 mod 2^32`) specified
// for this port. One LCG step per cell is enough for a well-spread [0,1) ratio.

const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;
const UINT32 = 2 ** 32;

/** Default share of the entrance window spent on staggered per-cell delays. */
const DEFAULT_STAGGER_SPREAD = 0.6;

/** Combines grid coordinates into a seed (bklit `heatmapCellSeed` parity). */
function cellSeed(col: number, row: number): number {
  return col * 1009 + row * 9176;
}

/** One LCG step, kept in the unsigned 32-bit range. */
function lcgNext(state: number): number {
  return (state * LCG_MULTIPLIER + LCG_INCREMENT) % UINT32;
}

/**
 * Deterministic pseudo-random ratio in `[0, 1)` for the cell at (`col`, `row`).
 * Same inputs always yield the same ratio; distinct cells spread across the
 * range so the entrance fade-in reads as an organic scatter, not a sweep.
 */
export function cellStaggerRatio(col: number, row: number): number {
  return lcgNext(cellSeed(col, row)) / UINT32;
}

/**
 * Per-cell entrance delay in milliseconds: `ratio * durationMs * spread`, so
 * every cell begins fading within `durationMs * spread` of the animation start.
 * `spread` (0..1, default 0.6) is the fraction of the window used for the
 * scatter — smaller values tighten the cells toward a simultaneous reveal.
 */
export function cellStaggerDelayMs(
  col: number,
  row: number,
  durationMs: number,
  spread: number = DEFAULT_STAGGER_SPREAD,
): number {
  return cellStaggerRatio(col, row) * durationMs * spread;
}
