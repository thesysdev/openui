import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { rulesSchema } from "../helpers";

export const InputSchema = z.object({
  value: reactive(z.union([z.string(), z.number()])),
  label: z.string().optional(),
  type: z.enum(["text", "number"]).optional(),
  placeholder: z.string().optional(),
  rules: rulesSchema.optional(),
});
export type InputProps = z.infer<typeof InputSchema>;
