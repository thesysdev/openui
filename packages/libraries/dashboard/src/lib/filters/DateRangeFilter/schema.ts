import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { optionSchema } from "../optionSchema";

export const dateRangeFilterPropsSchema = z.object({
  name: z.string(),
  value: reactive(z.string().optional()),
  presets: z.array(optionSchema).optional(),
  label: z.string().optional(),
});
export type DateRangeFilterSchemaProps = z.infer<typeof dateRangeFilterPropsSchema>;
