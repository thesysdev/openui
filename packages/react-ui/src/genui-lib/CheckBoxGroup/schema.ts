import { z } from "zod";
import { rulesSchema } from "../rules";

export const CheckBoxItemSchema = z.object({
  label: z.string(),
  description: z.string(),
  name: z.string(),
  defaultChecked: z.boolean().optional(),
});

export const CheckBoxGroupSchema = z.object({
  name: z.string(),
  items: z.array(z.any()), // filled by CheckBoxItem.ref in index
  rules: rulesSchema,
});
