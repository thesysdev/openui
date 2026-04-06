import { z } from "zod";

export const ColSchema = z.object({
  label: z.string(),
  type: z.enum(["string", "number", "action"]).optional(),
});
