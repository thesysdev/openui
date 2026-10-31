// Value → GitHub-style contribution level (0..4). Pure; no React/DOM/d3.
//
// Ported from bklit's getHeatmapContributionLevel, generalized to configurable
// thresholds. A value maps to the highest level whose threshold it meets or
// exceeds; anything below the first threshold (including negatives) is level 0.

/**
 * Maps a contribution value to a legend level 0..4.
 *
 * `thresholds` is the ascending [t1,t2,t3,t4] cutoff for levels 1..4: a value
 * `v` yields the largest `i` with `v >= t[i]`, or 0 if `v < t1`. Defaults to
 * `[1,2,3,4]` — the GitHub scale where each of the first four counts is its own
 * level and 4+ saturates.
 */
export function contributionLevel(
  value: number,
  thresholds: readonly [number, number, number, number] = [1, 2, 3, 4],
): 0 | 1 | 2 | 3 | 4 {
  if (value >= thresholds[3]) return 4;
  if (value >= thresholds[2]) return 3;
  if (value >= thresholds[1]) return 2;
  if (value >= thresholds[0]) return 1;
  return 0;
}
