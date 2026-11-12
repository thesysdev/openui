import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { optionSchema } from "../optionSchema";

export const periodPickerPropsSchema = z.object({
  value: reactive(z.string()),
  options: z.array(optionSchema),
});
export type PeriodPickerSchemaProps = z.infer<typeof periodPickerPropsSchema>;
