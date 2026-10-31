import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { options } from "../controlHelpers";
import { rulesSchema } from "../helpers";

export const SelectSchema = z.object({
  value: reactive(z.string()),
  options,
  label: z.string().optional(),
  placeholder: z.string().optional(),
  rules: rulesSchema.optional(),
});
export type SelectProps = z.infer<typeof SelectSchema>;
