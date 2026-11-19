import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { optionSchema } from "../optionSchema";

export const dateRangeFilterPropsSchema = z.object({
  value: reactive(z.string()),
  options: z.array(optionSchema).optional(),
  label: z.string().optional(),
});
export type DateRangeFilterSchemaProps = z.infer<typeof dateRangeFilterPropsSchema>;
