import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { goodWhenSchema, numbersSchema, toneSchema } from "../../../shared/schema";

export const kpiPropsSchema = z.object({
  label: z.string(),
  // Optional so a missing number (null) still draws its tile, with a dash.
  value: z.union([z.number(), z.string()]).nullable().optional(),
  format: formatSchema.optional(),
  previous: z.number().nullable().optional(),
  goodWhen: goodWhenSchema.optional(),
  hint: z.string().optional(),
  trend: numbersSchema.optional(),
  trendPrevious: numbersSchema.optional(),
  tone: toneSchema.optional(),
  target: z.number().optional(),
  split: z.array(z.object({ label: z.string(), value: z.number() })).optional(),
  // A union, so the signature brackets it: ("good" | "warning" | "bad" | null)[], not "good" | "warning" | "bad"[].
  states: z.array(z.union([z.enum(["good", "warning", "bad"]), z.literal(null)])).optional(),
});
export type KpiSchemaProps = z.infer<typeof kpiPropsSchema>;
