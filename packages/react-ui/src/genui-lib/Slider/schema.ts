import { reactive } from "@openuidev/react-lang";
import { z } from "zod";
import { rulesSchema } from "../rules";

export const SliderSchema = z.object({
  name: z.string(),
  variant: z.enum(["continuous", "discrete"]),
  min: z.number(),
  max: z.number(),
  step: z.number().optional(),
  defaultValue: z.array(z.number()).optional(),
  label: z.string().optional(),
  rules: rulesSchema,
  value: reactive(z.array(z.number()).optional()),
});
