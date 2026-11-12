import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { optionSchema } from "../optionSchema";

export const compareTogglePropsSchema = z.object({
  value: reactive(z.string().optional()),
  options: z.array(optionSchema).optional(),
  label: z.string().optional(),
  defaultOn: z.boolean().optional(),
});
export type CompareToggleSchemaProps = z.infer<typeof compareTogglePropsSchema>;
