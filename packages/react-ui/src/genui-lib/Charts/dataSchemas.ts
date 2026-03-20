import { z } from "zod";

export const chart1DDataSchema = z.array(
  z.object({
    category: z.string(),
    value: z.number(),
  }),
);

export const chart2DDataSchema = z.object({
  labels: z.array(z.string()),
  series: z
    .array(
      z.object({
        category: z.string(),
        values: z.array(z.number()),
      }),
    )
    // FIX: allow missing/undefined and fallback to []
    .optional()
    .default([]),
});

export const scatterDataSchema = z.array(
  z.object({
    name: z.string(),
    series: z
      .array(
        z.object({
          x: z.number(),
          y: z.number(),
          z: z.number().optional(),
        }),
      )
      // FIX: ensure safe default for streaming cases
      .optional()
      .default([]),
  }),
);

export const miniChartDataSchema = z.array(z.number());

export type Chart1DData = z.infer<typeof chart1DDataSchema>;
export type Chart2DData = z.infer<typeof chart2DDataSchema>;
export type ScatterData = z.infer<typeof scatterDataSchema>;
export type MiniChartData = z.infer<typeof miniChartDataSchema>;

export function transform2DData(data: Chart2DData): Array<Record<string, string | number>> {
  // FIX: ensure labels is always array
  const labels = Array.isArray(data.labels) ? data.labels : [];

  // FIX: ensure series is always array
  const series = Array.isArray(data.series) ? data.series : [];

  return labels.map((label, i) => {
    const row: Record<string, string | number> = { category: label };
    for (const s of series) {
      row[s.category] = s.values?.[i] ?? 0;
    }
    return row;
  });
}

export function transform1DData(data: Chart1DData): Array<Record<string, string | number>> {
  return data as Array<Record<string, string | number>>;
}

export function transformScatterData(
  data: ScatterData,
): Array<{ name: string; data: Array<{ x: number; y: number; z?: number }> }> {
  // FIX: ensure safe iteration
  const safeData = Array.isArray(data) ? data : [];

  return safeData.map((dataset) => ({
    name: dataset.name,
    data: Array.isArray(dataset.series) ? dataset.series : [],
  }));
}