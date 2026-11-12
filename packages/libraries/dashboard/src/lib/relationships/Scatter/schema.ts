import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { ReferenceComponent } from "../../trends/Reference";
const pointSchema = z.object({
  label: z.string(),
  // null when a measure is missing: the point isn't drawn, and the chart names it under the plot.
  x: z.union([z.number(), z.literal(null)]).optional(),
  y: z.union([z.number(), z.literal(null)]).optional(),
  size: z.number().optional(),
  group: z.string().optional(),
});

export const scatterPropsSchema = z.object({
  points: z.array(pointSchema),
  xLabel: z.string(),
  yLabel: z.string(),
  xFormat: formatSchema.optional(),
  yFormat: formatSchema.optional(),
  references: z.array(ReferenceComponent.ref).optional(),
  sizeLabel: z.string().optional(),
  quadrants: z.array(z.string()).optional(),
});
export type ScatterSchemaProps = z.infer<typeof scatterPropsSchema>;
