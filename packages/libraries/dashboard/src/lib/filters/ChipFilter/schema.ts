import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { optionSchema } from "../optionSchema";

export const chipFilterPropsSchema = z.object({
  name: z.string(),
  options: z.array(optionSchema),
  value: reactive(z.string().optional()),
  label: z.string().optional(),
});
export type ChipFilterSchemaProps = z.infer<typeof chipFilterPropsSchema>;
