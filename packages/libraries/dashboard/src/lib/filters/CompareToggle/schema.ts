import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { optionSchema } from "../optionSchema";

export const compareTogglePropsSchema = z.object({
  label: z.string().optional(),
  defaultOn: z.boolean().optional(),
  options: z.array(optionSchema).optional(),
  name: z.string().optional(),
  value: reactive(z.string().optional()),
});
export type CompareToggleSchemaProps = z.infer<typeof compareTogglePropsSchema>;
