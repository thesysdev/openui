import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { rulesSchema } from "../style";

export const TextAreaSchema = z.object({
  value: reactive(z.string()),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  rows: z.number().optional(),
  rules: rulesSchema.optional(),
});
export type TextAreaProps = z.infer<typeof TextAreaSchema>;
