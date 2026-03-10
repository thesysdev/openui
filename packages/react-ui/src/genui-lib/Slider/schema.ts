import { z } from "zod";
import { rulesSchema } from "../rules";

export const SliderSchema = z.object({
  name: z.string(),
  label: z.string().optional(),
  variant: z.enum(["continuous", "discrete"]),
  min: z.number(),
  max: z.number(),
  step: z.number().optional(),
  defaultValue: z.array(z.number()).optional(),
  rules: rulesSchema,
});
