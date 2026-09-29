// Sampling a fixed-size discrete color scale out of an ordered ramp. Pure; no
// React/DOM/d3. Shared by the CalendarHeatmap (5 contribution levels) and the
// choropleth bins (Task 8) so neither duplicates the endpoint-inclusive
// even-spacing pick.

/**
 * Evenly-spaced stops sampled from an ordered ramp, endpoints always included.
 *
 * Collapses a palette of any length to exactly `count` colors: stop `i` maps to
 * ramp position `i / (count - 1)`, rounded to the nearest source index. Stop 0
 * is always `colors[0]` and the last stop always `colors[last]`, so the sampled
 * scale keeps the ramp's low→high ordering (the same convention HeatmapChart's
 * quantize ramp uses). A single-color ramp repeats that color; an empty ramp
 * yields an empty array (callers resolve a non-empty ramp via `resolvePalette`
 * first).
 */
export function sampleRampStops(colors: readonly string[], count: number): string[] {
  if (count <= 0 || colors.length === 0) return [];
  if (colors.length === 1) return Array.from({ length: count }, () => colors[0]!);
  if (count === 1) return [colors[0]!];

  const lastSource = colors.length - 1;
  const lastStop = count - 1;
  return Array.from({ length: count }, (_, i) => {
    const index = Math.round((i / lastStop) * lastSource);
    return colors[index]!;
  });
}
