import { z } from "zod/v4";

export const ColSchema = z.object({
  /** Column header label */
  label: z.string(),
  /** Column data — array of values or components (one per row). Use array pluck for text, Each() for styled cells like Tag. */
  data: z.any(),
  /** Optional display type hint */
  type: z.enum(["string", "number", "action"]).optional(),
});
