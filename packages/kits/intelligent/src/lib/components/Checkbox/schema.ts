import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const CheckboxSchema = z.object({
  checked: reactive(z.boolean()),
  label: z.string(),
  lineThrough: z.boolean().optional(),
});
export type CheckboxProps = z.infer<typeof CheckboxSchema>;
