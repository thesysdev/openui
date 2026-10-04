import { z } from "zod/v4";
import { DASHBOARD_CHART_HEIGHT } from "../chartHelpers";

export const pieChartPropsSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()),
  variant: z.enum(["pie", "donut"]).optional(),
  legendVariant: z.enum(["default", "stacked"]).optional(),
  height: z.union([z.number(), z.string()]).default(DASHBOARD_CHART_HEIGHT),
  appearance: z.enum(["circular", "semiCircular"]).optional(),
});

export type PieChartProps = z.infer<typeof pieChartPropsSchema>;
