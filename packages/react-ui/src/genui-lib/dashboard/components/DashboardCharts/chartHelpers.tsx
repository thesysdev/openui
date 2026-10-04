const DASHBOARD_CHART_HEIGHT = 296;
const CONDENSED_CARTESIAN_AXIS_HEIGHT = 30;
const SCATTER_CHART_CHROME_HEIGHT = 22;

export { CONDENSED_CARTESIAN_AXIS_HEIGHT, DASHBOARD_CHART_HEIGHT, SCATTER_CHART_CHROME_HEIGHT };

export function unwrapProps<T extends Record<string, unknown>>(value: unknown): T {
  if (typeof value !== "object" || value === null) {
    return {} as T;
  }

  const obj = value as Record<string, unknown>;
  if (obj["type"] === "element" && typeof obj["props"] === "object" && obj["props"] !== null) {
    return obj["props"] as T;
  }

  return value as T;
}

export function buildChartData(
  labels: string[] | null | undefined,
  series: Array<{ category: string; values: number[] } | unknown> | null | undefined,
) {
  if (!labels?.length || !series?.length) return [];

  const normalizedSeries = series
    .map((item) => unwrapProps<{ category?: string; values?: number[] }>(item))
    .filter(
      (item): item is { category: string; values: number[] } =>
        typeof item.category === "string" && Array.isArray(item.values),
    );

  return labels.map((label, index) => {
    const point: Record<string, string | number> = { category: label };

    normalizedSeries.forEach((item) => {
      point[item.category] = item.values[index] ?? 0;
    });

    return point;
  });
}

export function buildSliceData(
  labels: string[] | null | undefined,
  values: number[] | null | undefined,
) {
  if (!labels?.length || !values?.length) return [];

  return labels.map((label, index) => ({
    category: label,
    value: values[index] ?? 0,
  }));
}

export function getCondensedCartesianChartHeight(height: number) {
  return Math.max(0, height - CONDENSED_CARTESIAN_AXIS_HEIGHT);
}
