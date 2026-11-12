import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { optionSchema } from "../optionSchema";

export const multiSelectFilterPropsSchema = z.object({
  value: reactive(z.array(z.string())),
  options: z.array(optionSchema),
  label: z.string(),
});
export type MultiSelectFilterSchemaProps = z.infer<typeof multiSelectFilterPropsSchema>;
