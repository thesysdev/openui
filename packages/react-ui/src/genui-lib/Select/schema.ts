import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { rulesSchema } from "../rules";

type RefComponent = { ref: any };

export const SelectItemSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export function createSelectSchema(SelectItem: RefComponent) {
  return z.object({
    name: z.string(),
    items: z.array(SelectItem.ref),
    placeholder: z.string().optional(),
    rules: rulesSchema,
    value: reactive(z.string().optional()),
    size: z.enum(["sm", "md", "lg"]).optional(),
  });
}
