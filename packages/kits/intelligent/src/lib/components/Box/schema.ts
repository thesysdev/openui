import { z } from "zod/v4";
import { align, justify } from "../layoutHelpers";
import { children, color, length, radiusSchema } from "../style";

export const BoxSchema = z.object({
  children: children.optional(),
  direction: z.enum(["row", "col"]).optional(),
  gap: z.number().optional(),
  padding: z.number().optional(),
  background: color.optional(),
  radius: radiusSchema.optional(),
  border: z.boolean().optional(),
  width: length.optional(),
  height: length.optional(),
  flex: z.number().optional(),
  align: align.optional(),
  justify: justify.optional(),
  wrap: z.boolean().optional(),
});

export type BoxProps = z.infer<typeof BoxSchema>;
