import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { optionSchema } from "../optionSchema";

export const multiSelectFilterPropsSchema = z.object({
  name: z.string(),
  label: z.string(),
  options: z.array(optionSchema),
  value: reactive(z.array(z.string()).optional()),
});
export type MultiSelectFilterSchemaProps = z.infer<typeof multiSelectFilterPropsSchema>;
