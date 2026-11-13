import { z } from "zod/v4";
import { formatSchema } from "../../../shared/format";
import { goodWhenSchema, numbersSchema, toneSchema } from "../../../shared/schema";

export const columnPropsSchema = z.object({
  label: z.string(),
  // z.literal(null), not z.null(): the signature printer writes z.null() as "any".
  values: z.array(
    z.union([
      z.string(),
      z.number(),
      z.literal(null),
      numbersSchema,
      z.array(z.string().nullable()),
    ]),
  ),
  kind: z
    .enum([
      "text",
      "primary",
      "number",
      "bar",
      "delta",
      "badge",
      "sparkline",
      "chip",
      "date",
      "progress",
      "states",
      "link",
      "person",
    ])
    .optional(),
  format: formatSchema.optional(),
  tones: z.record(z.string(), toneSchema).optional(),
  goodWhen: goodWhenSchema.optional(),
  total: z.enum(["sum", "average"]).optional(),
});
export type ColumnSchemaProps = z.infer<typeof columnPropsSchema>;
