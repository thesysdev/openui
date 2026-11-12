import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { numbersSchema } from "../../../shared/schema";
import { ReferenceComponent } from "../../trends/Reference";

export const scatterPropsSchema = z.object({
  labels: z.array(z.string()),
  // null when a measure is missing: the point isn't drawn, and the chart names it under the plot.
  xs: numbersSchema,
  ys: numbersSchema,
  xLabel: z.string(),
  yLabel: z.string(),
  xFormat: formatSchema.optional(),
  yFormat: formatSchema.optional(),
  sizes: numbersSchema.optional(),
  groups: z.array(z.string()).optional(),
  references: z.array(ReferenceComponent.ref).optional(),
  sizeLabel: z.string().optional(),
  quadrants: z.array(z.string()).optional(),
});
export type ScatterSchemaProps = z.infer<typeof scatterPropsSchema>;
