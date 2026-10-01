// Charts in this library take number[] series (no nulls), so shape lap series for them here:
// drop a series that is mostly empty (a driver who retired early), then keep only the laps every
// remaining series has. Rows keep the nulls; the chart never invents a value.

export interface ChartData {
  labels: string[];
  series: { name: string; values: number[] }[];
  xLabel?: string;
  yLabel?: string;
  /** Laps (labels) left out because a series had no value there. */
  omitted?: string[];
  /** Series left out because they cover too little of the range. */
  excludedSeries?: string[];
}

export function lapChart(
  labels: string[],
  series: { name: string; values: Array<number | null | undefined> }[],
  axes: { xLabel?: string; yLabel?: string } = {},
): ChartData {
  const excluded = series.filter((s) => s.values.filter((v) => v != null).length < labels.length * 0.8);
  const kept = series.filter((s) => !excluded.includes(s));
  const keep = labels.map((_, i) => kept.length > 0 && kept.every((s) => s.values[i] != null));
  return {
    labels: labels.filter((_, i) => keep[i]),
    series: kept.map((s) => ({ name: s.name, values: s.values.filter((_, i) => keep[i]) as number[] })),
    ...axes,
    ...(keep.some((k) => !k) ? { omitted: labels.filter((_, i) => !keep[i]) } : {}),
    ...(excluded.length ? { excludedSeries: excluded.map((s) => s.name) } : {}),
  };
}
