import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";

export const InputSchema = z.object({
  value: reactive(z.union([z.string(), z.number()])),
  label: z.string().optional(),
  type: z.enum(["text", "number"]).optional(),
  placeholder: z.string().optional(),
});
export type InputProps = z.infer<typeof InputSchema>;
