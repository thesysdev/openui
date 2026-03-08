import { z } from "zod";

export const SliderSchema = z.object({
  name: z.string(),
  label: z.string().optional(),
  variant: z.enum(["continuous", "discrete"]),
  min: z.number(),
  max: z.number(),
  step: z.number().optional(),
  defaultValue: z.number().optional(),
  rules: z.array(z.string()).optional(),
});
