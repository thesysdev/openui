import { z } from "zod/v4";

/**
 * Unchanged from the kit's original Chart. The type is an ARGUMENT, not the
 * component name, because programs switch it at runtime:
 *
 *   $type = "bar"
 *   SegmentedControl($type, ["bar", "line", "area"])
 *   chart = Chart($type, rows, "year", [...], "currency", null, $type != "line")
 *
 * Splitting this into BarChart/LineChart/AreaChart the way the chat and
 * dashboard kits do cannot express that, so the vocabulary stays as it is and
 * only the rendering moves to @openuidev/react-components.
 */
export const ChartSchema = z.object({
  type: z.enum(["bar", "line", "area", "pie", "donut", "scatter"]),
  data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
  x: z.string().optional(),
  series: z.array(z.string()).optional(),
  format: z.enum(["number", "currency", "percent"]).optional(),
  currency: z.string().optional(),
  stacked: z.boolean().optional(),
  height: z.number().optional(),
});

export type ChartProps = z.infer<typeof ChartSchema>;
