import { z } from "zod";

export const SwitchItemSchema = z.object({
  label: z.string().optional(),
  description: z.string().optional(),
  name: z.string(),
  defaultChecked: z.boolean().optional(),
});

export const SwitchGroupSchema = z.object({
  name: z.string(),
  items: z.array(z.any()), // filled by SwitchItem.ref in index
  variant: z.enum(["clear", "card", "sunk"]).optional(),
});
