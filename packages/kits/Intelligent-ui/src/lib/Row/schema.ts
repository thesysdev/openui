import { z } from "zod/v4";
import { align, children, justify } from "../helpers";

export const RowSchema = z.object({
  children,
  gap: z.number().optional(),
  align: align.optional(),
  justify: justify.optional(),
  wrap: z.boolean().optional(),
});

export type RowProps = z.infer<typeof RowSchema>;
