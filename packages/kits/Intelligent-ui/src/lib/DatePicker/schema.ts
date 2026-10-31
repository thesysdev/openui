import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { rulesSchema } from "../helpers";

export const DatePickerSchema = z.object({
  value: reactive(z.string()),
  label: z.string().optional(),
  min: z.string().optional(),
  max: z.string().optional(),
  rules: rulesSchema.optional(),
});
export type DatePickerProps = z.infer<typeof DatePickerSchema>;
