import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const DatePickerSchema = z.object({
  value: reactive(z.string()),
  label: z.string().optional(),
  min: z.string().optional(),
  max: z.string().optional(),
});
export type DatePickerProps = z.infer<typeof DatePickerSchema>;
