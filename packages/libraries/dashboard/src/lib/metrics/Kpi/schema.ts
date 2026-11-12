import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { goodWhenSchema, toneSchema } from "../../../shared/schema";
import { ProgressComponent } from "../Progress";
import { SplitComponent } from "../Split";
import { StatesComponent } from "../States";
import { TrendComponent } from "../Trend";

export const kpiPropsSchema = z.object({
  label: z.string(),
  // Optional so a missing number (null) still draws its tile, with a dash.
  value: z.union([z.number(), z.string()]).nullable().optional(),
  format: formatSchema.optional(),
  previous: z.number().nullable().optional(),
  goodWhen: goodWhenSchema.optional(),
  hint: z.string().optional(),
  chart: z
    .union([TrendComponent.ref, ProgressComponent.ref, SplitComponent.ref, StatesComponent.ref])
    .optional(),
  tone: toneSchema.optional(),
});
export type KpiSchemaProps = z.infer<typeof kpiPropsSchema>;
