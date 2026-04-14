import { z } from "zod/v4";

export const FlexPropsSchema = z.object({
  direction: z.enum(["row", "column"]).optional(),
  gap: z.enum(["none", "xs", "s", "m", "l", "xl", "2xl"]).optional(),
  align: z.enum(["start", "center", "end", "stretch", "baseline"]).optional(),
  justify: z.enum(["start", "center", "end", "between", "around", "evenly"]).optional(),
  wrap: z.boolean().optional(),
});

export const StackSchema = z
  .object({
    children: z.array(z.any()),
  })
  .merge(FlexPropsSchema);
