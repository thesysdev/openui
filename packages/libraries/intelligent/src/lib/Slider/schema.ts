import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const SliderSchema = z.object({
  value: reactive(z.number()),
  min: z.number(),
  max: z.number(),
  step: z.number().optional(),
  label: z.string().optional(),
  unit: z.string().optional(),
  marks: z.array(z.object({ value: z.number(), label: z.string() })).optional(),
});

export type SliderProps = z.infer<typeof SliderSchema>;
