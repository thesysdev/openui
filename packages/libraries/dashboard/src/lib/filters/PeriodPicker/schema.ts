import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { optionSchema } from "../optionSchema";

export const periodPickerPropsSchema = z.object({
  name: z.string(),
  options: z.array(optionSchema),
  value: reactive(z.string().optional()),
});
export type PeriodPickerSchemaProps = z.infer<typeof periodPickerPropsSchema>;
