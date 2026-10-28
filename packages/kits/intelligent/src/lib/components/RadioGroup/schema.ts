import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { choice } from "../controlHelpers";

export const RadioGroupSchema = z.object({
  value: reactive(z.string()),
  options: z.array(choice),
  label: z.string().optional(),
  variant: z.enum(["list", "pills", "cards"]).optional(),
});
export type RadioGroupProps = z.infer<typeof RadioGroupSchema>;
